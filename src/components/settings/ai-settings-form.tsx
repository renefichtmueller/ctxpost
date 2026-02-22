"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Cloud, Server, Loader2, CheckCircle2, AlertCircle, RefreshCw, Type, Image, BarChart3 } from "lucide-react";
import { updateAISettings } from "@/actions/ai-settings";

interface OllamaModel {
  name: string;
  size: number;
  details: {
    parameter_size: string;
    quantization_level: string;
    family: string;
  };
}

interface AISettingsFormProps {
  currentProvider: string;
  currentTextModel: string;
  currentImageModel: string;
  currentAnalysisModel: string;
  currentOllamaUrl: string;
  currentImageGenUrl: string;
  currentImageGenProvider: string;
}

function formatSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(gb * 1024).toFixed(0)} MB`;
}

export function AISettingsForm({
  currentProvider,
  currentTextModel,
  currentImageModel,
  currentAnalysisModel,
  currentOllamaUrl,
  currentImageGenUrl,
  currentImageGenProvider,
}: AISettingsFormProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tAi = useTranslations("ai");

  const [provider, setProvider] = useState(currentProvider);
  const [textModel, setTextModel] = useState(currentTextModel);
  const [imageModel, setImageModel] = useState(currentImageModel);
  const [analysisModel, setAnalysisModel] = useState(currentAnalysisModel);
  const [ollamaUrl, setOllamaUrl] = useState(currentOllamaUrl);
  const [imageGenUrl, setImageGenUrl] = useState(currentImageGenUrl);
  const [imageGenProvider, setImageGenProvider] = useState(currentImageGenProvider || "sd-webui");
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load Ollama models when URL changes or provider is ollama
  const loadOllamaModels = async (url?: string) => {
    const targetUrl = url || ollamaUrl;
    setModelsLoading(true);
    setModelsError(null);
    try {
      const res = await fetch("/api/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ollamaUrl: targetUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOllamaModels(data.models || []);
      // If current textModel isn't in the list, select the first one
      if (data.models?.length > 0) {
        const modelNames = data.models.map((m: OllamaModel) => m.name);
        if (!modelNames.includes(textModel)) {
          setTextModel(data.models[0].name);
        }
        if (analysisModel && !modelNames.includes(analysisModel)) {
          setAnalysisModel(data.models[0].name);
        }
      }
    } catch (err) {
      setModelsError(
        err instanceof Error ? err.message : t("modelsLoadError")
      );
    } finally {
      setModelsLoading(false);
    }
  };

  useEffect(() => {
    if (provider === "ollama") {
      loadOllamaModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  const handleSave = () => {
    setSaveMessage(null);
    const formData = new FormData();
    formData.set("aiProvider", provider);
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
        setSaveMessage({ type: "success", text: t("settingsSaved") });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    });
  };

  const renderModelSelect = (
    value: string,
    onChange: (v: string) => void,
    label: string,
    allowNone = false
  ) => {
    if (modelsLoading) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg border text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("modelsLoading")}
        </div>
      );
    }
    if (modelsError) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {modelsError}
        </div>
      );
    }
    if (ollamaModels.length > 0) {
      return (
        <Select value={value || (allowNone ? "__none__" : "")} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder={t("selectLabel", { label })} />
          </SelectTrigger>
          <SelectContent>
            {allowNone && (
              <SelectItem value="__none__">
                <span className="text-muted-foreground">{tAi("notConfigured")}</span>
              </SelectItem>
            )}
            {ollamaModels.map((m) => (
              <SelectItem key={m.name} value={m.name}>
                <div className="flex items-center gap-2">
                  <span>{m.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {m.details.parameter_size}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatSize(m.size)}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <p className="text-sm text-muted-foreground p-3 border rounded-lg">
        {t("noModelsFound")}
      </p>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          {t("aiSettings")}
        </CardTitle>
        <CardDescription>
          {t("aiSettingsDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-2">
          <Label>{t("aiProvider")}</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProvider("ollama")}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                provider === "ollama"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/30"
              }`}
            >
              <Server className={`h-6 w-6 ${provider === "ollama" ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-left">
                <p className="font-medium">{t("ollamaLocal")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("ollamaLocalDesc")}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setProvider("claude");
                setTextModel("claude-sonnet-4-5-20250929");
                setAnalysisModel("claude-sonnet-4-5-20250929");
              }}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                provider === "claude"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/30"
              }`}
            >
              <Cloud className={`h-6 w-6 ${provider === "claude" ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-left">
                <p className="font-medium">{t("claudeApi")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("claudeApiDesc")}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Ollama Settings */}
        {provider === "ollama" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="ollamaUrl">{t("ollamaUrl")}</Label>
              <div className="flex gap-2">
                <Input
                  id="ollamaUrl"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => loadOllamaModels()}
                  disabled={modelsLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${modelsLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Text-Modell */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-blue-500" />
                <Label>{t("textModel")}</Label>
                <Badge variant="outline" className="text-[10px]">{t("textModelDesc")}</Badge>
              </div>
              {renderModelSelect(textModel, setTextModel, t("textModel"))}
            </div>

            {/* Bild-Modell */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-purple-500" />
                <Label>{t("visionModel")}</Label>
                <Badge variant="outline" className="text-[10px]">{t("visionModelDesc")}</Badge>
              </div>
              {renderModelSelect(imageModel, setImageModel, t("visionModel"), true)}
            </div>

            {/* Analyse-Modell */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-500" />
                <Label>{t("analysisModel")}</Label>
                <Badge variant="outline" className="text-[10px]">{t("analysisModelDesc")}</Badge>
              </div>
              {renderModelSelect(analysisModel, setAnalysisModel, t("analysisModel"))}
            </div>

            {/* Image Generation Settings */}
            <div className="space-y-3">
              <Label>{t("imageGenSettings")}</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setImageGenProvider("sd-webui");
                    if (!imageGenUrl) setImageGenUrl("http://192.168.178.195:7860");
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                    imageGenProvider === "sd-webui"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium text-sm">{t("sdWebui")}</p>
                    <p className="text-xs text-muted-foreground">{t("sdWebuiDesc")}</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImageGenProvider("comfyui");
                    if (!imageGenUrl || imageGenUrl.includes(":7860")) setImageGenUrl("http://192.168.178.195:8188");
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                    imageGenProvider === "comfyui"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium text-sm">{t("comfyui")}</p>
                    <p className="text-xs text-muted-foreground">{t("comfyuiDesc")}</p>
                  </div>
                </button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageGenUrl">{t("imageGenUrl")}</Label>
                <Input
                  id="imageGenUrl"
                  value={imageGenUrl}
                  onChange={(e) => setImageGenUrl(e.target.value)}
                  placeholder={imageGenProvider === "comfyui" ? "http://192.168.178.195:8188" : "http://192.168.178.195:7860"}
                />
                <p className="text-xs text-muted-foreground">
                  {imageGenProvider === "comfyui" ? t("comfyuiUrlHint") : t("sdWebuiUrlHint")}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Claude Settings */}
        {provider === "claude" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-blue-500" />
                <Label>{t("textAnalysisModel")}</Label>
              </div>
              <Select value={textModel} onValueChange={(v) => { setTextModel(v); setAnalysisModel(v); }}>
                <SelectTrigger>
                  <SelectValue placeholder={t("claudeModelSelect")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-sonnet-4-5-20250929">
                    {t("claudeSonnet")}
                  </SelectItem>
                  <SelectItem value="claude-haiku-3-5-20241022">
                    {t("claudeHaiku")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("claudeApiKeyHint")}
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isPending} className="gap-2">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {tCommon("loading")}
              </>
            ) : (
              t("saveSettings")
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
  );
}
