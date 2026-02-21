"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  Copy,
  CheckCircle2,
} from "lucide-react";

interface VariationItem {
  variant: string;
  label: string;
  content: string;
  hashtags: string;
  approach: string;
}

interface VariationPanelProps {
  variations: VariationItem[] | null;
  isLoading: boolean;
  onSelect: (content: string) => void;
  onClose: () => void;
}

const VARIANT_COLORS: Record<string, string> = {
  A: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  B: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  C: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export function VariationPanel({
  variations,
  isLoading,
  onSelect,
  onClose,
}: VariationPanelProps) {
  const t = useTranslations("variations");
  const tCommon = useTranslations("common");
  const tAi = useTranslations("ai");

  const [activeTab, setActiveTab] = useState("A");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          {t("title")}
        </h4>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          {tCommon("close")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("generatingVariations")}
        </div>
      ) : variations && variations.length > 0 ? (
        <>
          {/* Tab Navigation */}
          <div className="flex gap-1 border-b pb-2">
            {variations.map((v, idx) => (
              <button
                key={v.variant}
                type="button"
                onClick={() => setActiveTab(v.variant)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors ${
                  activeTab === v.variant
                    ? "bg-background border border-b-0 border-border -mb-[1px]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1.5 ${VARIANT_COLORS[v.variant] || ""}`}
                  >
                    {v.variant}
                  </Badge>
                  {v.label}
                </span>
              </button>
            ))}
          </div>

          {/* Active Variation */}
          {variations.map((v, idx) => {
            if (v.variant !== activeTab) return null;

            return (
              <div key={v.variant} className="space-y-3">
                <p className="text-xs text-muted-foreground italic">
                  {v.approach}
                </p>
                <div className="bg-background rounded-md p-3 text-sm whitespace-pre-wrap border">
                  {v.content}
                </div>
                {v.hashtags && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">{tAi("hashtags")}: </span>
                    {v.hashtags}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const fullContent = v.hashtags
                        ? `${v.content}\n\n${v.hashtags}`
                        : v.content;
                      onSelect(fullContent);
                    }}
                    className="gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("acceptVariant", { variant: v.variant })}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(v.content, idx)}
                    className="gap-1.5"
                  >
                    {copiedIdx === idx ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copiedIdx === idx ? tCommon("copied") : tCommon("copy")}
                  </Button>
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <p className="text-sm text-muted-foreground py-2">
          {t("noVariations")}
        </p>
      )}
    </div>
  );
}
