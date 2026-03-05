"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PenSquare, Sparkles, Send, Smile, Zap, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHAR_LIMIT = 280; // Twitter/X limit — most restrictive

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: "#1877F2",
  INSTAGRAM: "#E4405F",
  THREADS: "#a855f7",
  TWITTER: "#1da1f2",
  LINKEDIN: "#0A66C2",
};

const PLATFORM_SHORT: Record<string, string> = {
  FACEBOOK: "FB",
  INSTAGRAM: "IG",
  THREADS: "TH",
  TWITTER: "X",
  LINKEDIN: "LI",
};

interface ConnectedAccount {
  id: string;
  platform: string;
  accountName: string;
}

interface QuickComposerCardProps {
  connectedAccounts: ConnectedAccount[];
}

type PublishResult = {
  platform: string;
  accountName: string;
  status: string;
  error: string | null;
};

type PublishState = "idle" | "publishing" | "done" | "error";

export function QuickComposerCard({ connectedAccounts }: QuickComposerCardProps) {
  const [content, setContent] = useState("");
  const [focused, setFocused] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [publishState, setPublishState] = useState<PublishState>("idle");
  const [publishResults, setPublishResults] = useState<PublishResult[]>([]);
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > CHAR_LIMIT;
  const isEmpty = content.trim().length === 0;
  const charPct = Math.min(charCount / CHAR_LIMIT, 1);
  const canPublishNow = !isEmpty && !isOverLimit && selectedIds.size > 0;

  // SVG circle progress
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * (1 - charPct);

  const toggleAccount = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(connectedAccounts.map((a) => a.id)));
  };

  const handleOpenComposer = () => {
    if (isEmpty) {
      router.push("/posts/new");
    } else {
      router.push(`/posts/new?content=${encodeURIComponent(content)}`);
    }
  };

  const handleAIEnrich = () => {
    router.push(`/ideas?topic=${encodeURIComponent(content)}`);
  };

  const handlePublishNow = async () => {
    if (!canPublishNow) return;
    setPublishState("publishing");
    setPublishResults([]);

    try {
      const res = await fetch("/api/posts/publish-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          accountIds: Array.from(selectedIds),
        }),
      });

      const data = await res.json();

      if (data.results && data.results.length > 0) {
        setPublishResults(data.results);
      }

      if (data.success) {
        setPublishState("done");
        setContent("");
        setSelectedIds(new Set());
        // Refresh dashboard data
        setTimeout(() => {
          setPublishState("idle");
          setPublishResults([]);
          router.refresh();
        }, 3500);
      } else {
        setPublishState("error");
        setTimeout(() => setPublishState("idle"), 5000);
      }
    } catch {
      setPublishState("error");
      setTimeout(() => setPublishState("idle"), 5000);
    }
  };

  const uniquePlatforms = [...new Set(connectedAccounts.map((a) => a.platform))];

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: "#0d1424",
        border: focused
          ? "1px solid rgba(168,85,247,0.4)"
          : "1px solid rgba(168,85,247,0.15)",
        boxShadow: focused ? "0 0 32px rgba(168,85,247,0.1)" : "none",
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(168,85,247,0.08)" }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 0 12px rgba(168,85,247,0.3)" }}
        >
          <PenSquare className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Schnell posten</p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            {uniquePlatforms.length > 0
              ? `${uniquePlatforms.length} Plattform${uniquePlatforms.length > 1 ? "en" : ""} verbunden`
              : "Keine Accounts verbunden — Accounts verknüpfen"}
          </p>
        </div>

        {/* Platform dots (decorative) */}
        <div className="flex items-center gap-1.5">
          {uniquePlatforms.slice(0, 5).map((platform) => (
            <div
              key={platform}
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: (PLATFORM_COLORS[platform] || "#6b7280") + "25",
                border: `1px solid ${PLATFORM_COLORS[platform] || "#6b7280"}50`,
              }}
              title={platform}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: PLATFORM_COLORS[platform] || "#6b7280" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="p-4 pb-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Was möchtest du teilen? Tippe hier oder klicke auf den Composer für alle Optionen..."
          rows={3}
          className="w-full bg-transparent text-white placeholder:text-slate-600 text-sm resize-none outline-none leading-relaxed"
          style={{ minHeight: "72px" }}
          disabled={publishState === "publishing"}
        />
      </div>

      {/* Account selector (only shown when content is typed) */}
      {connectedAccounts.length > 0 && !isEmpty && publishState === "idle" && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-medium uppercase tracking-widest shrink-0" style={{ color: "#6b7280" }}>
              Posten auf:
            </span>
            {connectedAccounts.map((account) => {
              const isSelected = selectedIds.has(account.id);
              const color = PLATFORM_COLORS[account.platform] || "#6b7280";
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => toggleAccount(account.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150"
                  style={{
                    background: isSelected ? color + "20" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isSelected ? color + "60" : "rgba(255,255,255,0.08)"}`,
                    color: isSelected ? color : "#6b7280",
                    transform: isSelected ? "scale(1.03)" : "scale(1)",
                  }}
                  title={account.accountName}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: isSelected ? color : "#4b5563" }}
                  />
                  {PLATFORM_SHORT[account.platform] ?? account.platform.substring(0, 2)}
                  <span className="max-w-[80px] truncate">{account.accountName}</span>
                </button>
              );
            })}
            {connectedAccounts.length > 1 && (
              <button
                type="button"
                onClick={selectAll}
                className="text-[10px] px-2 py-1 rounded-full transition-colors"
                style={{
                  background: "rgba(168,85,247,0.06)",
                  border: "1px solid rgba(168,85,247,0.15)",
                  color: "#a855f7",
                }}
              >
                Alle
              </button>
            )}
          </div>
        </div>
      )}

      {/* Publish result feedback */}
      {publishState !== "idle" && publishResults.length > 0 && (
        <div className="px-4 pb-3 space-y-1">
          {publishResults.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs"
              style={{ color: r.status === "PUBLISHED" ? "#34d399" : "#f87171" }}
            >
              {r.status === "PUBLISHED" ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="font-medium">{r.accountName}</span>
              {r.error && <span className="opacity-70 truncate">{r.error}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Done state */}
      {publishState === "done" && publishResults.length === 0 && (
        <div className="px-4 pb-3 flex items-center gap-2 text-sm" style={{ color: "#34d399" }}>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Erfolgreich veröffentlicht!
        </div>
      )}

      {/* Bottom bar */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        {/* Char counter circle */}
        <div className="relative w-7 h-7 shrink-0" title={`${charCount} / ${CHAR_LIMIT} Zeichen`}>
          <svg className="w-7 h-7 -rotate-90" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
            <circle
              cx="12" cy="12" r={radius}
              fill="none"
              stroke={isOverLimit ? "#f87171" : charPct > 0.8 ? "#fbbf24" : "#a855f7"}
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDash}
              strokeLinecap="round"
              className="transition-all duration-200"
            />
          </svg>
          {charCount > 0 && (
            <span
              className="absolute inset-0 flex items-center justify-center text-[8px] font-bold"
              style={{ color: isOverLimit ? "#f87171" : "#94a3b8" }}
            >
              {CHAR_LIMIT - charCount < 0 ? charCount - CHAR_LIMIT : CHAR_LIMIT - charCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0" style={{ color: "#4b5563" }}>
          <button
            type="button"
            className="p-1.5 rounded-lg hover:text-slate-300 transition-colors"
            title="Emoji"
          >
            <Smile className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1" />

        {/* AI Button */}
        <Button
          type="button"
          onClick={handleAIEnrich}
          size="sm"
          disabled={isEmpty || publishState === "publishing"}
          className="gap-1.5 text-xs"
          style={{
            background: isEmpty ? "rgba(168,85,247,0.05)" : "rgba(168,85,247,0.12)",
            border: "1px solid rgba(168,85,247,0.25)",
            color: isEmpty ? "#6b7280" : "#c084fc",
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          KI
        </Button>

        {/* Publish Now */}
        {!isEmpty && connectedAccounts.length > 0 && (
          <Button
            type="button"
            onClick={handlePublishNow}
            size="sm"
            disabled={!canPublishNow || publishState === "publishing" || publishState === "done"}
            className="gap-1.5 text-xs font-semibold"
            style={{
              background: canPublishNow && publishState === "idle"
                ? "linear-gradient(135deg, #059669, #34d399)"
                : "rgba(52,211,153,0.08)",
              border: canPublishNow && publishState === "idle" ? "none" : "1px solid rgba(52,211,153,0.2)",
              color: canPublishNow && publishState === "idle" ? "white" : "#34d399",
              boxShadow: canPublishNow && publishState === "idle" ? "0 0 16px rgba(52,211,153,0.25)" : "none",
            }}
          >
            {publishState === "publishing" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Wird gepostet…
              </>
            ) : publishState === "done" ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Gepostet!
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                Jetzt posten
                {selectedIds.size > 0 && (
                  <span
                    className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                    style={{ background: "rgba(255,255,255,0.25)" }}
                  >
                    {selectedIds.size}
                  </span>
                )}
              </>
            )}
          </Button>
        )}

        {/* Open full composer */}
        <Button
          type="button"
          onClick={handleOpenComposer}
          size="sm"
          disabled={publishState === "publishing"}
          className="gap-1.5 text-xs font-semibold"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            border: "none",
            color: "white",
            boxShadow: "0 0 16px rgba(168,85,247,0.25)",
          }}
        >
          <Send className="h-3.5 w-3.5" />
          {isEmpty ? "Composer öffnen" : "Weiterschreiben"}
        </Button>
      </div>
    </div>
  );
}
