import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BarChart3 } from "lucide-react";
import { CockpitKPICards } from "@/components/analytics/cockpit-kpi-cards";
import { PostFrequencyChart } from "@/components/analytics/post-frequency-chart";
import { StatusDistributionChart } from "@/components/analytics/status-distribution-chart";
import { PlatformComparison } from "@/components/analytics/platform-comparison";
import { ContentTypeChart } from "@/components/analytics/content-type-chart";
import { AIInsightsCard } from "@/components/analytics/ai-insights-card";
import { AIPerformanceCard } from "@/components/analytics/ai-performance-card";
import { SchedulingHeatmap } from "@/components/analytics/scheduling-heatmap";
import { ContentPerformanceCard } from "@/components/analytics/content-performance-card";
import { AnalyticsTabs } from "./analytics-tabs";

// ─── Scoring-Logik ──────────────────────────────────────

function calculateScore(likes: number, comments: number, shares: number, impressions: number): number {
  if (impressions === 0) return likes + comments * 2 + shares * 3;
  return (likes + comments * 2 + shares * 3) / impressions;
}

function getReason(
  likes: number, comments: number, shares: number, impressions: number,
  t: (key: string) => string
): string {
  const total = likes + comments + shares;
  if (total === 0) return t("noEngagement");
  const reasons: string[] = [];
  if (impressions > 0) {
    const rate = total / impressions;
    if (rate > 0.05) reasons.push(t("highEngagement"));
    else if (rate < 0.01) reasons.push(t("lowEngagement"));
  }
  if (comments > likes * 0.5) reasons.push(t("manyComments"));
  if (shares > likes * 0.3) reasons.push(t("oftenShared"));
  if (likes > comments * 5 && likes > shares * 5) reasons.push(t("mainlyLikes"));
  return reasons.length > 0 ? reasons.join(", ") : t("normalEngagement");
}

// ─── Helper ─────────────────────────────────────────────

function getDayIndex(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

function getWeekLabel(date: Date): string {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1);
  return start.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
}

