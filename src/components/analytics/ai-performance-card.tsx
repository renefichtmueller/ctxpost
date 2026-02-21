"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Clock, Cpu, Zap } from "lucide-react";

interface AIOperation {
  id: string;
  type: string;
  durationMs: number | null;
  modelUsed: string | null;
  createdAt: string;
}

interface AIPerformanceCardProps {
  operations: AIOperation[];
}

// TYPE_LABELS moved inside component for i18n

const TYPE_COLORS: Record<string, string> = {
  BEST_TIMES: "bg-green-500/15 text-green-700 dark:text-green-400",
  CONTENT_SUGGESTIONS: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  HASHTAG_GENERATION: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  CONTENT_VARIATION: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  IMAGE_GENERATION: "bg-pink-500/15 text-pink-700 dark:text-pink-400",
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AIPerformanceCard({ operations }: AIPerformanceCardProps) {
  const t = useTranslations("analytics");

  const TYPE_LABELS: Record<string, string> = {
    BEST_TIMES: t("typeBestTimes"),
    CONTENT_SUGGESTIONS: t("typeContentSuggestions"),
    HASHTAG_GENERATION: t("typeHashtagGeneration"),
    CONTENT_VARIATION: t("typeContentVariations"),
    IMAGE_GENERATION: t("typeImageGeneration"),
  };

  if (operations.length === 0) {
    return null;
  }

  // Statistiken berechnen
  const withDuration = operations.filter((op) => op.durationMs != null);
  const avgDuration = withDuration.length > 0
    ? Math.round(withDuration.reduce((sum, op) => sum + (op.durationMs || 0), 0) / withDuration.length)
    : 0;
  const fastestOp = withDuration.length > 0
    ? withDuration.reduce((min, op) => (op.durationMs || Infinity) < (min.durationMs || Infinity) ? op : min)
    : null;
  const slowestOp = withDuration.length > 0
    ? withDuration.reduce((max, op) => (op.durationMs || 0) > (max.durationMs || 0) ? op : max)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          {t("aiPerformance")}
        </CardTitle>
        <CardDescription>
          {t("aiPerformanceDesc", { count: operations.length })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI Leiste */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">{t("avgDuration")}</p>
            <p className="text-lg font-bold">{avgDuration > 0 ? formatDuration(avgDuration) : "–"}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">{t("fastest")}</p>
            <p className="text-lg font-bold text-green-600">
              {fastestOp?.durationMs ? formatDuration(fastestOp.durationMs) : "–"}
            </p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">{t("slowest")}</p>
            <p className="text-lg font-bold text-orange-600">
              {slowestOp?.durationMs ? formatDuration(slowestOp.durationMs) : "–"}
            </p>
          </div>
        </div>

        {/* Operationen-Liste */}
        <div className="space-y-2">
          {operations.map((op) => (
            <div
              key={op.id}
              className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-[10px] border-0 ${TYPE_COLORS[op.type] || "bg-muted"}`}>
                    {TYPE_LABELS[op.type] || op.type}
                  </Badge>
                  {op.modelUsed && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Cpu className="h-3 w-3" />
                      {op.modelUsed}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                {op.durationMs != null && (
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDuration(op.durationMs)}
                  </span>
                )}
                <span>{formatDate(op.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
