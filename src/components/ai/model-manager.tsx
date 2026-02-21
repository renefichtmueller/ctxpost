"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  Download,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Cpu,
  Server,
  Cloud,
  Type,
  Image,
  BarChart3,
  Save,
  Zap,
  Brain,
  Eye,
  Database,
  ChevronDown,
  ChevronUp,
  MemoryStick,
} from "lucide-react";
import { updateAISettings } from "@/actions/ai-settings";
import {
  MODEL_DESCRIPTIONS,
  getModelDescription,
  getCategoryStyle,
  type ModelDescription,
} from "@/lib/ai/model-descriptions";

interface OllamaModel {
  name: string;
  size: number;
  details: {
    parameter_size: string;
    quantization_level: string;
    family: string;
  };
}

interface ModelManagerProps {
  currentProvider: string;
  currentTextModel: string;
  currentImageModel: string;
  currentAnalysisModel: string;
  ollamaUrl: string;
  imageGenUrl: string;
  imageGenProvider: string;
}

function formatSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(gb * 1024).toFixed(0)} MB`;
}

const POPULAR_TEXT_MODELS = [
  { name: "qwen2.5:32b" },
  { name: "qwen2.5:14b" },
  { name: "qwen2.5:7b" },
  { name: "llama3.1:8b" },
  { name: "llama3.1:70b" },
  { name: "mistral:7b" },
  { name: "gemma2:27b" },
  { name: "deepseek-r1:14b" },
];

const POPULAR_VISION_MODELS = [
  { name: "llava:7b" },
  { name: "llava:13b" },
  { name: "bakllava:latest" },
  { name: "llava-llama3:8b" },
];

/** Category icon component */
function CategoryIcon({ category }: { category: ModelDescription["category"] }) {
  switch (category) {
    case "text": return <Type className="h-3 w-3" />;
    case "vision": return <Eye className="h-3 w-3" />;
    case "embedding": return <Database className="h-3 w-3" />;
    case "reasoning": return <Brain className="h-3 w-3" />;
  }
}

/** Model info badge/card for popular models list */
function ModelInfoCompact({ desc, t }: { desc: ModelDescription; t: (key: string) => string }) {
  const style = getCategoryStyle(desc.category);
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge className={`text-[10px] ${style.bgClass} ${style.colorClass} border-0 gap-0.5`}>
          <CategoryIcon category={desc.category} />
          {t(style.labelKey)}
        </Badge>
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
          <MemoryStick className="h-2.5 w-2.5" />
          {desc.vramRequired}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{t(desc.descriptionKey)}</p>
    </div>
  );
}

/** Expanded model details for installed models */
function ModelDetailsExpanded({ desc, t }: { desc: ModelDescription; t: (key: string) => string }) {
  const style = getCategoryStyle(desc.category);
  return (
    <div className="mt-2 pt-2 border-t border-dashed space-y-2">
      <p className="text-xs text-muted-foreground">{t(desc.descriptionKey)}</p>
      <div className="flex flex-wrap gap-1.5">
        <Badge className={`text-[10px] ${style.bgClass} ${style.colorClass} border-0 gap-0.5`}>
          <CategoryIcon category={desc.category} />
          {t(style.labelKey)}
        </Badge>
        <Badge variant="outline" className="text-[10px] gap-0.5">
          <MemoryStick className="h-2.5 w-2.5" />
          {t("vramRequired")}: {desc.vramRequired}
        </Badge>
      </div>
      {desc.strengths.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{t("strengthsLabel")}:</p>
          <div className="flex flex-wrap gap-1">
            {desc.strengths.map((s) => (
              <Badge key={s} variant="secondary" className="text-[10px]">
                <Zap className="h-2.5 w-2.5 mr-0.5" />
                {t(s)}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {desc.bestFor.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{t("bestForLabel")}:</p>
          <div className="flex flex-wrap gap-1">
            {desc.bestFor.map((b) => (
              <Badge key={b} variant="outline" className="text-[10px]">{t(b)}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ModelManager({
  currentProvider,
  currentTextModel,
  currentImageModel,
  currentAnalysisModel,
  ollamaUrl,
  imageGenUrl: initialImageGenUrl,
  imageGenProvider: initialImageGenProvider,
}: ModelManagerProps) {
  const t = useTranslations("models");
  const tCommon = useTranslations("common");
  const tAi = useTranslations("ai");

  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Model assignments
  const [textModel, setTextModel] = useState(currentTextModel);
  const [imageModel, setImageModel] = useState(currentImageModel);
  const [analysisModel, setAnalysisModel] = useState(currentAnalysisModel);
  const [imageGenUrl, setImageGenUrl] = useState(initialImageGenUrl);
  const [imageGenProvider, setImageGenProvider] = useState(initialImageGenProvider || "sd-webui");
  const [isPending, startTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [pullModelName, setPullModelName] = useState("");
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState<string>("");
  const [pullPercent, setPullPercent] = useState<number | null>(null);
  const [pullMessage, setPullMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [deletingModel, setDeletingModel] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ollamaUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModels(data.models || []);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : t("loadError")
      );
    } finally {
      setIsLoading(false);
    }
  }, [ollamaUrl, t]);

  useEffect(() => {
    if (currentProvider === "ollama") {
      loadModels();
    } else {
      setIsLoading(false);
    }
  }, [currentProvider, loadModels]);

  const handleSaveAssignments = () => {
    setSaveMessage(null);
    const formData = new FormData();
    formData.set("aiProvider", currentProvider);
    formData.set("textModel", textModel);
    formData.set("imageModel", imageModel);
    formData.set("analysisModel", analysisModel);
    formData.set("ollamaUrl", ollamaUrl);
    formData.set("imageGenUrl", imageGenUrl);
    formData.set("imageGenProvider", imageGenProvider);

    startTransition(async () => {
      const result = await updateAISettings(formData);
      if (result?.error) {
        setSaveMessage({ type: "error", text: result.error });
      } else {
        setSaveMessage({ type: "success", text: t("assignmentsSaved") });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    });
  };

  const handlePull = async (name?: string) => {
    const modelName = name || pullModelName.trim();
    if (!modelName) return;

    setIsPulling(true);
    setPullProgress("");
    setPullPercent(null);
    setPullMessage(null);

    try {
      const response = await fetch("/api/ai/models/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName }),
      });

      if (!response.ok) {
        throw new Error(t("downloadFailed"));
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "progress") {
              setPullProgress(data.status);
              if (data.percent !== undefined) {
                setPullPercent(data.percent);
              }
            } else if (data.type === "complete") {
              setPullMessage({ type: "success", text: t("downloadSuccess", { model: modelName }) });
              setPullModelName("");
              await loadModels();
            } else if (data.type === "error") {
              setPullMessage({ type: "error", text: data.error });
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      setPullMessage({
        type: "error",
        text: err instanceof Error ? err.message : t("downloadFailed"),
      });
    } finally {
      setIsPulling(false);
      setPullPercent(null);
      setPullProgress("");
    }
  };

  const handleDelete = async (modelName: string) => {
    setDeletingModel(modelName);
    setDeleteMessage(null);

    try {
      const res = await fetch("/api/ai/models/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName }),
      });
      const data = await res.json();

      if (!res.ok) {
        setDeleteMessage({ type: "error", text: data.error });
      } else {
        setDeleteMessage({ type: "success", text: t("deleteSuccess", { model: modelName }) });
        setTimeout(() => setDeleteMessage(null), 3000);
        await loadModels();
      }
    } catch (err) {
      setDeleteMessage({
        type: "error",
        text: err instanceof Error ? err.message : t("deleteFailed"),
      });
    } finally {
      setDeletingModel(null);
    }
  };

  const isActiveModel = (name: string) =>
    name === textModel || name === imageModel || name === analysisModel;

  if (currentProvider === "claude") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            {t("claudeApi")}
          </CardTitle>
          <CardDescription>
            {t("claudeApiDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 rounded-lg border">
            <Bot className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">{t("activeModel")}</p>
              <p className="text-xs text-muted-foreground">{currentTextModel}</p>
            </div>
            <Badge variant="secondary" className="ml-auto">{t("cloud")}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            {t("switchToOllama")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalSize = models.reduce((acc, m) => acc + m.size, 0);
  const modelNames = models.map((m) => m.name);

  return (
    <div className="space-y-6">
      {/* Server Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                {t("ollamaServer")}
              </CardTitle>
              <CardDescription className="mt-1">{ollamaUrl}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadModels}
              disabled={isLoading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              {t("refresh")}
            </Button>
          </div>
        </CardHeader>
        {!isLoading && !loadError && (
          <CardContent>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-muted-foreground" />
                <span>{t("modelCount", { count: models.length })}</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span>{t("totalSize", { size: formatSize(totalSize) })}</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Error */}
      {loadError && (
        <div className="flex items-center gap-2 p-4 rounded-lg border border-destructive/30 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {loadError}
        </div>
      )}

      {/* Model Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>{t("assignments")}</CardTitle>
          <CardDescription>
            {t("assignmentsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Textgenerierung */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-blue-500" />
              <label className="text-sm font-medium">{t("textGeneration")}</label>
              <Badge variant="outline" className="text-[10px]">{t("textGenDesc")}</Badge>
            </div>
            {modelNames.length > 0 ? (
              <Select value={textModel} onValueChange={setTextModel}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectModel")} />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.name} value={m.name}>
                      <div className="flex items-center gap-2">
                        <span>{m.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {m.details.parameter_size} · {formatSize(m.size)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{t("downloadFirst")}</p>
            )}
          </div>

          {/* Bildgenerierung */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-purple-500" />
              <label className="text-sm font-medium">{t("imageVision")}</label>
              <Badge variant="outline" className="text-[10px]">{t("imageVisionDesc")}</Badge>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">{t("visionModel")}</label>
                <Select value={imageModel || "__none__"} onValueChange={(v) => setImageModel(v === "__none__" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectVision")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="text-muted-foreground">{t("noVision")}</span>
                    </SelectItem>
                    {models.map((m) => (
                      <SelectItem key={m.name} value={m.name}>
                        <div className="flex items-center gap-2">
                          <span>{m.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {m.details.parameter_size} · {formatSize(m.size)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t("imageGenBackend")}</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setImageGenProvider("sd-webui");
                      if (!imageGenUrl) setImageGenUrl("http://192.168.178.195:7860");
                    }}
                    className={`text-left p-2 rounded-lg border-2 transition-colors ${
                      imageGenProvider === "sd-webui"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <p className="text-xs font-medium">{t("sdWebui")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("sdWebuiDesc")}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageGenProvider("comfyui");
                      if (!imageGenUrl || imageGenUrl.includes(":7860")) setImageGenUrl("http://192.168.178.195:8188");
                    }}
                    className={`text-left p-2 rounded-lg border-2 transition-colors ${
                      imageGenProvider === "comfyui"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <p className="text-xs font-medium">{t("comfyui")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("comfyuiDesc")}</p>
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t("imageGenServerUrl")}</label>
                <Input
                  placeholder={imageGenProvider === "comfyui" ? "http://192.168.178.195:8188" : "http://192.168.178.195:7860"}
                  value={imageGenUrl}
                  onChange={(e) => setImageGenUrl(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Analyse */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-500" />
              <label className="text-sm font-medium">{t("analysis")}</label>
              <Badge variant="outline" className="text-[10px]">{t("analysisDesc")}</Badge>
            </div>
            {modelNames.length > 0 ? (
              <Select value={analysisModel} onValueChange={setAnalysisModel}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectModel")} />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.name} value={m.name}>
                      <div className="flex items-center gap-2">
                        <span>{m.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {m.details.parameter_size} · {formatSize(m.size)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{t("downloadFirst")}</p>
            )}
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-2 border-t">
            <Button onClick={handleSaveAssignments} disabled={isPending} className="gap-2">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tAi("saving")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {t("saveAssignments")}
                </>
              )}
            </Button>
            {saveMessage && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  saveMessage.type === "success" ? "text-green-600" : "text-destructive"
                }`}
              >
                {saveMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {saveMessage.text}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Installed Models */}
      <Card>
        <CardHeader>
          <CardTitle>{t("installedModels")}</CardTitle>
          <CardDescription>
            {t("installedModelsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              {tAi("loadingModels")}
            </div>
          ) : models.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              {t("noModels")}
            </p>
          ) : (
            <div className="space-y-3">
              {models.map((model) => {
                const desc = getModelDescription(model.name);
                const isExpanded = expandedModel === model.name;
                const catStyle = desc ? getCategoryStyle(desc.category) : null;
                return (
                  <div
                    key={model.name}
                    className={`p-3 rounded-lg border transition-colors ${
                      isActiveModel(model.name)
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Bot className={`h-5 w-5 shrink-0 ${isActiveModel(model.name) ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium truncate">{model.name}</p>
                          {model.name === textModel && (
                            <Badge className="text-[10px] bg-blue-500/15 text-blue-700 dark:text-blue-400 border-0">{t("textTag")}</Badge>
                          )}
                          {model.name === imageModel && (
                            <Badge className="text-[10px] bg-purple-500/15 text-purple-700 dark:text-purple-400 border-0">{t("imageTag")}</Badge>
                          )}
                          {model.name === analysisModel && (
                            <Badge className="text-[10px] bg-green-500/15 text-green-700 dark:text-green-400 border-0">{t("analysisTag")}</Badge>
                          )}
                          {catStyle && desc && (
                            <Badge className={`text-[10px] ${catStyle.bgClass} ${catStyle.colorClass} border-0 gap-0.5`}>
                              <CategoryIcon category={desc.category} />
                              {t(catStyle.labelKey)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <Cpu className="h-3 w-3" />
                            {model.details.parameter_size}
                          </span>
                          <span>{model.details.quantization_level}</span>
                          <span>{model.details.family}</span>
                          <span>{formatSize(model.size)}</span>
                          {desc && (
                            <span className="flex items-center gap-0.5">
                              <MemoryStick className="h-3 w-3" />
                              {desc.vramRequired}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {desc && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedModel(isExpanded ? null : model.name)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(model.name)}
                          disabled={deletingModel === model.name || isActiveModel(model.name)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {deletingModel === model.name ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {isExpanded && desc && (
                      <ModelDetailsExpanded desc={desc} t={t} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {deleteMessage && (
            <div
              className={`mt-3 flex items-center gap-1 text-sm ${
                deleteMessage.type === "success" ? "text-green-600" : "text-destructive"
              }`}
            >
              {deleteMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {deleteMessage.text}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pull New Model */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t("downloadModel")}
          </CardTitle>
          <CardDescription>
            {t("downloadModelDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Custom Model Input */}
          <div className="flex gap-2">
            <Input
              placeholder={t("downloadModelPlaceholder")}
              value={pullModelName}
              onChange={(e) => setPullModelName(e.target.value)}
              disabled={isPulling}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handlePull();
                }
              }}
            />
            <Button
              onClick={() => handlePull()}
              disabled={!pullModelName.trim() || isPulling}
              className="gap-1.5 shrink-0"
            >
              {isPulling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {t("download")}
            </Button>
          </div>

          {/* Pull Progress */}
          {isPulling && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {pullProgress || t("downloadStarting")}
              </div>
              {pullPercent !== null && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${pullPercent}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {pullMessage && (
            <div
              className={`flex items-center gap-1 text-sm ${
                pullMessage.type === "success" ? "text-green-600" : "text-destructive"
              }`}
            >
              {pullMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {pullMessage.text}
            </div>
          )}

          {/* Popular Text Models */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">{t("popularTextModels")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POPULAR_TEXT_MODELS.map((pm) => {
                const isInstalled = models.some((m) => m.name === pm.name);
                const desc = getModelDescription(pm.name);
                return (
                  <button
                    key={pm.name}
                    type="button"
                    onClick={() => {
                      if (!isInstalled && !isPulling) {
                        handlePull(pm.name);
                      }
                    }}
                    disabled={isInstalled || isPulling}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      isInstalled
                        ? "bg-muted/50 border-muted cursor-default"
                        : "hover:bg-muted/50 cursor-pointer hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{pm.name}</span>
                      {isInstalled && (
                        <Badge variant="outline" className="text-[10px] text-green-600">
                          {t("installed")}
                        </Badge>
                      )}
                    </div>
                    {desc ? (
                      <ModelInfoCompact desc={desc} t={t} />
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">{pm.name}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Popular Vision Models */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">{t("popularVisionModels")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POPULAR_VISION_MODELS.map((pm) => {
                const isInstalled = models.some((m) => m.name === pm.name);
                const desc = getModelDescription(pm.name);
                return (
                  <button
                    key={pm.name}
                    type="button"
                    onClick={() => {
                      if (!isInstalled && !isPulling) {
                        handlePull(pm.name);
                      }
                    }}
                    disabled={isInstalled || isPulling}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      isInstalled
                        ? "bg-muted/50 border-muted cursor-default"
                        : "hover:bg-muted/50 cursor-pointer hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5 text-purple-500" />
                      <span className="text-sm font-medium">{pm.name}</span>
                      {isInstalled && (
                        <Badge variant="outline" className="text-[10px] text-green-600">
                          {t("installed")}
                        </Badge>
                      )}
                    </div>
                    {desc ? (
                      <ModelInfoCompact desc={desc} t={t} />
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">{pm.name}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
