"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wand2,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";

interface TextGeneratorProps {
  onContentGenerated: (content: string) => void;
  platforms: string[];
}

type Tone = "professional" | "casual" | "humorous" | "inspirational" | "informative";

const TONE_VALUES: Tone[] = ["professional", "casual", "humorous", "inspirational", "informative"];

const TONE_LABEL_KEYS: Record<Tone, string> = {
  professional: "toneProfessional",
  casual: "toneCasual",
  humorous: "toneHumorous",
  inspirational: "toneInspirational",
  informative: "toneInformative",
};

interface TimeRecommendation {
  labelKey: string;
  descKey: string;
  tipKeys: string[];
  color: string;
  icon: string;
}

function getTimeRecommendation(hour: number): TimeRecommendation {
  if (hour >= 6 && hour < 11) {
    return {
      labelKey: "morningLabel",
      descKey: "morningDesc",
      tipKeys: ["morningTip1", "morningTip2", "morningTip3"],
      color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      icon: "🌅",
    };
  } else if (hour >= 11 && hour < 14) {
    return {
      labelKey: "middayLabel",
      descKey: "middayDesc",
      tipKeys: ["middayTip1", "middayTip2", "middayTip3"],
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      icon: "☀️",
    };
  } else if (hour >= 14 && hour < 18) {
    return {
      labelKey: "afternoonLabel",
      descKey: "afternoonDesc",
      tipKeys: ["afternoonTip1", "afternoonTip2", "afternoonTip3"],
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      icon: "🏙️",
    };
  } else if (hour >= 18 && hour < 22) {
    return {
      labelKey: "eveningLabel",
      descKey: "eveningDesc",
      tipKeys: ["eveningTip1", "eveningTip2", "eveningTip3"],
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      icon: "🌆",
    };
  } else {
    return {
      labelKey: "nightLabel",
      descKey: "nightDesc",
      tipKeys: ["nightTip1", "nightTip2", "nightTip3"],
      color: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
      icon: "🌙",
    };
  }
}

// SSE fetch helper matching project pattern
async function fetchSSE<T>(
  url: string,
  body: Record<string, unknown>,
  onProgress: () => void
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const errData = await response.json();
      throw new Error(errData.error || `Error ${response.status}`);
    }
    throw new Error(`Request failed (${response.status})`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const messages = buffer.split("\n\n");
    buffer = messages.pop() || "";

    const lines = messages.flatMap((m) =>
      m.split("\n").filter((l) => l.trim())
    );

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));

        if (data.type === "ping" || data.type === "progress") {
          onProgress();
        } else if (data.type === "error") {
          throw new Error(data.error);
        } else if (data.type === "result") {
          return data.data as T;
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }

  throw new Error("No response received");
}

export function TextGenerator({
  onContentGenerated,
  platforms,
}: TextGeneratorProps) {
  const t = useTranslations("textGen");
  const tCommon = useTranslations("common");
  const tAi = useTranslations("ai");

  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const timeRecommendation = useMemo(() => {
    const hour = new Date().getHours();
    return getTimeRecommendation(hour);
  }, []);

  const effectivePlatforms =
    platforms.length > 0 ? platforms : ["FACEBOOK", "LINKEDIN"];

  const handleGenerate = async () => {
    if (!keywords.trim()) return;

    setError(null);
    setIsLoading(true);
    setGeneratedContent(null);
    setSuggestions([]);

    try {
      const result = await fetchSSE<{
        content: string;
        suggestions: string[];
      }>(
        "/api/ai/generate-text",
        {
          keywords: keywords.trim(),
          tone,
          platforms: effectivePlatforms,
        },
        () => {}
      );

      setGeneratedContent(result.content);
      setSuggestions(result.suggestions || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("generationError")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="gap-4">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wand2 className="h-5 w-5 text-primary" />
          {t("title")}
        </CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Time-of-day recommendation */}
        <div
          className={`rounded-lg border p-3 space-y-2 ${timeRecommendation.color}`}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              {timeRecommendation.icon} {t(timeRecommendation.labelKey)}
            </span>
            <Badge variant="secondary" className="text-xs ml-auto">
              {t("recommendation")}
            </Badge>
          </div>
          <p className="text-sm font-medium">{t(timeRecommendation.descKey)}</p>
          <ul className="text-xs space-y-0.5 list-disc list-inside opacity-80">
            {timeRecommendation.tipKeys.map((key, idx) => (
              <li key={idx}>{t(key)}</li>
            ))}
          </ul>
        </div>

        {/* Keywords / Topic Input */}
        <div className="space-y-2">
          <Label htmlFor="keywords">{t("keywordsLabel")}</Label>
          <Textarea
            id="keywords"
            placeholder={t("keywordsPlaceholder")}
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Tone Selection */}
        <div className="space-y-2">
          <Label htmlFor="tone">{t("toneLabel")}</Label>
          <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("tonePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {TONE_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(TONE_LABEL_KEYS[value])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Platforms info */}
        {effectivePlatforms.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">{t("targetPlatforms")}</span>
            {effectivePlatforms.map((p) => (
              <Badge key={p} variant="outline" className="text-xs">
                {p}
              </Badge>
            ))}
          </div>
        )}

        {/* Generate Button */}
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={!keywords.trim() || isLoading}
          className="w-full gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isLoading ? t("generatingText") : t("generateText")}
        </Button>

        {/* Error */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {/* Generated Text Preview */}
        {generatedContent && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-medium">{t("generatedText")}</h4>
            </div>

            <div className="bg-background rounded-md p-3 text-sm whitespace-pre-wrap border">
              {generatedContent}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("moreIdeas")}
                </span>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  {suggestions.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => onContentGenerated(generatedContent)}
                className="gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {tAi("accept")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(generatedContent);
                }}
                className="gap-1.5"
              >
                {tCommon("copy")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
