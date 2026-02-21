"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Clock, FileText, Trophy, Info } from "lucide-react";
import { EngagementChart } from "@/components/analytics/engagement-chart";
import { PlatformComparison } from "@/components/analytics/platform-comparison";
import { BestTimesHeatmap } from "@/components/analytics/best-times-heatmap";
import { ContentTypeChart } from "@/components/analytics/content-type-chart";
import { TopWorstPosts } from "@/components/analytics/top-worst-posts";

interface AnalyticsTabsProps {
  weeklyData: Array<{ week: string; likes: number; comments: number; shares: number }>;
  platformComparisonData: Array<{ metric: string; Facebook: number; LinkedIn: number }>;
  heatmapData: Array<{ day: number; hour: number; value: number; posts: number }>;
  contentTypeData: Array<{ type: string; avgEngagement: number; posts: number }>;
  topPosts: Array<{
    id: string;
    content: string;
    platform: string;
    publishedAt: string;
    score: number;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    reason: string;
  }>;
  worstPosts: Array<{
    id: string;
    content: string;
    platform: string;
    publishedAt: string;
    score: number;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    reason: string;
  }>;
  hasAnalytics: boolean;
  totalPosts: number;
}

export function AnalyticsTabs({
  weeklyData,
  platformComparisonData,
  heatmapData,
  contentTypeData,
  topPosts,
  worstPosts,
  hasAnalytics,
  totalPosts,
}: AnalyticsTabsProps) {
  const t = useTranslations("analytics");

  return (
    <div className="space-y-4">
      {/* Info-Banner */}
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 px-4 py-3">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {hasAnalytics
            ? t("engagementAutoUpdate")
            : t("noEngagementYet", { count: totalPosts > 0 ? totalPosts : "" })}
        </p>
      </div>

    <Tabs defaultValue="overview">
      <TabsList className="w-full md:w-auto">
        <TabsTrigger value="overview" className="gap-1.5">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">{t("tabOverview")}</span>
        </TabsTrigger>
        <TabsTrigger value="best-times" className="gap-1.5">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">{t("tabBestTimes")}</span>
        </TabsTrigger>
        <TabsTrigger value="content-types" className="gap-1.5">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">{t("tabContentTypes")}</span>
        </TabsTrigger>
        <TabsTrigger value="top-flop" className="gap-1.5">
          <Trophy className="h-4 w-4" />
          <span className="hidden sm:inline">{t("tabTopFlop")}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 mt-4">
        <EngagementChart data={weeklyData} />
        <PlatformComparison data={platformComparisonData} />
      </TabsContent>

      <TabsContent value="best-times" className="mt-4">
        <BestTimesHeatmap data={heatmapData} />
      </TabsContent>

      <TabsContent value="content-types" className="mt-4">
        <ContentTypeChart data={contentTypeData} />
      </TabsContent>

      <TabsContent value="top-flop" className="mt-4">
        <TopWorstPosts topPosts={topPosts} worstPosts={worstPosts} />
      </TabsContent>
    </Tabs>
    </div>
  );
}
