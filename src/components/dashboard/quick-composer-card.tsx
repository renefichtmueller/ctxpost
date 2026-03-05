"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PenSquare, Sparkles, Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHAR_LIMIT = 280; // Twitter/X limit — most restrictive

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: "#1877F2",
  INSTAGRAM: "#E4405F",
  THREADS: "#a855f7",
  TWITTER: "#1da1f2",
  LINKEDIN: "#0A66C2",
};

interface ConnectedAccount {
  id: string;
  platform: string;
  accountName: string;
}

interface QuickComposerCardProps {
  connectedAccounts: ConnectedAccount[];
}

export function QuickComposerCard({ connectedAccounts }: QuickComposerCardProps) {
  const [content, setContent] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > CHAR_LIMIT;
  const isEmpty = content.trim().length === 0;
  const charPct = Math.min(charCount / CHAR_LIMIT, 1);

  // SVG circle progress
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * (1 - charPct);

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

        {/* Platform dots */}
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
      <div className="p-4">
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
        />
      </div>

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
          disabled={isEmpty}
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

        {/* Open full composer */}
        <Button
          type="button"
          onClick={handleOpenComposer}
          size="sm"
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
