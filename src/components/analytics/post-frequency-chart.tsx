"use client";

import { useTranslations } from "next-intl";
import { LineChartCard } from "@/components/charts/line-chart-card";

interface FrequencyData {
  week: string;
  posts: number;
}

interface PostFrequencyChartProps {
  data: FrequencyData[];
}

export function PostFrequencyChart({ data }: PostFrequencyChartProps) {
  const t = useTranslations("analytics");

  return (
    <LineChartCard
      title={t("postFrequency")}
      description={t("postFrequencyDesc")}
      data={data}
      xAxisKey="week"
      lines={[
        { dataKey: "posts", name: t("posts"), color: "hsl(var(--primary))" },
      ]}
      height={250}
      emptyMessage={t("noPostsYet")}
    />
  );
}
