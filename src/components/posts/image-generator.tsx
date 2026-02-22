"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageIcon, Loader2, Sparkles, X, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

interface ImageGeneratorProps {
  imageDescription: string;
  onImageDescriptionChange: (desc: string) => void;
  imageUrl: string | null;
  onImageUrlChange: (url: string | null) => void;
  content: string;
  platforms?: string[];
}

const IMAGE_SIZES = [
  { value: "512x512", w: 512, h: 512, platform: null, fast: true },
  { value: "768x768", w: 768, h: 768, platform: null, fast: true },
  { value: "1024x1024", w: 1024, h: 1024, platform: null, fast: false },
  { value: "1200x630", w: 1200, h: 630, platform: "FACEBOOK", fast: false },
  { value: "1200x627", w: 1200, h: 627, platform: "LINKEDIN", fast: false },
  { value: "1600x900", w: 1600, h: 900, platform: "TWITTER", fast: false },
  { value: "1080x1080", w: 1080, h: 1080, platform: "INSTAGRAM", fast: false },
  { value: "1080x1920", w: 1080, h: 1920, platform: null, fast: false },
];

const IMAGE_SIZE_KEYS: Record<string, string> = {
  "512x512": "small",
  "768x768": "medium",
  "1024x1024": "square",
  "1200x630": "facebookOptimal",
  "1200x627": "linkedinOptimal",
  "1600x900": "twitterOptimal",
  "1080x1080": "instagramOptimal",
  "1080x1920": "storyReels",
};

const PLATFORM_IMAGE_INFO: Record<string, { ratio: string }> = {
  FACEBOOK: { ratio: "1200×630 (1.91:1)" },
  LINKEDIN: { ratio: "1200×627 (1.91:1)" },
  TWITTER: { ratio: "1600×900 (16:9)" },
  INSTAGRAM: { ratio: "1080×1080 (1:1)" },
  THREADS: { ratio: "1080×1080 (1:1)" },
};

const PLATFORM_TIP_KEYS: Record<string, string> = {
  FACEBOOK: "facebookTip",
  LINKEDIN: "linkedinTip",
  TWITTER: "twitterTip",
  INSTAGRAM: "instagramTip",
  THREADS: "threadsTip",
};

