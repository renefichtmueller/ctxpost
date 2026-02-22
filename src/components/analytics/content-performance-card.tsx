"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, Image, Calendar, BarChart3 } from "lucide-react";

interface ContentPerformanceProps {
  avgEngagementRate: number;
  bestContentType: string | null;
  bestContentTypeRate: number;
  mostActiveDay: string | null;
  mostActiveDayCount: number;
  hasData: boolean;
}

export function ContentPerformanceCard({
  avgEngagementRate,
  bestContentType,
  bestContentTypeRate,
  mostActiveDay,
  mostActiveDayCount,
  hasData,
}: ContentPerformanceProps) {
  const t = useTranslations("analytics");

  const CONTENT_TYPE_LABELS: Record<string, string> = {
    TEXT: t("contentTypeText"),
    LINK: t("contentTypeLink"),
    IMAGE: t("contentTypeImage"),
    VIDEO: t("contentTypeVideo"),
  };

  const DAY_LABELS: Record<string, string> = {
    "0": t("daySu"),
    "1": t("dayMo"),
    "2": t("dayTu"),
    "3": t("dayWe"),
    "4": t("dayTh"),
    "5": t("dayFr"),
    "6": t("daySa"),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {t("contentPerformance")}
        </CardTitle>
        <CardDescription>{t("contentPerformanceDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground">{t("noContentPerformanceData")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Average Engagement Rate */}
            <div className="rounded-lg border p-4 text-center space-y-1">
              <BarChart3 className="h-5 w-5 mx-auto text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {avgEngagementRate.toFixed(2)}%
              </div>
              <div className="text-xs text-muted-foreground">{t("avgEngagementRate")}</div>
            </div>

            {/* Best Content Type */}
            <div className="rounded-lg border p-4 text-center space-y-1">
              <Image className="h-5 w-5 mx-auto text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">
                {bestContentType ? CONTENT_TYPE_LABELS[bestContentType] || bestContentType : "-"}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("bestContentType")}
                {bestContentType && bestContentTypeRate > 0 && (
                  <span className="block text-xs mt-0.5">
                    ({bestContentTypeRate.toFixed(2)}% {t("avgEngagement").toLowerCase()})
                  </span>
                )}
              </div>
            </div>

            {/* Most Active Day */}
            <div className="rounded-lg border p-4 text-center space-y-1">
              <Calendar className="h-5 w-5 mx-auto text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">
                {mostActiveDay !== null ? DAY_LABELS[mostActiveDay] || mostActiveDay : "-"}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("mostActiveDay")}
                {mostActiveDayCount > 0 && (
                  <span className="block text-xs mt-0.5">
                    ({mostActiveDayCount} {t("posts").toLowerCase()})
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
