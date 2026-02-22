"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { createPost, updatePost } from "@/actions/posts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLATFORMS } from "@/lib/constants";
import type { Platform } from "@prisma/client";
import {
  AlertCircle,
  Send,
  Sparkles,
  Loader2,
  Clock,
  Image as ImageIcon,
  Upload,
  ChevronDown,
  ChevronUp,
  Wand2,
  MessageSquare,
  Calendar,
  Zap,
  Hash,
} from "lucide-react";
import Link from "next/link";
import { AIToolbar } from "./ai-toolbar";
import { ImageGenerator } from "./image-generator";
import { PostPreview } from "./post-preview";
import { MediaUpload } from "./media-upload";
import { TextGenerator } from "./text-generator";
import { AISuggestions } from "./ai-suggestions";

interface PostFormProps {
  socialAccounts: Array<{
    id: string;
    platform: string;
    accountName: string;
    accountType?: string;
  }>;
  categories?: Array<{
    id: string;
    name: string;
    color: string;
    icon?: string | null;
  }>;
  initialContent?: string;
  post?: {
    id: string;
    content: string;
    imageUrl?: string | null;
    imageDescription?: string | null;
    mediaUrls?: string[];
    scheduledAt: Date | null;
    status: string;
    targets: Array<{ socialAccountId: string }>;
    categoryId?: string | null;
    isEvergreen?: boolean;
    firstComment?: string | null;
  };
}

const PLATFORM_LIMITS: Record<string, { name: string; limit: number }> = {
  FACEBOOK: { name: "Facebook", limit: 63206 },
  LINKEDIN: { name: "LinkedIn", limit: 3000 },
  INSTAGRAM: { name: "Instagram", limit: 2200 },
  TWITTER: { name: "X/Twitter", limit: 280 },
};

