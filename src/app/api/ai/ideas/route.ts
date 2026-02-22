import { NextRequest, NextResponse } from "next/server";
import { withAuthAndRateLimit } from "@/lib/api-utils";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getUserAIConfig, askAI } from "@/lib/ai/ai-provider";
import { buildBrandAwareSystemPrompt } from "@/lib/ai/prompts";
import { detectLanguageOrDefault } from "@/lib/ai/language-detect";

const IDEAS_SYSTEM_PROMPT = `You are a creative social media content strategist.
Generate post ideas based on the given topic (or general trending topics if none provided).
Return your response as JSON with the following structure:
{
  "suggestions": [
    {
      "title": "Short catchy title for the idea",
      "content": "A brief description or draft of the post (2-3 sentences)",
      "category": "Category like 'engagement', 'educational', 'promotional', 'storytelling', 'trending', etc.",
      "platform": "Best suited platform like 'FACEBOOK', 'LINKEDIN', or 'ALL'"
    }
  ]
}

Rules:
- Generate creative, engaging post ideas
- Each idea should be actionable and ready to develop into a full post
- Vary the categories and approaches across suggestions
- Consider platform-specific best practices
- If a topic is provided, all ideas should relate to that topic
- If no topic is provided, suggest diverse trending content ideas

Reply ONLY with the JSON, no additional explanations.`;

interface IdeaSuggestion {
  title: string;
  content: string;
  category: string;
  platform: string;
}

interface IdeasResult {
  suggestions: IdeaSuggestion[];
}

export async function POST(request: NextRequest) {
  const authResult = await withAuthAndRateLimit(request);
  if (authResult instanceof NextResponse) return authResult;

  const userId = authResult.userId;
  let topic: string | undefined;
  let count: number;
  let platforms: string[];

  try {
    const body = await request.json();
    topic = body.topic;
    count = body.count || 5;
    platforms = body.platforms || [];
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!platforms.length) {
    platforms = ["FACEBOOK", "LINKEDIN"];
  }

  try {
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

    const locale = await getLocale();
    const contentLanguage = topic
      ? detectLanguageOrDefault(topic, locale)
      : locale;

    const systemPrompt = buildBrandAwareSystemPrompt(
      IDEAS_SYSTEM_PROMPT,
      brandStyle,
      contentLanguage
    );

    const userMessage = topic
      ? `Generate ${count} creative post ideas about the following topic for the platforms ${platforms.join(", ")}:\n\nTopic: ${topic}`
      : `Generate ${count} creative and diverse post ideas for the platforms ${platforms.join(", ")}. Focus on trending themes and engaging content.`;

    const llmStartTime = Date.now();
    const response = await askAI(config, systemPrompt, userMessage);
    const durationMs = Date.now() - llmStartTime;

    let result: IdeasResult;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      result = JSON.parse(jsonMatch[0]) as IdeasResult;
    } catch {
      // If parsing fails, create a simple fallback
      result = {
        suggestions: [
          {
            title: topic ? `Post about ${topic}` : "Engaging social media post",
            content: topic
              ? `Share your thoughts and expertise about ${topic} with your audience.`
              : "Create an engaging post that resonates with your audience.",
            category: "general",
            platform: platforms[0] || "ALL",
          },
        ],
      };
    }

    // Save to DB for performance tracking
    try {
      await prisma.aIInsight.create({
        data: {
          userId,
          type: "CONTENT_SUGGESTIONS",
          data: JSON.parse(JSON.stringify(result)),
          inputData: JSON.parse(JSON.stringify({ topic, count, platforms })),
          durationMs,
          modelUsed: config.model,
        },
      });
    } catch (dbError) {
      console.error("Failed to save AI insight:", dbError);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI ideas generation error:", error);

    // Return fallback ideas so the UI still works
    const fallbackSuggestions: IdeaSuggestion[] = Array.from(
      { length: Math.min(count || 5, 5) },
      (_, i) => ({
        title: topic
          ? `Idea ${i + 1}: ${topic}`
          : `Content idea ${i + 1}`,
        content: topic
          ? `Create an engaging post about ${topic} for your ${platforms.join(" and ")} audience.`
          : `Share valuable content with your ${platforms.join(" and ")} followers.`,
        category: ["engagement", "educational", "promotional", "storytelling", "trending"][i] || "general",
        platform: platforms[i % platforms.length] || "ALL",
      })
    );

    return NextResponse.json({ suggestions: fallbackSuggestions });
  }
}
