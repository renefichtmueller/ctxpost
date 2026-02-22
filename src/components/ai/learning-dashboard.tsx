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
  History,
  Cpu,
  FileCode,
  Palette,
  ExternalLink,
  Filter,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import { exportTrainingData } from "@/actions/training";
import Link from "next/link";

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

interface LearningHistoryItem {
  id: string;
  type: string;
  durationMs: number | null;
  modelUsed: string | null;
  createdAt: string;
}

interface ModelComparisonItem {
  model: string;
  avgDurationMs: number;
  totalCalls: number;
  minDurationMs: number;
  maxDurationMs: number;
}

interface PromptTemplate {
  key: string;
  prompt: string;
}

interface BrandVoiceInfo {
  name: string;
  tone: string;
  formality: string;
  emojiUsage: string;
  targetAudience: string | null;
  brandVoice: string | null;
  hashtagStrategy: string;
  languages: string;
  customInstructions: string | null;
}

interface LearningDashboardProps {
  stats: FeedbackStats;
  feedbackByType: FeedbackByType[];
  recentFeedback: RecentFeedbackItem[];
  learningHistory: LearningHistoryItem[];
  totalAICalls: number;
  avgResponseTime: number;
  modelComparison: ModelComparisonItem[];
  promptTemplates: PromptTemplate[];
  brandVoiceInfo: BrandVoiceInfo | null;
}

const TASK_ICONS: Record<string, typeof MessageSquare> = {
  BEST_TIMES: Clock,
  CONTENT_SUGGESTIONS: Lightbulb,
  TEXT_GENERATION: MessageSquare,
  HASHTAG_GENERATION: Hash,
  CONTENT_VARIATIONS: Shuffle,
  IMAGE_GENERATION: Palette,
  CONTENT_VARIATION: Shuffle,
};

const TASK_LABEL_KEYS: Record<string, string> = {
  BEST_TIMES: "taskBestTimes",
  CONTENT_SUGGESTIONS: "taskContentSuggestions",
  TEXT_GENERATION: "taskTextGeneration",
  HASHTAG_GENERATION: "taskHashtags",
  CONTENT_VARIATIONS: "taskContentVariations",
  IMAGE_GENERATION: "taskImageGeneration",
  CONTENT_VARIATION: "taskContentVariations",
};

const PROMPT_LABEL_KEYS: Record<string, string> = {
  bestTimes: "promptBestTimes",
  contentSuggestions: "promptContentSuggestions",
  hashtagGeneration: "promptHashtagGeneration",
  contentVariations: "promptContentVariations",
};

const PROMPT_DESC_KEYS: Record<string, string> = {
  bestTimes: "promptBestTimesDesc",
  contentSuggestions: "promptContentSuggestionsDesc",
  hashtagGeneration: "promptHashtagGenerationDesc",
  contentVariations: "promptContentVariationsDesc",
};

