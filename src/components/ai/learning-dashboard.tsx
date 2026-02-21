"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Download,
  MessageSquare,
  Hash,
  Clock,
  Lightbulb,
  Shuffle,
  Database,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { exportTrainingData } from "@/actions/training";

interface FeedbackStats {
  total: number;
  good: number;
  bad: number;
  edited: number;
  approvalRate: number;
}

interface FeedbackByType {
  insightType: string;
  count: number;
}

interface RecentFeedbackItem {
  id: string;
  insightType: string;
  rating: string;
  originalOutput: string;
  editedOutput: string | null;
  modelUsed: string | null;
  createdAt: string;
}

interface LearningDashboardProps {
  stats: FeedbackStats;
  feedbackByType: FeedbackByType[];
  recentFeedback: RecentFeedbackItem[];
}

const TASK_ICONS: Record<string, typeof MessageSquare> = {
  BEST_TIMES: Clock,
  CONTENT_SUGGESTIONS: Lightbulb,
  TEXT_GENERATION: MessageSquare,
  HASHTAG_GENERATION: Hash,
  CONTENT_VARIATIONS: Shuffle,
};

const TASK_LABEL_KEYS: Record<string, string> = {
  BEST_TIMES: "taskBestTimes",
  CONTENT_SUGGESTIONS: "taskContentSuggestions",
  TEXT_GENERATION: "taskTextGeneration",
  HASHTAG_GENERATION: "taskHashtags",
  CONTENT_VARIATIONS: "taskContentVariations",
};

export function LearningDashboard({
  stats,
  feedbackByType,
  recentFeedback,
}: LearningDashboardProps) {
  const t = useTranslations("learning");
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    success?: boolean;
    count?: number;
    error?: string;
  } | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setExportResult(null);

    try {
      const result = await exportTrainingData();

      if (result.success && result.data) {
        // Download as file
        const blob = new Blob([result.data], { type: "application/jsonl" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `training-data-${new Date().toISOString().slice(0, 10)}.jsonl`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setExportResult({ success: true, count: result.count });
      } else if (result.error === "no_data") {
        setExportResult({ error: "no_data" });
      } else {
        setExportResult({ error: "export_failed" });
      }
    } catch {
      setExportResult({ error: "export_failed" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>{t("feedbackStats")}</CardTitle>
          <CardDescription>{t("feedbackStatsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.total === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noFeedbackYet")}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-4 text-center">
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">{t("totalFeedback")}</div>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  <span className="text-3xl font-bold text-green-600">{stats.good}</span>
                </div>
                <div className="text-sm text-muted-foreground">{t("positiveFeedback")}</div>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <ThumbsDown className="h-5 w-5 text-red-600" />
                  <span className="text-3xl font-bold text-red-600">{stats.bad}</span>
                </div>
                <div className="text-sm text-muted-foreground">{t("negativeFeedback")}</div>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Pencil className="h-5 w-5 text-blue-600" />
                  <span className="text-3xl font-bold text-blue-600">{stats.edited}</span>
                </div>
                <div className="text-sm text-muted-foreground">{t("editedFeedback")}</div>
              </div>
            </div>
          )}

          {stats.total > 0 && (
            <div className="mt-4 rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("approvalRate")}</span>
                <span className="text-lg font-bold">
                  {(stats.approvalRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-background">
                <div
                  className="h-2 rounded-full bg-green-500 transition-all"
                  style={{ width: `${stats.approvalRate * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback by Task Type */}
      {feedbackByType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("feedbackByType")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {feedbackByType.map((item) => {
                const Icon = TASK_ICONS[item.insightType] || MessageSquare;
                const labelKey = TASK_LABEL_KEYS[item.insightType] || item.insightType;
                return (
                  <div
                    key={item.insightType}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{t(labelKey)}</div>
                    </div>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>{t("trainingPipeline")}</CardTitle>
          <CardDescription>{t("trainingPipelineDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Training Steps */}
          <div>
            <h3 className="text-sm font-semibold mb-4">{t("trainingSteps")}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { titleKey: "step1Title", descKey: "step1Desc", icon: ThumbsUp, color: "text-green-600" },
                { titleKey: "step2Title", descKey: "step2Desc", icon: Download, color: "text-blue-600" },
                { titleKey: "step3Title", descKey: "step3Desc", icon: Database, color: "text-purple-600" },
                { titleKey: "step4Title", descKey: "step4Desc", icon: CheckCircle2, color: "text-emerald-600" },
              ].map((step) => (
                <div key={step.titleKey} className="flex gap-3 rounded-lg border p-4">
                  <step.icon className={`h-5 w-5 mt-0.5 ${step.color} shrink-0`} />
                  <div>
                    <h4 className="text-sm font-medium">{t(step.titleKey)}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{t(step.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Section */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">{t("exportData")}</h4>
                <p className="text-xs text-muted-foreground mt-1">{t("exportDataDesc")}</p>
              </div>
              <Button onClick={handleExport} disabled={exporting || stats.total === 0} size="sm">
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {t("downloadJsonl")}
              </Button>
            </div>
            {exportResult && (
              <div className="mt-3">
                {exportResult.success ? (
                  <p className="text-sm text-green-600">
                    {t("exportedItems", { count: exportResult.count ?? 0 })}
                  </p>
                ) : exportResult.error === "no_data" ? (
                  <p className="text-sm text-muted-foreground">{t("noExportData")}</p>
                ) : (
                  <p className="text-sm text-destructive">{t("exportError")}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* RAG System */}
      <Card>
        <CardHeader>
          <CardTitle>{t("ragSystem")}</CardTitle>
          <CardDescription>{t("ragSystemDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("ragNotConfigured")}</p>
        </CardContent>
      </Card>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>{t("recentFeedback")}</CardTitle>
          <CardDescription>{t("recentFeedbackDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {recentFeedback.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noRecentFeedback")}</p>
          ) : (
            <div className="space-y-3">
              {recentFeedback.map((item) => {
                const Icon = TASK_ICONS[item.insightType] || MessageSquare;
                const labelKey = TASK_LABEL_KEYS[item.insightType] || item.insightType;
                return (
                  <div key={item.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{t(labelKey)}</span>
                      <Badge
                        variant={
                          item.rating === "GOOD"
                            ? "default"
                            : item.rating === "EDITED"
                              ? "secondary"
                              : "destructive"
                        }
                        className="text-xs"
                      >
                        {item.rating === "GOOD"
                          ? t("feedbackGood")
                          : item.rating === "EDITED"
                            ? t("feedbackEdited")
                            : t("feedbackBad")}
                      </Badge>
                      {item.modelUsed && (
                        <span className="text-xs text-muted-foreground ml-auto">{item.modelUsed}</span>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="text-xs font-medium text-muted-foreground">{t("modelOutput")}:</span>
                      <p className="mt-0.5 text-foreground line-clamp-2">{item.originalOutput}</p>
                    </div>
                    {item.editedOutput && (
                      <div className="text-sm border-l-2 border-blue-500 pl-3">
                        <span className="text-xs font-medium text-blue-600">
                          <ArrowRight className="h-3 w-3 inline mr-1" />
                          {t("userEdit")}:
                        </span>
                        <p className="mt-0.5 text-foreground line-clamp-2">{item.editedOutput}</p>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
