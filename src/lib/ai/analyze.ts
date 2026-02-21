import { prisma } from "@/lib/prisma";
import { getUserAIConfig, askAI } from "./ai-provider";
import {
  BEST_TIMES_SYSTEM_PROMPT,
  CONTENT_SUGGESTIONS_SYSTEM_PROMPT,
  buildBrandAwareSystemPrompt,
} from "./prompts";

export interface TimeSlot {
  start: string;
  end: string;
  score: number;
  reason: string;
}

export interface PlatformRecommendation {
  platform: "FACEBOOK" | "LINKEDIN";
  bestDays: string[];
  bestTimeSlots: TimeSlot[];
  worstTimeSlots: TimeSlot[];
}

export interface BestTimesAnalysis {
  recommendations: PlatformRecommendation[];
  generalInsights: string[];
  confidenceLevel: "high" | "medium" | "low";
}

export interface ContentSuggestion {
  platform: "FACEBOOK" | "LINKEDIN";
  improvedContent: string;
  reasoning: string;
  tips: string[];
}

export interface ContentSuggestionsResult {
  suggestions: ContentSuggestion[];
}

export async function analyzeBestPostingTimes(
  userId: string
): Promise<BestTimesAnalysis> {
  const config = await getUserAIConfig(userId, "analysis");

  // Fetch analytics data from last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const analytics = await prisma.postAnalytics.findMany({
    where: {
      post: { userId },
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

  // Format data for AI
  let message: string;

  if (analytics.length === 0) {
    message =
      "No engagement data available yet. Please recommend the best posting times based on general best practices for Facebook and LinkedIn.";
  } else {
    const dataPoints = analytics.map((a) => ({
      platform: a.platform,
      publishedAt: a.post.publishedAt?.toISOString() || a.post.scheduledAt?.toISOString(),
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

  const response = await askAI(config, BEST_TIMES_SYSTEM_PROMPT, message);

  try {
    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return JSON.parse(jsonMatch[0]) as BestTimesAnalysis;
  } catch {
    // Return default recommendations if parsing fails
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
}

export async function getContentSuggestions(
  userId: string,
  content: string,
  platforms: string[]
): Promise<ContentSuggestionsResult> {
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

  const systemPrompt = buildBrandAwareSystemPrompt(
    CONTENT_SUGGESTIONS_SYSTEM_PROMPT,
    brandStyle
  );
  const message = `Please improve the following post for the platforms: ${platforms.join(", ")}\n\nOriginal content:\n${content}`;

  const response = await askAI(config, systemPrompt, message);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return JSON.parse(jsonMatch[0]) as ContentSuggestionsResult;
  } catch {
    return {
      suggestions: platforms.map((platform) => ({
        platform: platform as "FACEBOOK" | "LINKEDIN",
        improvedContent: content,
        reasoning: "Analysis could not be performed",
        tips: ["Please try again"],
      })),
    };
  }
}
