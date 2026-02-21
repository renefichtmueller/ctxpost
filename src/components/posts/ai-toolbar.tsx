"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Hash,
  Copy,
  Loader2,
  Wand2,
  SmilePlus,
} from "lucide-react";
import { HashtagPanel } from "./hashtag-panel";
import { VariationPanel } from "./variation-panel";

interface AIToolbarProps {
  content: string;
  platforms: string[];
  onContentChange: (content: string) => void;
  onInsertHashtags: (hashtags: string) => void;
}

type ActivePanel = "none" | "hashtags" | "variations" | "suggestions";

interface HashtagData {
  hashtags: {
    primary: string[];
    secondary: string[];
    trending: string[];
    niche: string[];
  };
  platformSpecific: Record<string, string[]>;
  reasoning: string;
}

interface VariationData {
  variant: string;
  label: string;
  content: string;
  hashtags: string;
  approach: string;
}

// Helper: SSE fetch and parse
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

    const lines = messages.flatMap(m => m.split("\n").filter(l => l.trim()));

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
        if (e instanceof Error) {
          // Skip malformed JSON
          if (e instanceof SyntaxError) continue;
          throw e;
        }
        throw e;
      }
    }
  }

  throw new Error("No response received");
}

export function AIToolbar({
  content,
  platforms,
  onContentChange,
  onInsertHashtags,
}: AIToolbarProps) {
  const t = useTranslations("ai");
  const tCommon = useTranslations("common");
  const tPosts = useTranslations("posts");
  const tHash = useTranslations("hashtags");
  const tVar = useTranslations("variations");

  const [activePanel, setActivePanel] = useState<ActivePanel>("none");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [hashtagData, setHashtagData] = useState<HashtagData | null>(null);
  const [variationData, setVariationData] = useState<VariationData[] | null>(null);
  const [suggestionText, setSuggestionText] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<{score: number; label: string; emotions: string[]; suggestion: string} | null>(null);
  const [isSentimentLoading, setIsSentimentLoading] = useState(false);

  const hasContent = content.trim().length > 10;

  // Fallback auf Standard-Plattformen wenn keine gewählt
  const effectivePlatforms = platforms.length > 0 ? platforms : ["FACEBOOK", "LINKEDIN"];

  const handleGenerateHashtags = async () => {
    if (!hasContent) return;
    setError(null);
    setIsLoading(true);
    setLoadingAction("hashtags");
    setActivePanel("hashtags");

    try {
      const result = await fetchSSE<HashtagData>(
        "/api/ai/hashtags",
        { content, platforms: effectivePlatforms },
        () => {}
      );
      setHashtagData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : tHash("generationError"));
      setActivePanel("none");
    } finally {
      setIsLoading(false);
      setLoadingAction("");
    }
  };

  const handleGenerateVariations = async () => {
    if (!hasContent) return;
    setError(null);
    setIsLoading(true);
    setLoadingAction("variations");
    setActivePanel("variations");

    try {
      const result = await fetchSSE<{ variations: VariationData[] }>(
        "/api/ai/variations",
        { content, platforms: effectivePlatforms },
        () => {}
      );
      setVariationData(result.variations);
    } catch (err) {
      setError(err instanceof Error ? err.message : tVar("generationError"));
      setActivePanel("none");
    } finally {
      setIsLoading(false);
      setLoadingAction("");
    }
  };

  const handleGetSuggestion = async () => {
    if (!hasContent) return;
    setError(null);
    setIsLoading(true);
    setLoadingAction("suggestions");
    setActivePanel("suggestions");

    try {
      const result = await fetchSSE<{
        suggestions: Array<{
          platform: string;
          improvedContent: string;
          reasoning: string;
          tips: string[];
        }>;
      }>(
        "/api/ai/content-suggestions",
        { content, platforms: effectivePlatforms },
        () => {}
      );

      if (result.suggestions?.length > 0) {
        setSuggestionText(result.suggestions[0].improvedContent);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("optimizationError"));
      setActivePanel("none");
    } finally {
      setIsLoading(false);
      setLoadingAction("");
    }
  };

  const closePanel = () => {
    setActivePanel("none");
    setError(null);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetSuggestion}
          disabled={!hasContent || isLoading}
          className="gap-1.5 text-xs"
        >
          {isLoading && loadingAction === "suggestions" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wand2 className="h-3.5 w-3.5" />
          )}
          {t("optimize")}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerateHashtags}
          disabled={!hasContent || isLoading}
          className="gap-1.5 text-xs"
        >
          {isLoading && loadingAction === "hashtags" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Hash className="h-3.5 w-3.5" />
          )}
          {t("hashtags")}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerateVariations}
          disabled={!hasContent || isLoading}
          className="gap-1.5 text-xs"
        >
          {isLoading && loadingAction === "variations" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {t("variations")}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!content.trim() || isSentimentLoading}
          onClick={async () => {
            setIsSentimentLoading(true);
            try {
              const res = await fetch("/api/ai/sentiment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: content }),
              });
              if (res.ok) {
                const data = await res.json();
                setSentiment(data.sentiment);
              }
            } catch {} finally {
              setIsSentimentLoading(false);
            }
          }}
          className="gap-1.5 text-xs"
        >
          {isSentimentLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SmilePlus className="h-3.5 w-3.5" />}
          {t("sentiment")}
        </Button>

        {!hasContent && (
          <span className="text-xs text-muted-foreground self-center ml-1">
            {tPosts("minCharsForAI")}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Sentiment Result */}
      {sentiment && (
        <div className="mt-2 p-3 bg-muted/50 rounded-lg text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{t("sentimentResult")}:</span>
            <Badge variant={sentiment.label === "positive" ? "default" : sentiment.label === "negative" ? "destructive" : "secondary"}>
              {sentiment.label} ({(sentiment.score * 100).toFixed(0)}%)
            </Badge>
          </div>
          {sentiment.emotions?.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {sentiment.emotions.map((e: string, i: number) => (
                <Badge key={i} variant="outline" className="text-[10px]">{e}</Badge>
              ))}
            </div>
          )}
          {sentiment.suggestion && (
            <p className="text-muted-foreground">{sentiment.suggestion}</p>
          )}
        </div>
      )}

      {/* Suggestion Panel */}
      {activePanel === "suggestions" && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-1.5">
              <Wand2 className="h-4 w-4 text-primary" />
              {t("optimizedContent")}
            </h4>
            <Button type="button" variant="ghost" size="sm" onClick={closePanel}>
              {tCommon("close")}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("generatingOptimized")}
            </div>
          ) : suggestionText ? (
            <div className="space-y-3">
              <div className="bg-background rounded-md p-3 text-sm whitespace-pre-wrap border">
                {suggestionText}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onContentChange(suggestionText);
                    closePanel();
                  }}
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("accept")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(suggestionText);
                  }}
                  className="gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {tCommon("copy")}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Hashtag Panel */}
      {activePanel === "hashtags" && (
        <HashtagPanel
          data={hashtagData}
          isLoading={isLoading}
          onInsert={onInsertHashtags}
          onClose={closePanel}
        />
      )}

      {/* Variation Panel */}
      {activePanel === "variations" && (
        <VariationPanel
          variations={variationData}
          isLoading={isLoading}
          onSelect={(content) => {
            onContentChange(content);
            closePanel();
          }}
          onClose={closePanel}
        />
      )}
    </div>
  );
}
