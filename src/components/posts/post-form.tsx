"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { createPost, updatePost } from "@/actions/posts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLATFORMS } from "@/lib/constants";
import type { Platform } from "@prisma/client";
import { AlertCircle, Send, Sparkles, Loader2, Clock } from "lucide-react";
import Link from "next/link";
import { AIToolbar } from "./ai-toolbar";
import { ImageGenerator } from "./image-generator";
import { PostPreview } from "./post-preview";
import { MediaUpload } from "./media-upload";
import { TextGenerator } from "./text-generator";

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

// Platform-specific character limits
const PLATFORM_LIMITS: Record<string, { name: string; limit: number }> = {
  FACEBOOK: { name: "Facebook", limit: 63206 },
  LINKEDIN: { name: "LinkedIn", limit: 3000 },
  INSTAGRAM: { name: "Instagram", limit: 2200 },
  TWITTER: { name: "X/Twitter", limit: 280 },
};

export function PostForm({ socialAccounts, categories, post }: PostFormProps) {
  const t = useTranslations("posts");
  const tCommon = useTranslations("common");

  const [content, setContent] = useState(post?.content || "");
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
  const maxLength = 5000;

  const isEditing = !!post;

  // Get selected platforms for AI features
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
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">
                {t("noAccountsTitle")}
              </h3>
              <p className="text-muted-foreground">
                {t("noAccountsDesc")}
              </p>
            </div>
            <Link href="/accounts">
              <Button>{t("connectAccounts")}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const defaultScheduledAt = post?.scheduledAt
    ? new Date(post.scheduledAt).toISOString().slice(0, 16)
    : "";

  // Calculate platform-specific lengths
  const platformWarnings = selectedPlatforms
    .filter((p) => PLATFORM_LIMITS[p] && content.length > PLATFORM_LIMITS[p].limit)
    .map((p) => ({
      platform: PLATFORM_LIMITS[p].name,
      limit: PLATFORM_LIMITS[p].limit,
      over: content.length - PLATFORM_LIMITS[p].limit,
    }));

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("content")}</CardTitle>
          <CardDescription>
            {t("contentDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Textarea
              name="content"
              placeholder={t("contentPlaceholder")}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={maxLength}
              rows={6}
              className="resize-none"
              required
            />

            {/* Character Counter with Platform Limits */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {selectedPlatforms.map((p) => {
                  const info = PLATFORM_LIMITS[p];
                  if (!info) return null;
                  const pct = (content.length / info.limit) * 100;
                  const isOver = content.length > info.limit;
                  return (
                    <span
                      key={p}
                      className={`text-xs ${
                        isOver
                          ? "text-destructive font-medium"
                          : pct > 90
                            ? "text-orange-500"
                            : "text-muted-foreground"
                      }`}
                    >
                      {info.name}: {content.length}/{info.limit}
                    </span>
                  );
                })}
              </div>
              <span
                className={`text-xs ${
                  content.length > maxLength * 0.9
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {content.length} / {maxLength}
              </span>
            </div>

            {/* Platform Length Warnings */}
            {platformWarnings.length > 0 && (
              <div className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-3 py-2 rounded-md">
                {platformWarnings.map((w) => (
                  <div key={w.platform}>
                    {t("charsOverLimit", { platform: w.platform, over: w.over, limit: w.limit })}
                  </div>
                ))}
              </div>
            )}

            {/* AI Toolbar */}
            <AIToolbar
              content={content}
              platforms={selectedPlatforms}
              onContentChange={setContent}
              onInsertHashtags={handleInsertHashtags}
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Category */}
      {categories && categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("category")}</CardTitle>
            <CardDescription>{t("categoryDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("")}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    !selectedCategory
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-muted hover:border-muted-foreground/30"
                  }`}
                >
                  {t("noCategory")}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? "font-medium"
                        : "hover:border-muted-foreground/30"
                    }`}
                    style={{
                      borderColor: selectedCategory === cat.id ? cat.color : undefined,
                      backgroundColor: selectedCategory === cat.id ? `${cat.color}15` : undefined,
                      color: selectedCategory === cat.id ? cat.color : undefined,
                    }}
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.name}
                  </button>
                ))}
              </div>
              <input type="hidden" name="categoryId" value={selectedCategory} />

              {/* Evergreen Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isEvergreen"
                  value="true"
                  checked={isEvergreen}
                  onChange={(e) => setIsEvergreen(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium">{t("evergreen")}</span>
                  <p className="text-xs text-muted-foreground">{t("evergreenDesc")}</p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Text Generator */}
      <TextGenerator
        onContentGenerated={(text) => setContent(text)}
        platforms={selectedPlatforms}
      />

      {/* Media Upload */}
      <MediaUpload
        mediaUrls={mediaUrls}
        onMediaUrlsChange={setMediaUrls}
      />
      {/* Hidden inputs for mediaUrls */}
      {mediaUrls.map((url, i) => (
        <input key={i} type="hidden" name="mediaUrls" value={url} />
      ))}

      {/* First Comment */}
      <Card>
        <CardHeader>
          <CardTitle>{t("firstComment")}</CardTitle>
          <CardDescription>{t("firstCommentDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            name="firstComment"
            placeholder={t("firstCommentPlaceholder")}
            value={firstComment}
            onChange={(e) => setFirstComment(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* Image Generator */}
      <ImageGenerator
        imageDescription={imageDescription}
        onImageDescriptionChange={setImageDescription}
        imageUrl={imageUrl}
        onImageUrlChange={setImageUrl}
        content={content}
        platforms={selectedPlatforms}
      />

      {/* Post Preview */}
      {content.trim() && selectedPlatforms.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <PostPreview
              content={content}
              imageUrl={imageUrl}
              platforms={selectedPlatforms}
              accountName={
                socialAccounts.find((a) => selectedAccounts.has(a.id))?.accountName || tCommon("myAccount")
              }
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("schedule")}</CardTitle>
          <CardDescription>
            {t("scheduleDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Schedule Mode Selection */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setScheduleMode("custom")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm transition-colors ${
                  scheduleMode === "custom"
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <Clock className="h-4 w-4" />
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
                    } catch {
                      // Fallback will be used
                    } finally {
                      setIsFetchingBestTime(false);
                    }
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm transition-colors ${
                  scheduleMode === "bestTime"
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                {t("bestTime")}
              </button>
            </div>

            {/* Custom Time Input */}
            {scheduleMode === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">{t("dateTime")}</Label>
                <Input
                  type="datetime-local"
                  id="scheduledAt"
                  name="scheduledAt"
                  defaultValue={defaultScheduledAt}
                />
              </div>
            )}

            {/* Best Time Suggestion */}
            {scheduleMode === "bestTime" && (
              <div className="space-y-3">
                {isFetchingBestTime ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("calculatingBestTime")}
                  </div>
                ) : suggestedTime ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-primary/5 border-primary/30">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t("suggestedTime")}</p>
                        <p className="text-xs text-muted-foreground">{suggestedReason}</p>
                      </div>
                    </div>
                    <input type="hidden" name="scheduledAt" value={suggestedTime} />
                    <div className="flex items-center gap-2">
                      <Input
                        type="datetime-local"
                        value={suggestedTime}
                        onChange={(e) => setSuggestedTime(e.target.value)}
                        className="flex-1"
                      />
                      <p className="text-xs text-muted-foreground">{t("adjustIfNeeded")}</p>
                    </div>
                  </div>
                ) : selectedPlatforms.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3 border rounded-lg">
                    {t("selectPlatformsFirst")}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground p-3 border rounded-lg">
                    {t("noBestTimeAvailable")}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("platforms")}</CardTitle>
          <CardDescription>
            {t("platformsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Group accounts by platform */}
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
              const someSelected = accounts.some((a) => selectedAccounts.has(a.id));

              const togglePlatform = () => {
                const next = new Set(selectedAccounts);
                if (allSelected) {
                  accounts.forEach((a) => next.delete(a.id));
                } else {
                  accounts.forEach((a) => next.add(a.id));
                }
                setSelectedAccounts(next);
              };

              return (
                <div key={platformKey} className="space-y-2">
                  {/* Platform header with select all */}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="font-medium"
                      style={{
                        backgroundColor: platform?.color ? `${platform.color}20` : undefined,
                        color: platform?.color,
                      }}
                    >
                      {platform?.name || platformKey}
                    </Badge>
                    {accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={togglePlatform}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {allSelected ? t("deselectAll") : t("selectAllPlatform")}
                      </button>
                    )}
                  </div>
                  {/* Accounts within platform */}
                  <div className="space-y-1 ml-2">
                    {accounts.map((account) => {
                      const isChecked = selectedAccounts.has(account.id);
                      return (
                        <label
                          key={account.id}
                          className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            name="targetAccountIds"
                            value={account.id}
                            checked={isChecked}
                            onChange={() => toggleAccount(account.id)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-sm">{account.accountName}</span>
                          {account.accountType && account.accountType !== "page" && (
                            <span className="text-xs text-muted-foreground">({account.accountType})</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("status")}</CardTitle>
          <CardDescription>
            {t("statusDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="DRAFT"
                defaultChecked={!post || post.status === "DRAFT"}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">{t("draft")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="SCHEDULED"
                defaultChecked={post?.status === "SCHEDULED"}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">{t("scheduled")}</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/posts">
          <Button type="button" variant="outline">
            {tCommon("cancel")}
          </Button>
        </Link>
        <Button type="submit" className="gap-2">
          <Send className="h-4 w-4" />
          {isEditing ? tCommon("update") : tCommon("create")}
        </Button>
      </div>
    </form>
  );
}
