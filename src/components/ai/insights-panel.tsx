"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock, Sparkles, Loader2, Lightbulb, CheckCircle2, CalendarClock,
  Bot, Type, Image, BarChart3, Timer, Info, Cpu, XCircle,
} from "lucide-react";
import { formatElapsed } from "@/hooks/use-elapsed-timer";
import { updateAISettings } from "@/actions/ai-settings";
import {
  MODEL_RECOMMENDATIONS,
  getRecommendationForModel,
  isRecommendedModel,
  getTierLabelKey,
} from "@/lib/ai/model-recommendations";
import type { AITaskType } from "@/lib/ai/ai-provider";
import { useAIAnalysis } from "@/contexts/ai-analysis-context";

// ─── Types ──────────────────────

interface EstimatedDuration {
  avgMs: number;
  count: number;
  model: string | null;
}

interface OllamaModel {
  name: string;
  size: number;
  details: {
    parameter_size: string;
    quantization_level: string;
    family: string;
  };
}

export interface InsightsPanelProps {
  initialBestTimes?: Record<string, unknown> | null;
  initialBestTimesDate?: string | null;
  initialBestTimesDuration?: number | null;
  initialBestTimesModel?: string | null;
  initialSuggestions?: Record<string, unknown> | null;
  initialSuggestionsDate?: string | null;
  initialSuggestionsDuration?: number | null;
  initialSuggestionsModel?: string | null;
  currentTextModel?: string;
  currentAnalysisModel?: string;
  currentImageModel?: string;
  currentProvider?: string;
  ollamaUrl?: string;
  estimatedDurations?: Record<string, EstimatedDuration>;
}

interface BestTime {
  day: string;
  time: string;
  score: number;
  reason?: string;
}

interface ContentSuggestion {
  platform: string;
  suggestion: string;
}

function formatDate(dateStr: string, locale: string = "en"): string {
  return new Date(dateStr).toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `~${Math.round(ms / 1000)}s`;
  return `~${Math.round(ms / 60000)}min`;
}

