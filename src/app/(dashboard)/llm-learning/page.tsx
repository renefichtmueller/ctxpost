import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getFeedbackStats } from "@/lib/feedback";
import { LearningDashboard } from "@/components/ai/learning-dashboard";
import { getTranslations } from "next-intl/server";
import {
  BEST_TIMES_SYSTEM_PROMPT,
  CONTENT_SUGGESTIONS_SYSTEM_PROMPT,
  HASHTAG_GENERATION_SYSTEM_PROMPT,
  CONTENT_VARIATIONS_SYSTEM_PROMPT,
} from "@/lib/ai/prompts";

export default async function LLMLearningPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("learning");

  // Get feedback stats
  const stats = await getFeedbackStats(session.user.id);

  // ─── Parallel Queries ─────────────────────────────────

  const [
    feedbackByTypeRaw,
    recentFeedbackRaw,
    aiInsightsHistory,
    modelPerformanceData,
    brandStyleGuide,
  ] = await Promise.all([
    // Feedback grouped by type
    prisma.aIFeedback.groupBy({
      by: ["insightType"],
      where: { userId: session.user.id },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    // Recent feedback
    prisma.aIFeedback.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        insightType: true,
        rating: true,
        originalOutput: true,
        editedOutput: true,
        modelUsed: true,
        createdAt: true,
      },
    }),
    // AI Insights History (all interactions)
    prisma.aIInsight.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        type: true,
        durationMs: true,
        modelUsed: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    // Model performance aggregation
    prisma.aIInsight.groupBy({
      by: ["modelUsed"],
      where: { userId: session.user.id, modelUsed: { not: null } },
      _avg: { durationMs: true },
      _count: { id: true },
      _min: { durationMs: true },
      _max: { durationMs: true },
    }),
    // Brand Style Guide
    prisma.brandStyleGuide.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  const feedbackByType = feedbackByTypeRaw.map((item) => ({
    insightType: item.insightType,
    count: item._count.id,
  }));

  const recentFeedback = recentFeedbackRaw.map((item) => ({
    id: item.id,
    insightType: item.insightType,
    rating: item.rating,
    originalOutput: item.originalOutput.substring(0, 300),
    editedOutput: item.editedOutput?.substring(0, 300) || null,
    modelUsed: item.modelUsed,
    createdAt: item.createdAt.toISOString(),
  }));

  // ─── Learning History Data ─────────────────────────────

  const learningHistory = aiInsightsHistory.map((item) => ({
    id: item.id,
    type: item.type,
    durationMs: item.durationMs,
    modelUsed: item.modelUsed,
    createdAt: item.createdAt.toISOString(),
  }));

  const totalAICalls = aiInsightsHistory.length;
  const avgResponseTime = aiInsightsHistory.length > 0
    ? Math.round(
        aiInsightsHistory.reduce((sum, i) => sum + (i.durationMs || 0), 0) / aiInsightsHistory.length
      )
    : 0;

  // ─── Model Performance Comparison ──────────────────────

  const modelComparison = modelPerformanceData
    .filter((m) => m.modelUsed !== null)
    .map((m) => ({
      model: m.modelUsed as string,
      avgDurationMs: Math.round(m._avg.durationMs || 0),
      totalCalls: m._count.id,
      minDurationMs: m._min.durationMs || 0,
      maxDurationMs: m._max.durationMs || 0,
    }))
    .sort((a, b) => b.totalCalls - a.totalCalls);

  // ─── Prompt Templates ──────────────────────────────────

  const promptTemplates = [
    {
      key: "bestTimes",
      prompt: BEST_TIMES_SYSTEM_PROMPT,
    },
    {
      key: "contentSuggestions",
      prompt: CONTENT_SUGGESTIONS_SYSTEM_PROMPT,
    },
    {
      key: "hashtagGeneration",
      prompt: HASHTAG_GENERATION_SYSTEM_PROMPT,
    },
    {
      key: "contentVariations",
      prompt: CONTENT_VARIATIONS_SYSTEM_PROMPT,
    },
  ];

  // ─── Brand Voice Info ──────────────────────────────────

  const brandVoiceInfo = brandStyleGuide
    ? {
        name: brandStyleGuide.name,
        tone: brandStyleGuide.tone,
        formality: brandStyleGuide.formality,
        emojiUsage: brandStyleGuide.emojiUsage,
        targetAudience: brandStyleGuide.targetAudience,
        brandVoice: brandStyleGuide.brandVoice,
        hashtagStrategy: brandStyleGuide.hashtagStrategy,
        languages: brandStyleGuide.languages,
        customInstructions: brandStyleGuide.customInstructions,
      }
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">
          {t("pageDescription")}
        </p>
      </div>

      <LearningDashboard
        stats={stats}
        feedbackByType={feedbackByType}
        recentFeedback={recentFeedback}
        learningHistory={learningHistory}
        totalAICalls={totalAICalls}
        avgResponseTime={avgResponseTime}
        modelComparison={modelComparison}
        promptTemplates={promptTemplates}
        brandVoiceInfo={brandVoiceInfo}
      />
    </div>
  );
}
