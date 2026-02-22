"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LineChartCard } from "@/components/charts/line-chart-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface FrequencyDataPoint {
  week: string;
  all: number;
  published: number;
  scheduled: number;
}

interface PostFrequencyChartProps {
  data: FrequencyDataPoint[];
  /** Fallback for legacy usage with simple { week, posts } data */
  legacyData?: { week: string; posts: number }[];
}

type FilterMode = "all" | "published" | "scheduled";
type PeriodDays = 30 | 60 | 90;

export function PostFrequencyChart({ data, legacyData }: PostFrequencyChartProps) {
  const t = useTranslations("analytics");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [period, setPeriod] = useState<PeriodDays>(90);

  // If only legacy data provided, use it with original simple chart
  if ((!data || data.length === 0) && legacyData && legacyData.length > 0) {
    return (
      <LineChartCard
        title={t("postFrequency")}
        description={t("postFrequencyDesc")}
        data={legacyData}
        xAxisKey="week"
        lines={[
          { dataKey: "posts", name: t("posts"), color: "hsl(var(--primary))" },
        ]}
        height={250}
        emptyMessage={t("noPostsYet")}
      />
    );
  }

  // Filter data by period (approximate: last N days mapped to weeks)
  const weeksToShow = Math.ceil(period / 7);
  const filteredByPeriod = data.slice(-weeksToShow);

  // Map data based on filter
  const chartData = filteredByPeriod.map((d) => {
    if (filter === "published") {
      return { week: d.week, [t("posts")]: d.published };
    }
    if (filter === "scheduled") {
      return { week: d.week, [t("posts")]: d.scheduled };
    }
    // "all" mode: show both lines
    return {
      week: d.week,
      [t("published")]: d.published,
      [t("scheduledLower")]: d.scheduled,
      [t("posts")]: d.all,
    };
  });

  const filterButtons: { key: FilterMode; label: string }[] = [
    { key: "all", label: t("frequencyFilterAll") },
    { key: "published", label: t("frequencyFilterPublished") },
    { key: "scheduled", label: t("frequencyFilterScheduled") },
  ];

  const periodButtons: { key: PeriodDays; label: string }[] = [
    { key: 30, label: t("period30") },
    { key: 60, label: t("period60") },
    { key: 90, label: t("period90") },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("postFrequency")}</CardTitle>
        <CardDescription>{t("postFrequencyDescEnhanced")}</CardDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          <div className="flex gap-1">
            {filterButtons.map((btn) => (
              <Button
                key={btn.key}
                variant={filter === btn.key ? "default" : "outline"}
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setFilter(btn.key)}
              >
                {btn.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-1 ml-auto">
            {periodButtons.map((btn) => (
              <Button
                key={btn.key}
                variant={period === btn.key ? "secondary" : "ghost"}
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setPeriod(btn.key)}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center text-muted-foreground py-12">
            <p className="text-sm">{t("noPostsYet")}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              {filter === "all" ? (
                <>
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={t("published")}
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#22c55e" }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={t("scheduledLower")}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3, fill: "#3b82f6" }}
                    activeDot={{ r: 5 }}
                  />
                </>
              ) : (
                <Line
                  type="monotone"
                  dataKey={t("posts")}
                  stroke={filter === "published" ? "#22c55e" : "#3b82f6"}
                  strokeWidth={2}
                  dot={{ r: 3, fill: filter === "published" ? "#22c55e" : "#3b82f6" }}
                  activeDot={{ r: 5 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
