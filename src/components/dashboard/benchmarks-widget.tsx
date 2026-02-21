"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Hash,
  Clock,
  Video,
  FileText,
  Info,
  Lightbulb,
  TrendingUp,
  Target,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  PLATFORM_BENCHMARKS,
  CONTENT_TYPE_MULTIPLIERS,
  type PlatformBenchmark,
} from "@/lib/data/benchmarks";

interface BenchmarksWidgetProps {
  platforms: string[]; // e.g., ["FACEBOOK", "LINKEDIN"]
}

function PlatformBenchmarkCard({ benchmark, platformKey }: { benchmark: PlatformBenchmark; platformKey: string }) {
  const t = useTranslations("trends");
  const tDash = useTranslations("dashboard");

  const contentMultipliers = CONTENT_TYPE_MULTIPLIERS[platformKey] || {};
  const topContentTypes = Object.entries(contentMultipliers)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="p-3 rounded-lg border space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{benchmark.platform}</p>
        <Badge variant="outline" className="text-[10px]">
          {tDash("engagementRate")}: {benchmark.avgEngagementRate}%
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="h-3 w-3 text-blue-500" />
          <span className="text-muted-foreground">{t("engagementRate")}:</span>
          <span className="font-medium">{benchmark.avgEngagementRate}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Hash className="h-3 w-3 text-purple-500" />
          <span className="text-muted-foreground">{t("hashtags")}:</span>
          <span className="font-medium">
            {benchmark.hashtagsRecommended.min}-{benchmark.hashtagsRecommended.max}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="h-3 w-3 text-green-500" />
          <span className="text-muted-foreground">{tDash("optimalLength")}:</span>
          <span className="font-medium">
            {benchmark.optimalPostLength.min}-{benchmark.optimalPostLength.max}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-orange-500" />
          <span className="text-muted-foreground">{tDash("recommendedFrequency")}:</span>
          <span className="font-medium">{tDash("postsPerWeek", { count: benchmark.avgPostsPerWeek })}</span>
        </div>
      </div>

      {benchmark.videoVsImageLift > 0 && (
        <div className="flex items-center gap-1.5 text-xs">
          <Video className="h-3 w-3 text-red-500" />
          <span className="text-muted-foreground">
            {t("videoLift", { percent: benchmark.videoVsImageLift })}
          </span>
        </div>
      )}

      {/* Content type recommendations */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Lightbulb className="h-3 w-3" />
          <span>{tDash("contentTips")}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {benchmark.bestContentTypes.map((type) => (
            <Badge key={type} variant="secondary" className="text-[10px]">
              {type}
            </Badge>
          ))}
        </div>
        {topContentTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {topContentTypes.map(([type, multiplier]) => (
              <span key={type} className="text-[10px] text-muted-foreground">
                <Target className="h-2.5 w-2.5 inline mr-0.5" />
                {type}: {multiplier}x
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function BenchmarksWidget({ platforms }: BenchmarksWidgetProps) {
  const t = useTranslations("trends");
  const tDash = useTranslations("dashboard");

  const relevantBenchmarks = platforms
    .map((p) => ({ key: p, benchmark: PLATFORM_BENCHMARKS[p] }))
    .filter((item): item is { key: string; benchmark: PlatformBenchmark } => !!item.benchmark);

  if (relevantBenchmarks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {tDash("benchmarkTitle")}
          </CardTitle>
          <CardDescription>{t("benchmarksDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("connectAccountsFirst")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {tDash("benchmarkTitle")}
        </CardTitle>
        <CardDescription>{t("benchmarksDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform benchmark cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          {relevantBenchmarks.map(({ key, benchmark }) => (
            <PlatformBenchmarkCard key={key} benchmark={benchmark} platformKey={key} />
          ))}
        </div>

        {/* Industry comparison summary */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
            {tDash("yourPerformance")} vs {tDash("industryAverage")}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {relevantBenchmarks.map(({ benchmark }) => (
              <div key={benchmark.platform} className="flex items-center gap-1.5">
                <span className="text-muted-foreground">{benchmark.platform}:</span>
                <span className="font-medium">{benchmark.avgEngagementRate}%</span>
                <span className="text-[10px] text-muted-foreground">avg</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
