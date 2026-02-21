import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getUserAIConfig, askAIStreaming } from "@/lib/ai/ai-provider";
import {
  CONTENT_VARIATIONS_SYSTEM_PROMPT,
  buildBrandAwareSystemPrompt,
} from "@/lib/ai/prompts";
import { detectLanguageOrDefault } from "@/lib/ai/language-detect";

export const maxDuration = 600;

export interface VariationItem {
  variant: string;
  label: string;
  content: string;
  hashtags: string;
  approach: string;
}

export interface VariationsResult {
  variations: VariationItem[];
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const t = await getTranslations("ai");
  const locale = await getLocale();
  const userId = session.user.id;
  let content: string;
  let platforms: string[];

  try {
    const body = await request.json();
    content = body.content;
    platforms = body.platforms;
  } catch {
    return new Response(
      JSON.stringify({ error: t("invalidRequest") }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!content) {
    return new Response(
      JSON.stringify({ error: t("contentRequired") }),
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
  const contentLanguage = detectLanguageOrDefault(content, locale);

  const systemPrompt = buildBrandAwareSystemPrompt(
    CONTENT_VARIATIONS_SYSTEM_PROMPT,
    brandStyle,
    contentLanguage
  );

  const platformInfo = platforms?.length
    ? `Target platforms: ${platforms.join(", ")}\n\n`
    : "";
  const message = `${platformInfo}Create 3 content variations for the following post content:\n\n${content}`;

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

        let result: VariationsResult;
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON found");
          result = JSON.parse(jsonMatch[0]) as VariationsResult;
        } catch {
          result = {
            variations: [],
          };
        }

        // Ergebnis in DB speichern
        try {
          await prisma.aIInsight.create({
            data: {
              userId,
              type: "CONTENT_VARIATION",
              data: JSON.parse(JSON.stringify(result)),
              inputData: JSON.parse(JSON.stringify({ content, platforms })),
              durationMs,
              modelUsed: config.model,
            },
          });
        } catch (dbError) {
          console.error("Failed to save AI insight:", dbError);
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "result", data: result, durationMs, modelUsed: config.model })}\n\n`
          )
        );
        controller.close();
      } catch (error) {
        clearInterval(keepAlive);
        console.error("AI variations generation error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: t("analysisError") })}\n\n`
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
