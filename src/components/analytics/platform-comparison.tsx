"use client";

import { useTranslations } from "next-intl";
import { BarChartCard } from "@/components/charts/bar-chart-card";

interface PlatformData {
  metric: string;
  Facebook: number;
  LinkedIn: number;
}

interface PlatformComparisonProps {
  data: PlatformData[];
}

export function PlatformComparison({ data }: PlatformComparisonProps) {
  const t = useTranslations("analytics");

  return (
    <BarChartCard
      title={t("platformComparison")}
      description={t("platformComparisonDesc")}
      data={data}
      xAxisKey="metric"
      bars={[
        { dataKey: "Facebook", name: "Facebook", color: "#1877F2" },
        { dataKey: "LinkedIn", name: "LinkedIn", color: "#0A66C2" },
      ]}
      emptyMessage={t("noPlatformData")}
    />
  );
}
