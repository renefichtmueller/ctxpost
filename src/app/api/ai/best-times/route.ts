import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getUserAIConfig, askAIStreaming } from "@/lib/ai/ai-provider";
import { BEST_TIMES_SYSTEM_PROMPT, getLanguageInstruction } from "@/lib/ai/prompts";
import { BestTimesAnalysis } from "@/lib/ai/analyze";

export const maxDuration = 600; // 10 minutes

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.user.id;
  const locale = await getLocale();
  const config = await getUserAIConfig(userId, "analysis");

  // Fetch analytics data from last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const analytics = await prisma.postAnalytics.findMany({
    where: {
      post: { userId: session.user.id },
      fetchedAt: { gte: ninetyDaysAgo },
    },
    include: {
      post: {
        select: {
          publishedAt: true,
          scheduledAt: true,
        },
      },
    },
    orderBy: { fetchedAt: "desc" },
  });

  let message: string;
  if (analytics.length === 0) {
    message =
      "No engagement data available yet. Please recommend the best posting times based on general best practices for Facebook and LinkedIn.";
  } else {
    const dataPoints = analytics.map((a) => ({
      platform: a.platform,
      publishedAt:
        a.post.publishedAt?.toISOString() || a.post.scheduledAt?.toISOString(),
      dayOfWeek: a.post.publishedAt?.toLocaleDateString("en-US", {
        weekday: "long",
      }),
      hour: a.post.publishedAt?.getUTCHours(),
      likes: a.likes,
      comments: a.comments,
      shares: a.shares,
      impressions: a.impressions,
      engagementRate: a.engagementRate,
    }));
    message = `Analyze the following engagement data and recommend the best posting times:\n\n${JSON.stringify(dataPoints, null, 2)}`;
  }

  // Use SSE to keep Cloudflare connection alive
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial SSE ping
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`)
      );

      // Set up keepalive interval (every 15s)
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`)
          );
        } catch {
          clearInterval(keepAlive);
        }
      }, 15000);

      try {
        const llmStartTime = Date.now();

        const response = await askAIStreaming(
          config,
          BEST_TIMES_SYSTEM_PROMPT + getLanguageInstruction(locale),
          message,
          () => {
            try {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "progress" })}\n\n`
                )
              );
            } catch {
              // Stream already closed
            }
          }
        );

        const durationMs = Date.now() - llmStartTime;
        clearInterval(keepAlive);

        // Parse the response
        let result: BestTimesAnalysis;
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON found");
          result = JSON.parse(jsonMatch[0]) as BestTimesAnalysis;
        } catch {
          result = getDefaultRecommendations();
        }

        // Ergebnis in DB speichern
        try {
          await prisma.aIInsight.create({
            data: {
              userId,
              type: "BEST_TIMES",
              data: JSON.parse(JSON.stringify(result)),
              durationMs,
              modelUsed: config.model,
              confidenceLevel: result.confidenceLevel || "low",
            },
          });
        } catch (dbError) {
          console.error("Failed to save AI insight:", dbError);
        }

        // Send final result with server-side duration
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "result", data: result, durationMs, modelUsed: config.model })}\n\n`
          )
        );
        controller.close();
      } catch (error) {
        clearInterval(keepAlive);
        console.error("AI best times analysis error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: "Analysis failed" })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}

function getDefaultRecommendations(): BestTimesAnalysis {
  return {
    recommendations: [
      {
        platform: "FACEBOOK",
        bestDays: ["Wednesday", "Thursday", "Friday"],
        bestTimeSlots: [
          {
            start: "09:00",
            end: "11:00",
            score: 0.85,
            reason: "Highest general engagement rate",
          },
          {
            start: "13:00",
            end: "15:00",
            score: 0.75,
            reason: "Lunch break traffic",
          },
        ],
        worstTimeSlots: [
          {
            start: "23:00",
            end: "06:00",
            score: 0.1,
            reason: "Low user activity",
          },
        ],
      },
      {
        platform: "LINKEDIN",
        bestDays: ["Tuesday", "Wednesday", "Thursday"],
        bestTimeSlots: [
          {
            start: "08:00",
            end: "10:00",
            score: 0.9,
            reason: "Start of workday, high LinkedIn usage",
          },
          {
            start: "12:00",
            end: "13:00",
            score: 0.8,
            reason: "Lunch break",
          },
        ],
        worstTimeSlots: [
          {
            start: "20:00",
            end: "07:00",
            score: 0.1,
            reason: "Outside business hours",
          },
        ],
      },
    ],
    generalInsights: [
      "Based on general best practices (no historical data available)",
    ],
    confidenceLevel: "low",
  };
}