export function PostForm({ socialAccounts, categories, initialContent, post }: PostFormProps) {
  const t = useTranslations("posts");
  const tCommon = useTranslations("common");

  const [content, setContent] = useState(post?.content || initialContent || "");
  const [imageUrl, setImageUrl] = useState<string | null>(post?.imageUrl || null);
  const [imageDescription, setImageDescription] = useState(post?.imageDescription || "");
  const [mediaUrls, setMediaUrls] = useState<string[]>(post?.mediaUrls || []);
  const [scheduleMode, setScheduleMode] = useState<"custom" | "bestTime">("custom");
  const [suggestedTime, setSuggestedTime] = useState<string | null>(null);
  const [suggestedReason, setSuggestedReason] = useState<string | null>(null);
  const [isFetchingBestTime, setIsFetchingBestTime] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(
    new Set(post?.targets.map((t) => t.socialAccountId) || [])
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(post?.categoryId || "");
  const [isEvergreen, setIsEvergreen] = useState(post?.isEvergreen || false);
  const [firstComment, setFirstComment] = useState(post?.firstComment || "");

  // Collapsible sections
  const [showAiTools, setShowAiTools] = useState(false);
  const [showImageGen, setShowImageGen] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showFirstComment, setShowFirstComment] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(!post);

  const maxLength = 5000;
  const isEditing = !!post;

  const selectedPlatforms = useMemo(() => {
    return socialAccounts
      .filter((a) => selectedAccounts.has(a.id))
      .map((a) => a.platform);
  }, [socialAccounts, selectedAccounts]);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    let result;
    if (isEditing) {
      result = await updatePost(post.id, formData);
    } else {
      result = await createPost(formData);
    }
    if (result?.error) {
      setError(result.error);
    }
  };

  const toggleAccount = (accountId: string) => {
    const next = new Set(selectedAccounts);
    if (next.has(accountId)) {
      next.delete(accountId);
    } else {
      next.add(accountId);
    }
    setSelectedAccounts(next);
  };

  const handleInsertHashtags = (hashtags: string) => {
    const separator = content.endsWith("\n") || content === "" ? "" : "\n\n";
    setContent((prev) => prev + separator + hashtags);
  };

  if (socialAccounts.length === 0) {
    return (
      <div
        className="rounded-2xl p-10 text-center"
        style={{ background: "#0d1424", border: "1px solid rgba(168,85,247,0.2)" }}
      >
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-40 text-white" />
        <h3 className="text-lg font-semibold text-white mb-2">{t("noAccountsTitle")}</h3>
        <p style={{ color: "#94a3b8" }}>{t("noAccountsDesc")}</p>
        <Link href="/accounts">
          <Button
            className="mt-4"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none" }}
          >
            {t("connectAccounts")}
          </Button>
        </Link>
      </div>
    );
  }

  const defaultScheduledAt = post?.scheduledAt
    ? new Date(post.scheduledAt).toISOString().slice(0, 16)
    : "";

  const platformWarnings = selectedPlatforms
    .filter((p) => PLATFORM_LIMITS[p] && content.length > PLATFORM_LIMITS[p].limit)
    .map((p) => ({
      platform: PLATFORM_LIMITS[p].name,
      limit: PLATFORM_LIMITS[p].limit,
      over: content.length - PLATFORM_LIMITS[p].limit,
    }));

  const hasMedia = mediaUrls.length > 0 || imageUrl;

  return (
    <form action={handleSubmit}>
      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── 2-COLUMN LAYOUT ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── LEFT COLUMN (2/3): Content + Media + AI ── */}
        <div className="xl:col-span-2 space-y-4">

          {/* AI Content Suggestions (collapsible, open by default for new posts) */}
          {!isEditing && (
            <div>
              <button
                type="button"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="flex items-center gap-2 text-xs font-medium mb-2 transition-colors"
                style={{ color: showSuggestions ? "#a855f7" : "#64748b" }}
              >
                <Zap className="h-3.5 w-3.5" />
                Content Suggestions & Inspiration
                {showSuggestions
                  ? <ChevronUp className="h-3.5 w-3.5 ml-1" />
                  : <ChevronDown className="h-3.5 w-3.5 ml-1" />
                }
              </button>
              {showSuggestions && (
                <AISuggestions onSelectTopic={(topic) => setContent(topic)} />
              )}
            </div>
          )}

          {/* ── MAIN CONTENT CARD ── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0d1424", border: "1px solid rgba(168,85,247,0.2)" }}
          >
            {/* Header */}
            <div
              className="px-5 py-3.5 flex items-center gap-2"
              style={{ borderBottom: "1px solid rgba(168,85,247,0.1)" }}
            >
              <MessageSquare className="h-4 w-4" style={{ color: "#a855f7" }} />
              <span className="font-semibold text-sm text-white">{t("content")}</span>
              {content.length > 0 && (
                <span className="ml-auto text-xs" style={{ color: "#94a3b8" }}>
                  {content.length} Zeichen
                </span>
              )}
            </div>

            <div className="p-5 space-y-3">
              {/* Text area — THE MAIN ELEMENT */}
              <Textarea
                name="content"
                placeholder="Was möchtest du mitteilen? Schreibe deinen Post-Text hier..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={maxLength}
                rows={8}
                className="resize-none text-base"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(168,85,247,0.15)",
                  color: "#e2e8f0",
                  borderRadius: "12px",
                }}
                required
              />

              {/* Platform char limits */}
              {selectedPlatforms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedPlatforms.map((p) => {
                    const info = PLATFORM_LIMITS[p];
                    if (!info) return null;
                    const pct = Math.min((content.length / info.limit) * 100, 100);
                    const isOver = content.length > info.limit;
                    const isNear = pct > 90;
                    return (
                      <span
                        key={p}
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: isOver
                            ? "rgba(239,68,68,0.1)"
                            : isNear
                              ? "rgba(251,146,60,0.1)"
                              : "rgba(255,255,255,0.05)",
                          color: isOver ? "#f87171" : isNear ? "#fb923c" : "#64748b",
                          border: `1px solid ${isOver ? "rgba(239,68,68,0.2)" : isNear ? "rgba(251,146,60,0.2)" : "rgba(255,255,255,0.06)"}`,
                        }}
                      >
                        {info.name}: {content.length}/{info.limit}
                        {isOver && " ⚠️"}
                      </span>
                    );
                  })}
                </div>
              )}

              {platformWarnings.length > 0 && (
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(251,146,60,0.08)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.2)" }}>
                  {platformWarnings.map((w) => (
                    <div key={w.platform}>
                      {t("charsOverLimit", { platform: w.platform, over: w.over, limit: w.limit })}
                    </div>
                  ))}
                </div>
              )}

              {/* AI Toolbar (Hashtags, Emojis, Variations, etc.) */}
              <AIToolbar
                content={content}
                platforms={selectedPlatforms}
                onContentChange={setContent}
                onInsertHashtags={handleInsertHashtags}
              />
            </div>
          </div>

          {/* ── MEDIA TOOLBAR (Bilder hochladen + AI-Bild + Kommentar) ── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0d1424", border: "1px solid rgba(168,85,247,0.15)" }}
          >
            {/* Media action buttons */}
            <div className="flex items-center gap-1 px-4 py-3" style={{ borderBottom: "1px solid rgba(168,85,247,0.08)" }}>
              <span className="text-xs font-medium mr-2" style={{ color: "#94a3b8" }}>Anhängen:</span>

              <button
                type="button"
                onClick={() => { setShowMediaUpload(!showMediaUpload); setShowImageGen(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={showMediaUpload
                  ? { background: "rgba(34,211,238,0.15)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.3)" }
                  : { background: "rgba(255,255,255,0.03)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.06)" }
                }
              >
                <Upload className="h-3.5 w-3.5" />
                Bild / Video hochladen
                {mediaUrls.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px]"
                    style={{ background: "rgba(34,211,238,0.2)", color: "#22d3ee" }}>
                    {mediaUrls.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setShowImageGen(!showImageGen); setShowMediaUpload(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={showImageGen
                  ? { background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }
                  : { background: "rgba(255,255,255,0.03)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.06)" }
                }
              >
                <ImageIcon className="h-3.5 w-3.5" />
                AI-Bild generieren
                {imageUrl && (
                  <span className="ml-1 w-2 h-2 rounded-full" style={{ background: "#a855f7" }} />
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowFirstComment(!showFirstComment)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={showFirstComment
                  ? { background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }
                  : { background: "rgba(255,255,255,0.03)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.06)" }
                }
              >
                <Hash className="h-3.5 w-3.5" />
                Erster Kommentar
                {firstComment && (
                  <span className="ml-1 w-2 h-2 rounded-full" style={{ background: "#34d399" }} />
                )}
              </button>
            </div>

            {/* Media Upload Panel */}
            {showMediaUpload && (
              <div className="p-4" style={{ borderBottom: "1px solid rgba(168,85,247,0.08)" }}>
                <MediaUpload
                  mediaUrls={mediaUrls}
                  onMediaUrlsChange={setMediaUrls}
                />
                {mediaUrls.map((url, i) => (
                  <input key={i} type="hidden" name="mediaUrls" value={url} />
                ))}
              </div>
            )}

            {/* Image Generator Panel */}
            {showImageGen && (
              <div className="p-4" style={{ borderBottom: "1px solid rgba(168,85,247,0.08)" }}>
                <ImageGenerator
                  imageDescription={imageDescription}
                  onImageDescriptionChange={setImageDescription}
                  imageUrl={imageUrl}
                  onImageUrlChange={setImageUrl}
                  content={content}
                  platforms={selectedPlatforms}
                />
              </div>
            )}

            {/* First Comment Panel */}
            {showFirstComment && (
              <div className="p-4">
                <p className="text-xs font-medium text-white mb-2">{t("firstComment")}</p>
                <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>{t("firstCommentDesc")}</p>
                <Textarea
                  name="firstComment"
                  placeholder={t("firstCommentPlaceholder")}
                  value={firstComment}
                  onChange={(e) => setFirstComment(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(52,211,153,0.2)",
                    color: "#e2e8f0",
                    borderRadius: "10px",
                  }}
                />
              </div>
            )}

            {/* Media indicator strip (always visible when has media) */}
            {!showMediaUpload && !showImageGen && (mediaUrls.length > 0 || imageUrl) && (
              <div className="px-4 py-2 flex items-center gap-2">
                {imageUrl && (
                  <span className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                    style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.2)" }}>
                    <ImageIcon className="h-3 w-3" /> AI-Bild angehängt
                  </span>
                )}
                {mediaUrls.length > 0 && (
                  <span className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                    style={{ background: "rgba(34,211,238,0.1)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.2)" }}>
                    <Upload className="h-3 w-3" /> {mediaUrls.length} Datei{mediaUrls.length > 1 ? "en" : ""} angehängt
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── AI TEXT GENERATOR (collapsible) ── */}
          <div>
            <button
              type="button"
              onClick={() => setShowAiTools(!showAiTools)}
              className="flex items-center gap-2 text-xs font-medium mb-2 transition-colors w-full"
              style={{
                color: "#94a3b8",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "12px",
                padding: "10px 14px",
              }}
            >
              <Wand2 className="h-3.5 w-3.5" style={{ color: "#a855f7" }} />
              <span style={{ color: "#a855f7" }}>KI-Textgenerator</span>
              <span style={{ color: "#8899aa" }}>— Generiere einen komplett neuen Post-Text per KI</span>
              {showAiTools
                ? <ChevronUp className="h-3.5 w-3.5 ml-auto" />
                : <ChevronDown className="h-3.5 w-3.5 ml-auto" />
              }
            </button>
            {showAiTools && (
              <TextGenerator
                onContentGenerated={(text) => setContent(text)}
                platforms={selectedPlatforms}
              />
            )}
          </div>

          {/* ── CATEGORY ── */}
          {categories && categories.length > 0 && (
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ background: "#0d1424", border: "1px solid rgba(168,85,247,0.12)" }}
            >
              <p className="text-sm font-semibold text-white">{t("category")}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("")}
                  className="px-3 py-1.5 rounded-full text-xs transition-all"
                  style={!selectedCategory
                    ? { background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }
                    : { background: "rgba(255,255,255,0.03)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.06)" }
                  }
                >
                  {t("noCategory")}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className="px-3 py-1.5 rounded-full text-xs transition-all flex items-center gap-1"
                    style={{
                      background: selectedCategory === cat.id ? `${cat.color}18` : "rgba(255,255,255,0.03)",
                      color: selectedCategory === cat.id ? cat.color : "#64748b",
                      border: `1px solid ${selectedCategory === cat.id ? `${cat.color}40` : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.name}
                  </button>
                ))}
              </div>
              <input type="hidden" name="categoryId" value={selectedCategory} />

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isEvergreen"
                  value="true"
                  checked={isEvergreen}
                  onChange={(e) => setIsEvergreen(e.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "#a855f7" }}
                />
                <div>
                  <span className="text-sm font-medium text-white">{t("evergreen")}</span>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>{t("evergreenDesc")}</p>
                </div>
              </label>
            </div>
          )}

          {/* ── LIVE PREVIEW ── */}
          {content.trim() && selectedPlatforms.length > 0 && (
            <div
              className="rounded-2xl p-4"
              style={{ background: "#0d1424", border: "1px solid rgba(34,211,238,0.15)" }}
            >
              <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: "#22d3ee" }}>
                <Sparkles className="h-3.5 w-3.5" />
                Live Preview
              </p>
              <PostPreview
                content={content}
                imageUrl={imageUrl}
                platforms={selectedPlatforms}
                accountName={
                  socialAccounts.find((a) => selectedAccounts.has(a.id))?.accountName || tCommon("myAccount")
                }
              />
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN (1/3): Platforms + Schedule + Status + Submit ── */}
        <div className="space-y-4">

          {/* PLATFORMS */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0d1424", border: "1px solid rgba(168,85,247,0.2)" }}
          >
            <div className="px-4 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(168,85,247,0.1)" }}>
              <Zap className="h-4 w-4" style={{ color: "#a855f7" }} />
              <span className="font-semibold text-sm text-white">{t("platforms")}</span>
              {selectedAccounts.size > 0 && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>
                  {selectedAccounts.size} gewählt
                </span>
              )}
            </div>
            <div className="p-4 space-y-3">
              {Object.entries(
                socialAccounts.reduce<Record<string, typeof socialAccounts>>((groups, account) => {
                  const key = account.platform;
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(account);
                  return groups;
                }, {})
              ).map(([platformKey, accounts]) => {
                const platform = PLATFORMS[platformKey as Platform];
                const allSelected = accounts.every((a) => selectedAccounts.has(a.id));

                return (
                  <div key={platformKey} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{
                          background: platform?.color ? `${platform.color}15` : "rgba(168,85,247,0.1)",
                          color: platform?.color || "#a855f7",
                        }}
                      >
                        {platform?.name || platformKey}
                      </span>
                      {accounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = new Set(selectedAccounts);
                            if (allSelected) {
                              accounts.forEach((a) => next.delete(a.id));
                            } else {
                              accounts.forEach((a) => next.add(a.id));
                            }
                            setSelectedAccounts(next);
                          }}
                          className="text-xs ml-auto"
                          style={{ color: "#94a3b8" }}
                        >
                          {allSelected ? t("deselectAll") : t("selectAllPlatform")}
                        </button>
                      )}
                    </div>
                    {accounts.map((account) => {
                      const isChecked = selectedAccounts.has(account.id);
                      return (
                        <label
                          key={account.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all"
                          style={{
                            background: isChecked ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.02)",
                            border: `1px solid ${isChecked ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.05)"}`,
                          }}
                        >
                          <input
                            type="checkbox"
                            name="targetAccountIds"
                            value={account.id}
                            checked={isChecked}
                            onChange={() => toggleAccount(account.id)}
                            className="h-4 w-4 rounded"
                            style={{ accentColor: "#a855f7" }}
                          />
                          <span className="text-sm text-white">{account.accountName}</span>
                          {account.accountType && account.accountType !== "page" && (
                            <span className="text-[10px] ml-auto" style={{ color: "#94a3b8" }}>({account.accountType})</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SCHEDULE */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0d1424", border: "1px solid rgba(34,211,238,0.15)" }}
          >
            <div className="px-4 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(34,211,238,0.08)" }}>
              <Calendar className="h-4 w-4" style={{ color: "#22d3ee" }} />
              <span className="font-semibold text-sm text-white">{t("schedule")}</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleMode("custom")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all"
                  style={scheduleMode === "custom"
                    ? { background: "rgba(34,211,238,0.12)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.3)" }
                    : { background: "rgba(255,255,255,0.02)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.05)" }
                  }
                >
                  <Clock className="h-3.5 w-3.5" />
                  {t("customTime")}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setScheduleMode("bestTime");
                    if (selectedPlatforms.length > 0 && !suggestedTime) {
                      setIsFetchingBestTime(true);
                      try {
                        const res = await fetch("/api/scheduling/suggest-time", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ platforms: selectedPlatforms }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setSuggestedTime(new Date(data.suggestedTime).toISOString().slice(0, 16));
                          setSuggestedReason(data.reason);
                        }
                      } catch { /* fallback */ }
                      finally { setIsFetchingBestTime(false); }
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all"
                  style={scheduleMode === "bestTime"
                    ? { background: "rgba(168,85,247,0.12)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }
                    : { background: "rgba(255,255,255,0.02)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.05)" }
                  }
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("bestTime")}
                </button>
              </div>

              {scheduleMode === "custom" && (
                <Input
                  type="datetime-local"
                  id="scheduledAt"
                  name="scheduledAt"
                  defaultValue={defaultScheduledAt}
                  className="text-sm"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(34,211,238,0.2)",
                    color: "#e2e8f0",
                    borderRadius: "10px",
                  }}
                />
              )}

              {scheduleMode === "bestTime" && (
                <div className="space-y-2">
                  {isFetchingBestTime ? (
                    <div className="flex items-center gap-2 text-xs p-2" style={{ color: "#94a3b8" }}>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {t("calculatingBestTime")}
                    </div>
                  ) : suggestedTime ? (
                    <>
                      <div className="p-2.5 rounded-xl text-xs" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", color: "#c084fc" }}>
                        <Sparkles className="h-3 w-3 inline mr-1" />
                        {suggestedReason}
                      </div>
                      <input type="hidden" name="scheduledAt" value={suggestedTime} />
                      <Input
                        type="datetime-local"
                        value={suggestedTime}
                        onChange={(e) => setSuggestedTime(e.target.value)}
                        className="text-sm"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.2)", color: "#e2e8f0", borderRadius: "10px" }}
                      />
                    </>
                  ) : (
                    <p className="text-xs p-2" style={{ color: "#94a3b8" }}>
                      {selectedPlatforms.length === 0 ? t("selectPlatformsFirst") : t("noBestTimeAvailable")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* STATUS */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0d1424", border: "1px solid rgba(168,85,247,0.12)" }}
          >
            <div className="px-4 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(168,85,247,0.08)" }}>
              <span className="font-semibold text-sm text-white">{t("status")}</span>
            </div>
            <div className="p-4 flex gap-3">
              {[
                { value: "DRAFT", label: t("draft"), color: "#94a3b8" },
                { value: "SCHEDULED", label: t("scheduled"), color: "#22d3ee" },
              ].map((opt) => {
                const isDefault = opt.value === "DRAFT"
                  ? !post || post.status === "DRAFT"
                  : post?.status === "SCHEDULED";
                return (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="status"
                      value={opt.value}
                      defaultChecked={isDefault}
                      className="h-4 w-4"
                      style={{ accentColor: opt.color }}
                    />
                    <span className="text-sm font-medium" style={{ color: opt.color }}>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* SUBMIT */}
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              className="w-full font-bold text-sm h-11"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                border: "none",
                boxShadow: "0 0 25px rgba(168,85,247,0.35)",
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              {isEditing ? tCommon("update") : tCommon("create")}
            </Button>
            <Link href="/posts" className="w-full">
              <Button
                type="button"
                variant="outline"
                className="w-full text-sm"
                style={{ border: "1px solid rgba(168,85,247,0.2)", color: "#94a3b8", background: "transparent" }}
              >
                {tCommon("cancel")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
