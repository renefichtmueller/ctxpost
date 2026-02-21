"use client";

import { useTranslations } from "next-intl";
import { BarChartCard } from "@/components/charts/bar-chart-card";

interface ContentTypeData {
  type: string;
  avgEngagement: number;
  posts: number;
}

interface ContentTypeChartProps {
  data: ContentTypeData[];
}

export function ContentTypeChart({ data }: ContentTypeChartProps) {
  const t = useTranslations("analytics");

  const CONTENT_TYPE_LABELS: Record<string, string> = {
    TEXT: t("contentTypeText"),
    LINK: t("contentTypeLink"),
    IMAGE: t("contentTypeImage"),
    VIDEO: t("contentTypeVideo"),
  };

  const formattedData = data.map((d) => ({
    ...d,
    type: CONTENT_TYPE_LABELS[d.type] || d.type,
  }));

  return (
    <BarChartCard
      title={t("engagementByContentType")}
      description={t("engagementByContentTypeDesc")}
      data={formattedData}
      xAxisKey="type"
      bars={[
        {
          dataKey: "avgEngagement",
          name: t("avgEngagement"),
          color: "hsl(var(--primary))",
        },
      ]}
      emptyMessage={t("noContentTypeData")}
    />
  );
}