function formatElapsedMs(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ─── Model Config Card ──────────────────────

function ModelConfigCard({
  currentTextModel,
  currentAnalysisModel,
  currentImageModel,
  currentProvider,
  ollamaUrl,
  estimatedDurations,
}: {
  currentTextModel: string;
  currentAnalysisModel: string;
  currentImageModel: string;
  currentProvider: string;
  ollamaUrl: string;
  estimatedDurations: Record<string, EstimatedDuration>;
}) {
  const t = useTranslations("ai");
  const tCommon = useTranslations("common");

  const [textModel, setTextModel] = useState(currentTextModel);
  const [analysisModel, setAnalysisModel] = useState(currentAnalysisModel);
  const [imageModel, setImageModel] = useState(currentImageModel);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (currentProvider === "ollama" && ollamaUrl) {
      setModelsLoading(true);
      fetch("/api/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ollamaUrl }),
      })
        .then((r) => r.json())
        .then((data) => setOllamaModels(data.models || []))
        .catch(() => {})
        .finally(() => setModelsLoading(false));
    }
  }, [currentProvider, ollamaUrl]);

  const handleSaveModel = (taskType: AITaskType, newModel: string) => {
    const updatedText = taskType === "text" ? newModel : textModel;
    const updatedAnalysis = taskType === "analysis" ? newModel : analysisModel;
    const updatedImage = taskType === "image" ? newModel : imageModel;

    if (taskType === "text") setTextModel(newModel);
    if (taskType === "analysis") setAnalysisModel(newModel);
    if (taskType === "image") setImageModel(newModel);

    setSaveMessage(null);
    const formData = new FormData();
    formData.set("aiProvider", currentProvider);
    formData.set("textModel", updatedText);
    formData.set("analysisModel", updatedAnalysis);
    formData.set("imageModel", updatedImage);
    formData.set("ollamaUrl", ollamaUrl);
    formData.set("imageGenUrl", "");

    startTransition(async () => {
      const result = await updateAISettings(formData);
      if (result?.error) {
        setSaveMessage(`${tCommon("error")}: ${result.error}`);
      } else {
        setSaveMessage(t("saved"));
        setTimeout(() => setSaveMessage(null), 2000);
      }
    });
  };

  const modelNames = ollamaModels.map((m) => m.name);

  const renderModelSection = (
    taskType: AITaskType,
    label: string,
    icon: React.ReactNode,
    currentModel: string,
    durationTypes: string[]
  ) => {
    const rec = getRecommendationForModel(taskType, currentModel);
    const isRec = isRecommendedModel(taskType, currentModel);
    const recommendations = MODEL_RECOMMENDATIONS[taskType] || [];

    const durationStat = durationTypes
      .map((t) => estimatedDurations[t])
      .find((d) => d);

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
          {isRec && (
            <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">
              {t("recommended")}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentProvider === "claude" ? (
            <span className="text-sm text-muted-foreground">{currentModel}</span>
          ) : modelsLoading ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> {t("loadingModels")}
            </span>
          ) : (
            <Select
              value={currentModel || "__none__"}
              onValueChange={(v) => handleSaveModel(taskType, v === "__none__" ? "" : v)}
              disabled={isPending}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={t("selectModel")} />
              </SelectTrigger>
              <SelectContent>
                {taskType === "image" && (
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">{t("notConfigured")}</span>
                  </SelectItem>
                )}
                {modelNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    <div className="flex items-center gap-2">
                      <span>{name}</span>
                      {isRecommendedModel(taskType, name) && (
                        <Badge variant="secondary" className="text-[9px]">{t("recommendedShort")}</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {durationStat && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Timer className="h-3 w-3" />
            <span>
              {formatDuration(durationStat.avgMs)} ({t("avgFromCalls", { count: durationStat.count })})
            </span>
          </div>
        )}

        {rec && (
          <p className="text-[11px] text-muted-foreground pl-0.5">
            {t(rec.reasonKey)}
          </p>
        )}

        <div className="space-y-1 pl-0.5">
          {recommendations
            .filter((r) => r.model !== currentModel)
            .slice(0, 2)
            .map((r) => (
              <div key={r.model} className="flex items-start gap-1.5 text-[11px] text-muted-foreground/70">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                <span>
                  <span className="font-medium">{r.model}</span>
                  <span className="ml-1">({t(getTierLabelKey(r.tier))})</span>
                  <span className="ml-1">— {t(r.reasonKey)}</span>
                </span>
              </div>
            ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-5 w-5 text-primary" />
          {t("activeModels")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("activeModelsDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {renderModelSection(
          "text",
          t("textGeneration"),
          <Type className="h-4 w-4 text-blue-500" />,
          textModel,
          ["CONTENT_SUGGESTIONS", "HASHTAG_GENERATION", "CONTENT_VARIATION"]
        )}

        <div className="border-t" />

        {renderModelSection(
          "analysis",
          t("analysis"),
          <BarChart3 className="h-4 w-4 text-green-500" />,
          analysisModel,
          ["BEST_TIMES"]
        )}

        <div className="border-t" />

        {renderModelSection(
          "image",
          t("imageUnderstanding"),
          <Image className="h-4 w-4 text-purple-500" />,
          imageModel,
          ["IMAGE_GENERATION"]
        )}

        {saveMessage && (
          <div className={`flex items-center gap-1 text-xs ${
            saveMessage.startsWith(tCommon("error")) ? "text-destructive" : "text-green-600"
          }`}>
            <CheckCircle2 className="h-3 w-3" />
            {saveMessage}
          </div>
        )}

        {isPending && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t("saving")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Insights Panel (uses Context) ──────────────────────

export function InsightsPanel({
  initialBestTimes,
  initialBestTimesDate,
  initialBestTimesDuration,
  initialBestTimesModel,
  initialSuggestions,
  initialSuggestionsDate,
  initialSuggestionsDuration,
  initialSuggestionsModel,
  currentTextModel = "",
  currentAnalysisModel = "",
  currentImageModel = "",
  currentProvider = "ollama",
  ollamaUrl = "",
  estimatedDurations = {},
}: InsightsPanelProps) {
  const t = useTranslations("ai");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const {
    bestTimes: bt,
    suggestions: sg,
    startBestTimesAnalysis,
    startSuggestionsAnalysis,
    cancelBestTimes,
    cancelSuggestions,
  } = useAIAnalysis();

  const [contentInput, setContentInput] = useState("");

  // Use context data if available, otherwise fall back to server-side initial data
  const hasBtData = bt.data !== null || bt.loading || bt.error !== null;
  const hasSgData = sg.data !== null || sg.loading || sg.error !== null;

  // Best times: context or initial data
  const bestTimesDisplay: BestTime[] | null = (() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = hasBtData ? bt.data : (initialBestTimes as any);
    if (!rawData) return null;
    const times: BestTime[] = [];
    for (const rec of rawData.recommendations || []) {
      for (const slot of rec.bestTimeSlots || []) {
        times.push({
          day: `${rec.platform} – ${(rec.bestDays || []).join(", ")}`,
          time: `${slot.start} – ${slot.end}`,
          score: slot.score,
          reason: slot.reason,
        });
      }
    }
    return times;
  })();

  const btDate = hasBtData ? bt.date : (initialBestTimesDate || null);
  const btDurationMs = hasBtData ? bt.durationMs : null;
  const btServerDurationMs = hasBtData ? bt.serverDurationMs : (initialBestTimesDuration || null);
  const btModelUsed = hasBtData ? bt.modelUsed : (initialBestTimesModel || null);

  // Suggestions: context or initial data
  const suggestionsDisplay: ContentSuggestion[] | null = (() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = hasSgData ? sg.data : (initialSuggestions as any);
    if (!rawData?.suggestions) return null;
    return rawData.suggestions.map((s: { platform: string; improvedContent: string; reasoning: string; tips?: string[] }) => ({
      platform: s.platform,
      suggestion: `${s.improvedContent}\n\n${s.reasoning}${s.tips?.length ? "\n\n" + s.tips.map((t: string) => `• ${t}`).join("\n") : ""}`,
    }));
  })();

  const sgDate = hasSgData ? sg.date : (initialSuggestionsDate || null);
  const sgDurationMs = hasSgData ? sg.durationMs : null;
  const sgServerDurationMs = hasSgData ? sg.serverDurationMs : (initialSuggestionsDuration || null);
  const sgModelUsed = hasSgData ? sg.modelUsed : (initialSuggestionsModel || null);

  return (
    <div className="space-y-6">
      {/* Model Config Card */}
      <ModelConfigCard
        currentTextModel={currentTextModel}
        currentAnalysisModel={currentAnalysisModel}
        currentImageModel={currentImageModel}
        currentProvider={currentProvider}
        ollamaUrl={ollamaUrl}
        estimatedDurations={estimatedDurations}
      />

      {/* Analysis Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Best Times Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t("bestTimes")}
            </CardTitle>
            <CardDescription>
              {t("bestTimesDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={startBestTimesAnalysis}
                disabled={bt.loading}
                className="flex-1 gap-2"
              >
                {bt.loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {bt.progress
                      ? `${t("analyzingBestTimes")} (${formatElapsedMs(bt.elapsedMs)})`
                      : t("connectingAI")}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {t("startAnalysis")}
                  </>
                )}
              </Button>
              {bt.loading && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={cancelBestTimes}
                  title={tCommon("cancel")}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>

            {btDate && !bt.loading && !btDurationMs && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {t("lastAnalysis")} {formatDate(btDate, locale)}
                  {btServerDurationMs && (
                    <span className="ml-1">
                      in <span className="font-medium text-foreground">{formatElapsed(btServerDurationMs)}</span>
                    </span>
                  )}
                  {btModelUsed && (
                    <span className="ml-1 inline-flex items-center gap-0.5">
                      <Cpu className="h-3 w-3" /> {btModelUsed}
                    </span>
                  )}
                </span>
              </div>
            )}

            {bt.error && (
              <p className="text-sm text-destructive">{bt.error}</p>
            )}

            {btDurationMs !== null && bestTimesDisplay && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                <span>
                  {t("analysisComplete")}{" "}
                  <span className="font-medium text-foreground">
                    {formatElapsed(btDurationMs)}
                  </span>
                  {btServerDurationMs && (
                    <span className="ml-1">
                      (LLM: {formatElapsed(btServerDurationMs)})
                    </span>
                  )}
                  {btModelUsed && (
                    <span className="ml-1 inline-flex items-center gap-0.5">
                      <Cpu className="h-3 w-3" /> {btModelUsed}
                    </span>
                  )}
                </span>
              </div>
            )}

            {bestTimesDisplay && bestTimesDisplay.length > 0 && (
              <>
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("scoreLegend")}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
                      0.8 – 1.0 = {t("optimal")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500" />
                      0.5 – 0.79 = {t("good")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" />
                      0.3 – 0.49 = {t("medium")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
                      0.0 – 0.29 = {t("poor")}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {bestTimesDisplay.map((time, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{time.day}</p>
                        <p className="text-sm text-muted-foreground">
                          {t("timeOclock", { time: time.time })}
                        </p>
                        {time.reason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {time.reason}
                          </p>
                        )}
                      </div>
                      <Badge
                        className={`text-xs border-0 ${
                          time.score >= 0.8
                            ? "bg-green-500/15 text-green-700 dark:text-green-400"
                            : time.score >= 0.5
                              ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"
                              : time.score >= 0.3
                                ? "bg-orange-500/15 text-orange-700 dark:text-orange-400"
                                : "bg-red-500/15 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {time.score.toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}

            {bestTimesDisplay && bestTimesDisplay.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("notEnoughData")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Suggestions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              {t("suggestions")}
            </CardTitle>
            <CardDescription>
              {t("suggestionsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={t("suggestionsPlaceholder")}
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              rows={5}
              className="resize-none"
            />

            <div className="flex gap-2">
              <Button
                onClick={() =>
                  startSuggestionsAnalysis(contentInput, ["FACEBOOK", "LINKEDIN"])
                }
                disabled={sg.loading || !contentInput.trim()}
                className="flex-1 gap-2"
              >
                {sg.loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {sg.progress
                      ? `${t("generatingSuggestions")} (${formatElapsedMs(sg.elapsedMs)})`
                      : t("connectingAI")}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {t("getSuggestions")}
                  </>
                )}
              </Button>
              {sg.loading && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={cancelSuggestions}
                  title={tCommon("cancel")}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>

            {sgDate && !sg.loading && !sgDurationMs && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {t("lastSuggestions")} {formatDate(sgDate, locale)}
                  {sgServerDurationMs && (
                    <span className="ml-1">
                      in <span className="font-medium text-foreground">{formatElapsed(sgServerDurationMs)}</span>
                    </span>
                  )}
                  {sgModelUsed && (
                    <span className="ml-1 inline-flex items-center gap-0.5">
                      <Cpu className="h-3 w-3" /> {sgModelUsed}
                    </span>
                  )}
                </span>
              </div>
            )}

            {sg.error && (
              <p className="text-sm text-destructive">{sg.error}</p>
            )}

            {sgDurationMs !== null && suggestionsDisplay && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                <span>
                  {t("suggestionsGenerated")}{" "}
                  <span className="font-medium text-foreground">
                    {formatElapsed(sgDurationMs)}
                  </span>
                  {sgServerDurationMs && (
                    <span className="ml-1">
                      (LLM: {formatElapsed(sgServerDurationMs)})
                    </span>
                  )}
                  {sgModelUsed && (
                    <span className="ml-1 inline-flex items-center gap-0.5">
                      <Cpu className="h-3 w-3" /> {sgModelUsed}
                    </span>
                  )}
                </span>
              </div>
            )}

            {suggestionsDisplay && suggestionsDisplay.length > 0 && (
              <div className="space-y-3">
                {suggestionsDisplay.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border space-y-2"
                  >
                    <Badge variant="secondary">{suggestion.platform}</Badge>
                    <p className="text-sm whitespace-pre-wrap">
                      {suggestion.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {suggestionsDisplay && suggestionsDisplay.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("noSuggestions")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
