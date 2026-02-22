"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, ArrowRight } from "lucide-react";

interface Recommendation {
  platform: string;
  bestDays?: string[];
  bestTimeSlots?: Array<{
    start: string;
    end: string;
    score: number;
    reason: string;
  }>;
}

interface AIInsightsCardProps {
  bestTimesData: {
    recommendations?: Recommendation[];
    confidenceLevel?: string;
  } | null;
  bestTimesDate: string | null;
  suggestionsCount: number;
  suggestionsDate: string | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AIInsightsCard({
  bestTimesData,
  bestTimesDate,
  suggestionsCount,
  suggestionsDate,
}: AIInsightsCardProps) {
  const t = useTranslations("analytics");
  const hasAnyData = bestTimesData || suggestionsCount > 0;

  const confidenceLabels: Record<string, { label: string; color: string }> = {
    high: { label: t("confidenceHigh"), color: "bg-green-500/15 text-green-700 dark:text-green-400" },
    medium: { label: t("confidenceMedium"), color: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" },
    low: { label: t("confidenceLow"), color: "bg-orange-500/15 text-orange-700 dark:text-orange-400" },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("aiAnalysis")}
            </CardTitle>
            <CardDescription>
              {t("aiAnalysisDesc")}
            </CardDescription>
          </div>
          <Link href="/ai-insights">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {t("newAnalysis")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {!hasAnyData ? (
          <div className="text-center py-6 text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-60" />
            <p className="text-sm">{t("noAiAnalysisYet")}</p>
            <p className="text-xs mt-1">
              {t("startFirstAnalysisAt")}{" "}
              <Link href="/ai-insights" className="text-primary hover:underline">
                {t("aiInsightsLink")}
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Beste Posting-Zeiten */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {t("bestPostingTimes")}
                </h4>
                {bestTimesData && (
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${
                      confidenceLabels[bestTimesData.confidenceLevel || "low"]?.color || ""
                    }`}
                  >
                    {confidenceLabels[bestTimesData.confidenceLevel || "low"]?.label || ""}
                  </Badge>
                )}
              </div>

              {bestTimesData?.recommendations ? (
                <div className="space-y-1.5">
                  {bestTimesData.recommendations.slice(0, 2).map((rec, idx) => (
                    <div key={idx} className="rounded-md border p-2 text-xs">
                      <p className="font-medium">{rec.platform}</p>
                      <p className="text-muted-foreground">
                        {(rec.bestDays || []).slice(0, 3).join(", ")}
                      </p>
                      {rec.bestTimeSlots?.slice(0, 2).map((slot, si) => (
                        <p key={si} className="text-muted-foreground">
                          {slot.start} – {slot.end}
                          <span className="ml-1.5 text-green-600 dark:text-green-400 font-medium">
                            ({slot.score.toFixed(2)})
                          </span>
                        </p>
                      ))}
                    </div>
                  ))}
                  {bestTimesDate && (
                    <p className="text-[10px] text-muted-foreground">
                      {t("analyzedOn")} {formatDate(bestTimesDate)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("noAnalysisYet")}
                </p>
              )}
            </div>

            {/* Inhaltsvorschläge */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                {t("contentSuggestions")}
              </h4>
              {suggestionsCount > 0 ? (
                <div className="space-y-1.5">
                  <div className="rounded-md border p-2 text-xs">
                    <p className="text-muted-foreground">
                      {t("suggestionsGenerated", { count: suggestionsCount })}
                    </p>
                  </div>
                  {suggestionsDate && (
                    <p className="text-[10px] text-muted-foreground">
                      {t("generatedOn")} {formatDate(suggestionsDate)}
                    </p>
                  )}
                  <Link
                    href="/ai-insights"
                    className="text-xs text-primary hover:underline"
                  >
                    {t("viewAllSuggestions")}
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("noSuggestionsYet")}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