export function LearningDashboard({
  stats,
  feedbackByType,
  recentFeedback,
  learningHistory,
  totalAICalls,
  avgResponseTime,
  modelComparison,
  promptTemplates,
  brandVoiceInfo,
}: LearningDashboardProps) {
  const t = useTranslations("learning");
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    success?: boolean;
    count?: number;
    error?: string;
  } | null>(null);
  const [historyFilter, setHistoryFilter] = useState<string>("ALL");
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

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

  // Filter learning history
  const filteredHistory = historyFilter === "ALL"
    ? learningHistory
    : learningHistory.filter((item) => item.type === historyFilter);

  // Get unique types for filter
  const uniqueTypes = Array.from(new Set(learningHistory.map((item) => item.type)));

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

      {/* Learning History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            {t("learningHistory")}
          </CardTitle>
          <CardDescription>{t("learningHistoryDesc")}</CardDescription>
          {/* Stats summary */}
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">{totalAICalls}</span>
              <span className="text-xs text-muted-foreground">{t("totalAICalls")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">
                {avgResponseTime > 0 ? `${(avgResponseTime / 1000).toFixed(1)}s` : "-"}
              </span>
              <span className="text-xs text-muted-foreground">{t("avgResponseTimeLabel")}</span>
            </div>
          </div>
          {/* Filter buttons */}
          {uniqueTypes.length > 1 && (
            <div className="flex flex-wrap gap-1 pt-2">
              <Button
                variant={historyFilter === "ALL" ? "default" : "outline"}
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setHistoryFilter("ALL")}
              >
                <Filter className="h-3 w-3 mr-1" />
                {t("filterAll")}
              </Button>
              {uniqueTypes.map((type) => {
                const Icon = TASK_ICONS[type] || MessageSquare;
                const labelKey = TASK_LABEL_KEYS[type] || type;
                return (
                  <Button
                    key={type}
                    variant={historyFilter === type ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => setHistoryFilter(type)}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {t(labelKey)}
                  </Button>
                );
              })}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noLearningHistory")}</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredHistory.map((item) => {
                const Icon = TASK_ICONS[item.type] || MessageSquare;
                const labelKey = TASK_LABEL_KEYS[item.type] || item.type;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{t(labelKey)}</span>
                    </div>
                    {item.modelUsed && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {item.modelUsed}
                      </Badge>
                    )}
                    {item.durationMs !== null && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {(item.durationMs / 1000).toFixed(1)}s
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Performance Comparison */}
      {modelComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              {t("modelPerformance")}
            </CardTitle>
            <CardDescription>{t("modelPerformanceDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">{t("modelColumn")}</th>
                    <th className="text-right py-2 px-4 font-medium">{t("callsColumn")}</th>
                    <th className="text-right py-2 px-4 font-medium">{t("avgDurationColumn")}</th>
                    <th className="text-right py-2 px-4 font-medium">{t("minDurationColumn")}</th>
                    <th className="text-right py-2 pl-4 font-medium">{t("maxDurationColumn")}</th>
                  </tr>
                </thead>
                <tbody>
                  {modelComparison.map((model) => (
                    <tr key={model.model} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <Badge variant="outline" className="font-mono text-xs">
                          {model.model}
                        </Badge>
                      </td>
                      <td className="text-right py-2 px-4">{model.totalCalls}</td>
                      <td className="text-right py-2 px-4 font-medium">
                        {(model.avgDurationMs / 1000).toFixed(1)}s
                      </td>
                      <td className="text-right py-2 px-4 text-green-600">
                        {(model.minDurationMs / 1000).toFixed(1)}s
                      </td>
                      <td className="text-right py-2 pl-4 text-red-600">
                        {(model.maxDurationMs / 1000).toFixed(1)}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Prompt Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            {t("promptTemplates")}
          </CardTitle>
          <CardDescription>{t("promptTemplatesDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {promptTemplates.map((template) => {
            const isExpanded = expandedPrompt === template.key;
            return (
              <div key={template.key} className="rounded-lg border">
                <button
                  className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedPrompt(isExpanded ? null : template.key)}
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {t(PROMPT_LABEL_KEYS[template.key] || template.key)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {t(PROMPT_DESC_KEYS[template.key] || template.key)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t p-3">
                    <pre className="whitespace-pre-wrap text-xs text-muted-foreground bg-muted p-3 rounded-md max-h-64 overflow-y-auto font-mono">
                      {template.prompt}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Brand Voice Training Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            {t("brandVoiceTraining")}
          </CardTitle>
          <CardDescription>{t("brandVoiceTrainingDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {brandVoiceInfo ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground mb-1">{t("brandVoiceName")}</div>
                  <div className="text-sm font-medium">{brandVoiceInfo.name}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground mb-1">{t("brandVoiceTone")}</div>
                  <div className="text-sm font-medium capitalize">{brandVoiceInfo.tone}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground mb-1">{t("brandVoiceFormality")}</div>
                  <div className="text-sm font-medium capitalize">{brandVoiceInfo.formality}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground mb-1">{t("brandVoiceEmoji")}</div>
                  <div className="text-sm font-medium capitalize">{brandVoiceInfo.emojiUsage}</div>
                </div>
              </div>
              {brandVoiceInfo.brandVoice && (
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground mb-1">{t("brandVoiceDescription")}</div>
                  <div className="text-sm">{brandVoiceInfo.brandVoice}</div>
                </div>
              )}
              {brandVoiceInfo.targetAudience && (
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground mb-1">{t("brandVoiceAudience")}</div>
                  <div className="text-sm">{brandVoiceInfo.targetAudience}</div>
                </div>
              )}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
                <p className="text-xs text-blue-700 dark:text-blue-400">{t("brandVoiceInfluenceNote")}</p>
              </div>
              <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <ExternalLink className="h-3.5 w-3.5" />
                {t("brandVoiceEditLink")}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t("noBrandVoice")}</p>
              <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <ExternalLink className="h-3.5 w-3.5" />
                {t("brandVoiceSetupLink")}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

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
