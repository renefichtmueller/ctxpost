"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Hash,
  Loader2,
  Plus,
  CheckCircle2,
  Copy,
} from "lucide-react";

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

interface HashtagPanelProps {
  data: HashtagData | null;
  isLoading: boolean;
  onInsert: (hashtags: string) => void;
  onClose: () => void;
}

const CATEGORY_LABEL_KEYS: Record<string, { key: string; color: string }> = {
  primary: { key: "primary", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  secondary: { key: "secondary", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  trending: { key: "trending", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  niche: { key: "niche", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
};

export function HashtagPanel({ data, isLoading, onInsert, onClose }: HashtagPanelProps) {
  const t = useTranslations("hashtags");
  const tCommon = useTranslations("common");

  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [copiedAll, setCopiedAll] = useState(false);

  const toggleTag = (tag: string) => {
    const next = new Set(selectedTags);
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }
    setSelectedTags(next);
  };

  const insertSelected = () => {
    if (selectedTags.size === 0) return;
    const hashtagStr = Array.from(selectedTags).join(" ");
    onInsert(hashtagStr);
    setSelectedTags(new Set());
  };

  const insertAll = () => {
    if (!data) return;
    const allTags = [
      ...data.hashtags.primary,
      ...data.hashtags.secondary,
      ...data.hashtags.trending,
      ...data.hashtags.niche,
    ];
    onInsert(allTags.join(" "));
  };

  const copyAllToClipboard = () => {
    if (!data) return;
    const allTags = [
      ...data.hashtags.primary,
      ...data.hashtags.secondary,
      ...data.hashtags.trending,
      ...data.hashtags.niche,
    ];
    navigator.clipboard.writeText(allTags.join(" "));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Hash className="h-4 w-4 text-primary" />
          {t("title")}
        </h4>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          {tCommon("close")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("generatingHashtags")}
        </div>
      ) : data ? (
        <>
          {/* Hashtag Categories */}
          {(["primary", "secondary", "trending", "niche"] as const).map((category) => {
            const tags = data.hashtags[category];
            if (!tags || tags.length === 0) return null;
            const info = CATEGORY_LABEL_KEYS[category];

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={`text-xs ${info.color}`}>
                    {t(info.key)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{t("tagCount", { count: tags.length })}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer ${
                        selectedTags.has(tag)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-border"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Platform Specific */}
          {data.platformSpecific && Object.keys(data.platformSpecific).length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <span className="text-xs font-medium text-muted-foreground">{t("platformSpecific")}</span>
              {Object.entries(data.platformSpecific).map(([platform, tags]) => (
                <div key={platform} className="space-y-1">
                  <span className="text-xs text-muted-foreground">{platform}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <button
                        key={`${platform}-${tag}`}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer ${
                          selectedTags.has(tag)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-border"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reasoning */}
          {data.reasoning && (
            <p className="text-xs text-muted-foreground italic pt-2 border-t">
              {data.reasoning}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {selectedTags.size > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={insertSelected}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("insertSelected", { count: selectedTags.size })}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={insertAll}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("insertAll")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyAllToClipboard}
              className="gap-1.5"
            >
              {copiedAll ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copiedAll ? tCommon("copied") : t("copyAll")}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
