"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import {
  PenSquare,
  Calendar,
  CheckCircle,
  AlertCircle,
  Type,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  MousePointer,
} from "lucide-react";

interface CockpitKPICardsProps {
  totalPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  failedPosts: number;
  avgContentLength: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalImpressions: number;
  totalClicks: number;
  hasEngagementData: boolean;
}

export function CockpitKPICards({
  totalPosts,
  scheduledPosts,
  publishedPosts,
  failedPosts,
  avgContentLength,
  totalLikes,
  totalComments,
  totalShares,
  totalImpressions,
  totalClicks,
  hasEngagementData,
}: CockpitKPICardsProps) {
  const t = useTranslations("analytics");
  const tCommon = useTranslations("common");

  const postStats = [
    { label: t("total"), value: totalPosts, icon: PenSquare, color: "text-foreground" },
    { label: t("scheduled"), value: scheduledPosts, icon: Calendar, color: "text-blue-500" },
    { label: t("published"), value: publishedPosts, icon: CheckCircle, color: "text-green-500" },
    { label: t("failed"), value: failedPosts, icon: AlertCircle, color: "text-red-500" },
    { label: t("avgChars"), value: avgContentLength, icon: Type, color: "text-purple-500" },
  ];

  const engagementStats = [
    { label: tCommon("likes"), value: totalLikes, icon: Heart, color: "text-red-500" },
    { label: tCommon("comments"), value: totalComments, icon: MessageCircle, color: "text-blue-500" },
    { label: tCommon("shares"), value: totalShares, icon: Share2, color: "text-green-500" },
    { label: tCommon("impressions"), value: totalImpressions, icon: Eye, color: "text-purple-500" },
    { label: t("clicks"), value: totalClicks, icon: MousePointer, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-3">
      {/* Reihe 1: Post-Statistiken */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {postStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <stat.icon className={`h-5 w-5 ${stat.color} shrink-0`} />
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-tight">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {stat.label}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reihe 2: Engagement-Statistiken */}
      {hasEngagementData ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {engagementStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <stat.icon className={`h-5 w-5 ${stat.color} shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-tight">
                      {stat.value.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
          {t("engagementDataNotice")}
        </div>
      )}
    </div>
  );
}
