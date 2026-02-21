"use client";

import { useTranslations } from "next-intl";
import { LineChartCard } from "@/components/charts/line-chart-card";

interface WeeklyData {
  week: string;
  likes: number;
  comments: number;
  shares: number;
}

interface EngagementChartProps {
  data: WeeklyData[];
}

export function EngagementChart({ data }: EngagementChartProps) {
  const t = useTranslations("analytics");
  const tCommon = useTranslations("common");

  return (
    <LineChartCard
      title={t("engagementTrend")}
      description={t("engagementTrendDesc")}
      data={data}
      xAxisKey="week"
      lines={[
        { dataKey: "likes", name: tCommon("likes"), color: "#ef4444" },
        { dataKey: "comments", name: tCommon("comments"), color: "#3b82f6" },
        { dataKey: "shares", name: tCommon("shares"), color: "#22c55e" },
      ]}
      emptyMessage={t("noEngagementData")}
    />
  );
}
