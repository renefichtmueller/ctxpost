import { NextRequest, NextResponse } from "next/server";
import { getTranslations, getLocale } from "next-intl/server";
import { withAuthAndRateLimit } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getUserAIConfig, askAIStreaming } from "@/lib/ai/ai-provider";
import { buildBrandAwareSystemPrompt } from "@/lib/ai/prompts";
import { detectLanguageOrDefault } from "@/lib/ai/language-detect";

export const maxDuration = 600; // 10 minutes

const TONE_LABELS: Record<string, string> = {
  professional: "Professional and factual",
  casual: "Casual, approachable and conversational",
  humorous: "Humorous and entertaining",
  inspirational: "Inspiring and motivating",
  informative: "Informative and educational",
};

function getTimeOfDayContext(): { period: string; advice: string } {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 11) {
    return {
      period: "Morning (6-10 AM)",
      advice:
        "Light, motivating content works best now. Users are starting their day and prefer short, positive posts with energy and inspiration.",
    };
  } else if (hour >= 11 && hour < 14) {
    return {
      period: "Midday (11 AM-2 PM)",
      advice:
        "Entertaining, casual content works best now. Users are on break and scrolling relaxedly. Interactive content, polls and fun facts perform well.",
    };
  } else if (hour >= 14 && hour < 18) {
    return {
      period: "Afternoon (2-6 PM)",
      advice:
        "Informative, in-depth content works best now. Users are focused and ready to consume longer content like expert articles, tutorials or case studies.",
    };
  } else if (hour >= 18 && hour < 22) {
    return {
      period: "Evening (6-10 PM)",
      advice:
        "Relaxing, captivating content works best now (doom-scrolling time). Storytelling, visual posts and community engagement questions perform particularly well here.",
    };
  } else {
    return {
      period: "Night (10 PM-6 AM)",
      advice:
        "Engagement is low at this time. Create the text for publication tomorrow morning. Schedule the post for optimal reach the next morning.",
    };
  }
}

const TEXT_GENERATOR_SYSTEM_PROMPT = `You are an experienced social media content creator and copywriter.
Your task is to create a finished social media post from keywords, topics or short sentences.

Return your answer as JSON:
{
  "content": "The finished social media post text",
  "suggestions": ["Alternative idea 1", "Alternative idea 2", "Alternative idea 3"]
}

Rules:
- Create ONE finished, ready-to-publish post
- The post should sound natural and authentic, not AI-generated
- Adapt length and style to the target platform(s)
- Include appropriate emojis if they fit the tone
- Close with a call-to-action if appropriate
- The "suggestions" should contain 2-3 alternative topic ideas or variation suggestions

Reply ONLY with the JSON, no additional explanations.`;

export async function POST(request: NextRequest) {
  const authResult = await withAuthAndRateLimit(request);
  if (authResult instanceof NextResponse) return authResult;

  const t = await getTranslations("ai");
  const locale = await getLocale();
  const userId = authResult.userId;
  let keywords: string;
  let tone: string;
  let platforms: string[];

  try {
    const body = await request.json();
    keywords = body.keywords;
    tone = body.tone;
    platforms = body.platforms;
  } catch {
    return new Response(
      JSON.stringify({ error: t("invalidRequest") }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!keywords || !tone || !platforms?.length) {
    return new Response(
      JSON.stringify({
        error: t("keywordsRequired"),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const [config, brandStyle] = await Promise.all([
    getUserAIConfig(userId, "text"),
    prisma.brandStyleGuide.findUnique({
      where: { userId },
      select: {
        name: true,
        tone: true,
        formality: true,
        emojiUsage: true,
        targetAudience: true,
        brandVoice: true,
        avoidTopics: true,
        preferredTopics: true,
        hashtagStrategy: true,
        preferredHashtags: true,
        languages: true,
        customInstructions: true,
      },
    }),
  ]);

  // Auto-detect content language from user input, fall back to UI locale
  const contentLanguage = detectLanguageOrDefault(keywords, locale);

  const systemPrompt = buildBrandAwareSystemPrompt(
    TEXT_GENERATOR_SYSTEM_PROMPT,
    brandStyle,
    contentLanguage
  );

  const timeContext = getTimeOfDayContext();
  const toneLabel = TONE_LABELS[tone] || tone;

  const message = `Create a social media post based on the following inputs:

Keywords / Topic: ${keywords}

Desired tone: ${toneLabel}

Target platform(s): ${platforms.join(", ")}

Time of day context (${timeContext.period}): ${timeContext.advice}

Please consider the time of day when choosing the content type and approach. The post should match the current time of day and user habits.`;

  // Use SSE to keep Cloudflare connection alive
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`)
      );

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
          systemPrompt,
          message,
          () => {
            try {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "progress" })}\n\n`
                )
              );
            } catch {
              // Stream closed
            }
          }
        );

        const durationMs = Date.now() - llmStartTime;
        clearInterval(keepAlive);

        let result: { content: string; suggestions: string[] };
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON found");
          result = JSON.parse(jsonMatch[0]) as {
            content: string;
            suggestions: string[];
          };
        } catch {
          // Fallback: use raw response as content
          result = {
            content: response.trim(),
            suggestions: [],
          };
        }

        // Save insight to DB
        try {
          await prisma.aIInsight.create({
            data: {
              userId,
              type: "TEXT_GENERATION",
              data: JSON.parse(JSON.stringify(result)),
              inputData: JSON.parse(
                JSON.stringify({ keywords, tone, platforms })
              ),
              durationMs,
              modelUsed: config.model,
            },
          });
        } catch (dbError) {
          console.error("Failed to save AI insight:", dbError);
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "result",
              data: result,
              durationMs,
              modelUsed: config.model,
            })}\n\n`
          )
        );
        controller.close();
      } catch (error) {
        clearInterval(keepAlive);
        console.error("AI text generation error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              error: t("analysisError"),
            })}\n\n`
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
      "X-Accel-Buffering": "no",
    },
  });
}