const STATUS_CHART_COLORS: Record<string, string> = {
  DRAFT: "#9ca3af",
  SCHEDULED: "#3b82f6",
  PUBLISHING: "#eab308",
  PUBLISHED: "#22c55e",
  FAILED: "#ef4444",
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("analytics");
  const tPosts = await getTranslations("posts");

  const STATUS_LABELS: Record<string, string> = {
    DRAFT: tPosts("draft"),
    SCHEDULED: tPosts("scheduled"),
    PUBLISHING: tPosts("publishing"),
    PUBLISHED: tPosts("published"),
    FAILED: tPosts("failed"),
  };

  const userId = session.user.id;
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // ─── Parallele Queries ─────────────────────────────────

  const [
    engagementAgg,
    totalPosts,
    scheduledPosts,
    publishedPosts,
    failedPosts,
    allPostContents,
    statusCounts,
    platformTargets,
    contentTypeCounts,
    scheduledPostDates,
    weeklyAnalytics,
    platformAnalytics,
    heatmapAnalytics,
    contentTypeAnalytics,
    postsWithAnalytics,
    latestBestTimes,
    latestSuggestions,
    postFrequencyData,
    aiPerformanceData,
  ] = await Promise.all([
    // Engagement Aggregation
    prisma.postAnalytics.aggregate({
      where: { post: { userId } },
      _sum: { likes: true, comments: true, shares: true, impressions: true, clicks: true },
    }),
    prisma.post.count({ where: { userId } }),
    prisma.post.count({ where: { userId, status: "SCHEDULED" } }),
    prisma.post.count({ where: { userId, status: "PUBLISHED" } }),
    prisma.post.count({ where: { userId, status: "FAILED" } }),
    // Ø Inhaltslänge
    prisma.post.findMany({
      where: { userId },
      select: { content: true },
    }),
    // Status-Verteilung
    prisma.post.groupBy({
      by: ["status"],
      where: { userId },
      _count: { id: true },
    }),
    // Plattform-Verteilung
    prisma.postTarget.findMany({
      where: { post: { userId } },
      select: { socialAccount: { select: { platform: true } } },
    }),
    // Content-Type-Verteilung (Post-basiert)
    prisma.post.groupBy({
      by: ["contentType"],
      where: { userId },
      _count: { id: true },
    }),
    // Scheduling-Heatmap
    prisma.post.findMany({
      where: { userId, scheduledAt: { not: null } },
      select: { scheduledAt: true },
    }),
    // Engagement Trend (12 Wochen)
    prisma.postAnalytics.findMany({
      where: { post: { userId }, fetchedAt: { gte: twelveWeeksAgo } },
      include: { post: { select: { publishedAt: true } } },
      orderBy: { fetchedAt: "asc" },
    }),
    // Plattform-Vergleich (Engagement)
    prisma.postAnalytics.groupBy({
      by: ["platform"],
      where: { post: { userId } },
      _avg: { likes: true, comments: true, shares: true, impressions: true },
    }),
    // Heatmap (Engagement)
    prisma.postAnalytics.findMany({
      where: { post: { userId }, fetchedAt: { gte: ninetyDaysAgo } },
      include: { post: { select: { publishedAt: true } } },
    }),
    // Content-Type Analytics (Engagement-basiert)
    prisma.post.findMany({
      where: { userId, analytics: { some: {} } },
      select: {
        contentType: true,
        analytics: {
          select: { likes: true, comments: true, shares: true, impressions: true },
          take: 1,
          orderBy: { fetchedAt: "desc" },
        },
      },
    }),
    // Top & Worst Posts
    prisma.post.findMany({
      where: { userId, status: "PUBLISHED", analytics: { some: {} } },
      select: {
        id: true, content: true, publishedAt: true,
        analytics: {
          select: { platform: true, likes: true, comments: true, shares: true, impressions: true },
          take: 1,
          orderBy: { fetchedAt: "desc" },
        },
      },
    }),
    // KI-Insights
    prisma.aIInsight.findFirst({
      where: { userId, type: "BEST_TIMES" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.aIInsight.findFirst({
      where: { userId, type: "CONTENT_SUGGESTIONS" },
      orderBy: { createdAt: "desc" },
    }),
    // Post-Frequenz (enhanced: includes status for filtering)
    prisma.post.findMany({
      where: { userId },
      select: { createdAt: true, status: true, publishedAt: true },
      orderBy: { createdAt: "asc" },
    }),
    // KI-Performance (letzte 10 Operationen)
    prisma.aIInsight.findMany({
      where: { userId },
      select: { id: true, type: true, durationMs: true, modelUsed: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // ─── KPI-Daten ─────────────────────────────────────────

  const totalLikes = engagementAgg._sum.likes || 0;
  const totalComments = engagementAgg._sum.comments || 0;
  const totalShares = engagementAgg._sum.shares || 0;
  const totalImpressions = engagementAgg._sum.impressions || 0;
  const totalClicks = engagementAgg._sum.clicks || 0;
  const hasEngagementData = totalLikes > 0 || totalComments > 0 || totalShares > 0 || totalImpressions > 0;

  const avgContentLength = allPostContents.length > 0
    ? Math.round(allPostContents.reduce((sum, p) => sum + p.content.length, 0) / allPostContents.length)
    : 0;

  // ─── Post-Frequenz (Enhanced) ─────────────────────────

  const freqMap = new Map<string, { all: number; published: number; scheduled: number }>();
  for (const p of postFrequencyData) {
    const week = getWeekLabel(p.createdAt);
    const existing = freqMap.get(week) || { all: 0, published: 0, scheduled: 0 };
    existing.all += 1;
    if (p.status === "PUBLISHED") existing.published += 1;
    if (p.status === "SCHEDULED") existing.scheduled += 1;
    freqMap.set(week, existing);
  }
  const enhancedFrequencyData = Array.from(freqMap.entries()).map(([week, counts]) => ({
    week,
    all: counts.all,
    published: counts.published,
    scheduled: counts.scheduled,
  }));

  // ─── Content Performance ────────────────────────────────

  // Average engagement rate across all published posts with analytics
  let avgEngagementRate = 0;
  let bestContentType: string | null = null;
  let bestContentTypeRate = 0;
  let mostActiveDay: string | null = null;
  let mostActiveDayCount = 0;
  const hasContentPerformanceData = contentTypeAnalytics.length > 0 || hasEngagementData;

  if (hasEngagementData && totalImpressions > 0) {
    avgEngagementRate = ((totalLikes + totalComments + totalShares) / totalImpressions) * 100;
  }

  // Best performing content type
  const ctEngagementRates = new Map<string, { totalRate: number; count: number }>();
  for (const post of contentTypeAnalytics) {
    const type = post.contentType || "TEXT";
    const a = post.analytics[0];
    if (!a) continue;
    const rate = a.impressions > 0 ? ((a.likes + a.comments + a.shares) / a.impressions) * 100 : 0;
    const existing = ctEngagementRates.get(type) || { totalRate: 0, count: 0 };
    existing.totalRate += rate;
    existing.count += 1;
    ctEngagementRates.set(type, existing);
  }
  let highestRate = 0;
  for (const [type, data] of ctEngagementRates.entries()) {
    const avgRate = data.count > 0 ? data.totalRate / data.count : 0;
    if (avgRate > highestRate) {
      highestRate = avgRate;
      bestContentType = type;
      bestContentTypeRate = avgRate;
    }
  }

  // Most active posting day (from published posts)
  const dayCountMap = new Map<number, number>();
  for (const p of postFrequencyData) {
    if (p.status === "PUBLISHED" && p.publishedAt) {
      const day = p.publishedAt.getDay();
      dayCountMap.set(day, (dayCountMap.get(day) || 0) + 1);
    }
  }
  let maxDayCount = 0;
  for (const [day, count] of dayCountMap.entries()) {
    if (count > maxDayCount) {
      maxDayCount = count;
      mostActiveDay = String(day);
      mostActiveDayCount = count;
    }
  }

  // ─── Status-Verteilung ─────────────────────────────────

  const statusData = statusCounts.map((s) => ({
    status: s.status,
    label: STATUS_LABELS[s.status] || s.status,
    count: s._count.id,
    color: STATUS_CHART_COLORS[s.status] || "#9ca3af",
  }));

  // ─── Plattform-Verteilung (Post-basiert) ───────────────

  const platformCountMap = new Map<string, number>();
  for (const t of platformTargets) {
    const p = t.socialAccount.platform;
    platformCountMap.set(p, (platformCountMap.get(p) || 0) + 1);
  }

  const postsLabel = t("posts");
  const platformBarData = Array.from(platformCountMap.entries()).map(([platform, count]) => ({
    platform,
    [postsLabel]: count,
  }));

  // ─── Content-Type Verteilung (Post-basiert) ────────────

  const CONTENT_TYPE_LABELS: Record<string, string> = {
    TEXT: "Text",
    LINK: "Link",
    IMAGE: t("contentTypeImage"),
    VIDEO: "Video",
  };
  const contentTypeBarData = contentTypeCounts.map((c) => ({
    type: CONTENT_TYPE_LABELS[c.contentType] || c.contentType,
    [postsLabel]: c._count.id,
  }));

  // ─── Scheduling-Heatmap ────────────────────────────────

  const scheduleMap = new Map<string, number>();
  for (const p of scheduledPostDates) {
    if (!p.scheduledAt) continue;
    const dayIdx = getDayIndex(p.scheduledAt);
    const hour = p.scheduledAt.getHours();
    const key = `${dayIdx}-${hour}`;
    scheduleMap.set(key, (scheduleMap.get(key) || 0) + 1);
  }
  const schedulingHeatmapData = Array.from(scheduleMap.entries()).map(([key, count]) => {
    const [day, hour] = key.split("-").map(Number);
    return { day, hour, count };
  });

  // ─── Engagement Trend ──────────────────────────────────

  const weekMap = new Map<string, { likes: number; comments: number; shares: number }>();
  for (const a of weeklyAnalytics) {
    const date = a.post.publishedAt || a.fetchedAt;
    const week = getWeekLabel(date);
    const existing = weekMap.get(week) || { likes: 0, comments: 0, shares: 0 };
    existing.likes += a.likes;
    existing.comments += a.comments;
    existing.shares += a.shares;
    weekMap.set(week, existing);
  }
  const weeklyData = Array.from(weekMap.entries()).map(([week, data]) => ({ week, ...data }));

  // ─── Plattform-Vergleich (Engagement) ──────────────────

  const platformComparisonData = [
    { metric: t("avgLikes"), Facebook: Math.round(platformAnalytics.find((p) => p.platform === "FACEBOOK")?._avg.likes || 0), LinkedIn: Math.round(platformAnalytics.find((p) => p.platform === "LINKEDIN")?._avg.likes || 0) },
    { metric: t("avgComments"), Facebook: Math.round(platformAnalytics.find((p) => p.platform === "FACEBOOK")?._avg.comments || 0), LinkedIn: Math.round(platformAnalytics.find((p) => p.platform === "LINKEDIN")?._avg.comments || 0) },
    { metric: t("avgShares"), Facebook: Math.round(platformAnalytics.find((p) => p.platform === "FACEBOOK")?._avg.shares || 0), LinkedIn: Math.round(platformAnalytics.find((p) => p.platform === "LINKEDIN")?._avg.shares || 0) },
    { metric: t("avgImpressions"), Facebook: Math.round(platformAnalytics.find((p) => p.platform === "FACEBOOK")?._avg.impressions || 0), LinkedIn: Math.round(platformAnalytics.find((p) => p.platform === "LINKEDIN")?._avg.impressions || 0) },
  ];

  // ─── Engagement Heatmap ────────────────────────────────

  const heatmapMap = new Map<string, { value: number; posts: number }>();
  for (const a of heatmapAnalytics) {
    const date = a.post.publishedAt;
    if (!date) continue;
    const dayIdx = getDayIndex(date);
    const hour = date.getHours();
    const key = `${dayIdx}-${hour}`;
    const existing = heatmapMap.get(key) || { value: 0, posts: 0 };
    existing.value += a.likes + a.comments * 2 + a.shares * 3;
    existing.posts += 1;
    heatmapMap.set(key, existing);
  }
  const heatmapData = Array.from(heatmapMap.entries()).map(([key, data]) => {
    const [day, hour] = key.split("-").map(Number);
    return { day, hour, value: data.posts > 0 ? data.value / data.posts : 0, posts: data.posts };
  });

  // ─── Content-Type Analytics (Engagement) ───────────────

  const ctMap = new Map<string, { totalEngagement: number; count: number }>();
  for (const post of contentTypeAnalytics) {
    const type = post.contentType || "TEXT";
    const a = post.analytics[0];
    if (!a) continue;
    const existing = ctMap.get(type) || { totalEngagement: 0, count: 0 };
    existing.totalEngagement += a.likes + a.comments * 2 + a.shares * 3;
    existing.count += 1;
    ctMap.set(type, existing);
  }
  const engagementContentTypeData = ["TEXT", "LINK", "IMAGE", "VIDEO"]
    .filter((type) => ctMap.has(type))
    .map((type) => {
      const data = ctMap.get(type)!;
      return { type, avgEngagement: Math.round(data.totalEngagement / data.count), posts: data.count };
    });

  // ─── Top & Worst Posts ─────────────────────────────────

  const scoredPosts = postsWithAnalytics
    .filter((p) => p.analytics.length > 0)
    .map((p) => {
      const a = p.analytics[0];
      const score = calculateScore(a.likes, a.comments, a.shares, a.impressions);
      return {
        id: p.id, content: p.content, platform: a.platform,
        publishedAt: p.publishedAt?.toISOString() || "",
        score, likes: a.likes, comments: a.comments, shares: a.shares, impressions: a.impressions,
        reason: getReason(a.likes, a.comments, a.shares, a.impressions, t),
      };
    })
    .sort((a, b) => b.score - a.score);

  const topPosts = scoredPosts.slice(0, 5);
  const worstPosts = [...scoredPosts].sort((a, b) => a.score - b.score).slice(0, 5);

  // ─── KI-Insights Daten ─────────────────────────────────

  const bestTimesInsight = latestBestTimes?.data as Record<string, unknown> | null;
  const suggestionsInsight = latestSuggestions?.data as Record<string, unknown> | null;
  const suggestionsCount = suggestionsInsight
    ? ((suggestionsInsight as { suggestions?: unknown[] })?.suggestions?.length || 0)
    : 0;

  // ═════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t("cockpitTitle")}</h1>
          <p className="text-muted-foreground">
            {t("cockpitDescription")}
          </p>
        </div>
      </div>

      {/* Sektion 1: KPI-Cards */}
      <CockpitKPICards
        totalPosts={totalPosts}
        scheduledPosts={scheduledPosts}
        publishedPosts={publishedPosts}
        failedPosts={failedPosts}
        avgContentLength={avgContentLength}
        totalLikes={totalLikes}
        totalComments={totalComments}
        totalShares={totalShares}
        totalImpressions={totalImpressions}
        totalClicks={totalClicks}
        hasEngagementData={hasEngagementData}
      />

      {/* Sektion 2: Content Performance */}
      <ContentPerformanceCard
        avgEngagementRate={avgEngagementRate}
        bestContentType={bestContentType}
        bestContentTypeRate={bestContentTypeRate}
        mostActiveDay={mostActiveDay}
        mostActiveDayCount={mostActiveDayCount}
        hasData={hasContentPerformanceData}
      />

      {/* Sektion 3: Post-Aktivität */}
      <div className="grid gap-6 md:grid-cols-2">
        <PostFrequencyChart data={enhancedFrequencyData} />
        <StatusDistributionChart data={statusData} />
      </div>

      {platformBarData.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <PlatformComparison data={platformBarData.length > 0 ? [
            { metric: postsLabel, Facebook: platformCountMap.get("FACEBOOK") || 0, LinkedIn: platformCountMap.get("LINKEDIN") || 0 },
          ] : []} />
          {contentTypeBarData.length > 0 && (
            <ContentTypeChart data={contentTypeBarData.map((d) => ({
              type: d.type,
              avgEngagement: d[postsLabel] as number,
              posts: d[postsLabel] as number,
            }))} />
          )}
        </div>
      )}

      {/* Sektion 3: KI-Insights */}
      <AIInsightsCard
        bestTimesData={bestTimesInsight as { recommendations?: Array<{ platform: string; bestDays?: string[]; bestTimeSlots?: Array<{ start: string; end: string; score: number; reason: string }> }>; confidenceLevel?: string } | null}
        bestTimesDate={latestBestTimes?.createdAt.toISOString() || null}
        suggestionsCount={suggestionsCount}
        suggestionsDate={latestSuggestions?.createdAt.toISOString() || null}
      />

      {/* Sektion 4: KI-Performance */}
      <AIPerformanceCard
        operations={aiPerformanceData.map((op) => ({
          id: op.id,
          type: op.type,
          durationMs: op.durationMs,
          modelUsed: op.modelUsed,
          createdAt: op.createdAt.toISOString(),
        }))}
      />

      {/* Sektion 5: Scheduling-Heatmap */}
      <SchedulingHeatmap data={schedulingHeatmapData} />

      {/* Sektion 5: Engagement-Analyse */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">{t("engagementAnalysis")}</h2>
        <AnalyticsTabs
          weeklyData={weeklyData}
          platformComparisonData={platformComparisonData}
          heatmapData={heatmapData}
          contentTypeData={engagementContentTypeData}
          topPosts={topPosts}
          worstPosts={worstPosts}
          hasAnalytics={hasEngagementData}
          totalPosts={totalPosts}
        />
      </div>
    </div>
  );
}