export function ImageGenerator({
  imageDescription,
  onImageDescriptionChange,
  imageUrl,
  onImageUrlChange,
  content,
  platforms = [],
}: ImageGeneratorProps) {
  const t = useTranslations("image");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  // Auto-select optimal size based on first selected platform, default to fast 512x512
  const defaultSize = (() => {
    for (const p of platforms) {
      const match = IMAGE_SIZES.find((s) => s.platform === p);
      if (match) return match.value;
    }
    return "512x512";
  })();
  const [selectedSize, setSelectedSize] = useState(defaultSize);

  const selectedSizeInfo = IMAGE_SIZES.find((s) => s.value === selectedSize);
  const isSlowSize = selectedSizeInfo && !selectedSizeInfo.fast;

  const handleAutoDescribe = () => {
    // Generate a simple image description from the post content
    const shortContent = content.slice(0, 200).trim();
    if (!shortContent) return;
    const desc = t("autoDescribeTemplate", { content: shortContent });
    onImageDescriptionChange(desc);
  };

  const handleGenerate = async () => {
    if (!imageDescription.trim()) return;

    setIsGenerating(true);
    setError(null);
    setProgress(t("generatingProgress"));

    const size = IMAGE_SIZES.find((s) => s.value === selectedSize) || IMAGE_SIZES[0];

    try {
      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imageDescription,
          negativePrompt: "blurry, low quality, distorted, watermark, text overlay",
          width: size.w,
          height: size.h,
        }),
      });

      if (!response.ok) {
        const ct = response.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const err = await response.json();
          throw new Error(err.error || t("generationError"));
        }
        throw new Error(t("serverError", { status: response.status }));
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error(t("noStream"));

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split("\n\n");
        buffer = messages.pop() || "";

        for (const msg of messages) {
          const line = msg.trim();
          if (!line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "progress") {
              setProgress(data.status || t("generatingProgress"));
            } else if (data.type === "error") {
              throw new Error(data.error || t("generationFailed"));
            } else if (data.type === "result") {
              onImageUrlChange(data.data.imageUrl);
              setProgress(null);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
      setProgress(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveImage = () => {
    onImageUrlChange(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <ImageIcon className="h-4 w-4" style={{ color: "#a855f7" }} />
        <span className="font-semibold text-sm text-white">{t("title")}</span>
        <span className="text-xs" style={{ color: "#94a3b8" }}>— {t("description")}</span>
      </div>
      <div className="space-y-4">
        {/* Image Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="imageDescription">{t("promptLabel")}</Label>
            {content.trim().length > 10 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAutoDescribe}
                className="text-xs gap-1 h-7"
              >
                <Sparkles className="h-3 w-3" />
                {t("deriveFromText")}
              </Button>
            )}
          </div>
          <Textarea
            id="imageDescription"
            name="imageDescription"
            placeholder={t("promptPlaceholder")}
            value={imageDescription}
            onChange={(e) => onImageDescriptionChange(e.target.value)}
            rows={3}
            className="resize-none text-sm"
          />
        </div>

        {/* Size + Generate */}
        <div className="flex items-end gap-2">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs">{t("imageSize")}</Label>
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_SIZES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {t(IMAGE_SIZE_KEYS[s.value])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!imageDescription.trim() || isGenerating}
            className="gap-1.5"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("generating")}
              </>
            ) : imageUrl ? (
              <>
                <RefreshCw className="h-4 w-4" />
                {t("regenerate")}
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                {t("generate")}
              </>
            )}
          </Button>
        </div>

        {/* Platform-specific image format recommendations */}
        {platforms.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              {t("optimalFormats")}
            </p>
            <div className="grid gap-1.5">
              {platforms.map((p) => {
                const info = PLATFORM_IMAGE_INFO[p];
                if (!info) return null;
                const isSelected = IMAGE_SIZES.find((s) => s.value === selectedSize)?.platform === p;
                return (
                  <div
                    key={p}
                    className="flex items-center gap-2 text-xs"
                  >
                    <Badge
                      variant={isSelected ? "default" : "outline"}
                      className="text-[10px] cursor-pointer"
                      onClick={() => {
                        const match = IMAGE_SIZES.find((s) => s.platform === p);
                        if (match) setSelectedSize(match.value);
                      }}
                    >
                      {p === "TWITTER" ? "X" : p === "LINKEDIN" ? "LinkedIn" : p.charAt(0) + p.slice(1).toLowerCase()}
                    </Badge>
                    <span className="text-muted-foreground font-mono">{info.ratio}</span>
                    <span className="text-muted-foreground/70 hidden sm:inline">— {t(PLATFORM_TIP_KEYS[p])}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Speed hint for large resolutions */}
        {isSlowSize && !isGenerating && !imageUrl && (
          <div className="flex items-start gap-2 text-xs rounded-lg px-3 py-2"
            style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", color: "#ca8a04" }}>
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "#eab308" }} />
            <span>
              <span className="font-medium" style={{ color: "#eab308" }}>Hinweis:</span>{" "}
              Große Auflösungen dauern 1-5 Min. Für schnelle Vorschauen{" "}
              <button
                type="button"
                className="underline font-medium"
                style={{ color: "#a855f7" }}
                onClick={() => setSelectedSize("512x512")}
              >
                512×512
              </button>{" "}
              oder{" "}
              <button
                type="button"
                className="underline font-medium"
                style={{ color: "#a855f7" }}
                onClick={() => setSelectedSize("768x768")}
              >
                768×768
              </button>{" "}
              wählen (~10-30 Sek).
            </span>
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            {progress}
          </div>
        )}

        {/* Error — with helpful link for missing URL config */}
        {error && (
          <div className="text-sm px-3 py-2.5 rounded-xl space-y-1.5"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            <p>{error}</p>
            {(error.includes("No image generation URL") || error.includes("noImageGenUrl") || error.toLowerCase().includes("url configured")) && (
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                Bitte konfiguriere eine Stable Diffusion oder ComfyUI URL in den{" "}
                <a
                  href="/ai-models"
                  className="underline font-medium"
                  style={{ color: "#a855f7" }}
                >
                  AI Models Einstellungen → Bildgenerierung
                </a>
                . Standard-URL für SD WebUI: <code className="text-xs px-1 rounded" style={{ background: "rgba(255,255,255,0.08)" }}>http://192.168.178.195:7860</code>
              </p>
            )}
          </div>
        )}

        {/* Generated Image Preview */}
        {imageUrl && (
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={t("generatedImage")}
              className="w-full rounded-lg border object-contain"
              style={{ maxHeight: "400px", background: "rgba(0,0,0,0.3)" }}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
            <input type="hidden" name="imageUrl" value={imageUrl} />
          </div>
        )}
      </div>
    </div>
  );
}
