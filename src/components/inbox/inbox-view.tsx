"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  MousePointerClick,
  ExternalLink,
  Reply,
  Inbox,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────

type Platform = "FACEBOOK" | "LINKEDIN" | "TWITTER" | "INSTAGRAM" | "THREADS";

interface PostTarget {
  id: string;
  platformPostId: string | null;
  platform: Platform;
  accountName: string;
  publishedAt: string | null;
}

interface PostAnalytics {
  id: string;
  platform: Platform;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  clicks: number;
  engagementRate: number | null;
  fetchedAt: string;
}

interface InboxPost {
  id: string;
  content: string;
  contentType: string;
  imageUrl: string | null;
  publishedAt: string | null;
  targets: PostTarget[];
  analytics: PostAnalytics[];
}

interface InboxViewProps {
  posts: InboxPost[];
}

// ─── Helpers ──────────────────────────────────────────────

const PLATFORM_LABELS: Record<Platform, string> = {
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  TWITTER: "X / Twitter",
  INSTAGRAM: "Instagram",
  THREADS: "Threads",
};

const PLATFORM_COLORS: Record<Platform, string> = {
  FACEBOOK: "bg-blue-600",
  LINKEDIN: "bg-blue-700",
  TWITTER: "bg-neutral-800",
  INSTAGRAM: "bg-gradient-to-r from-purple-500 to-pink-500",
  THREADS: "bg-neutral-900",
};

function getPlatformPostUrl(platform: Platform, platformPostId: string): string {
  switch (platform) {
    case "FACEBOOK":
      return `https://www.facebook.com/${platformPostId}`;
    case "LINKEDIN":
      return `https://www.linkedin.com/feed/update/${platformPostId}`;
    case "TWITTER":
      return `https://twitter.com/i/status/${platformPostId}`;
    case "INSTAGRAM":
      return `https://www.instagram.com/p/${platformPostId}`;
    case "THREADS":
      return `https://www.threads.net/post/${platformPostId}`;
    default:
      return "#";
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateContent(content: string, maxLength = 120): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + "...";
}

// ─── Component ────────────────────────────────────────────

export function InboxView({ posts }: InboxViewProps) {
  const t = useTranslations("inbox");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Compute unique platforms from posts
  const availablePlatforms = useMemo(() => {
    const platforms = new Set<Platform>();
    posts.forEach((post) => {
      post.targets.forEach((target) => platforms.add(target.platform));
      post.analytics.forEach((a) => platforms.add(a.platform));
    });
    return Array.from(platforms);
  }, [posts]);

  // Filter posts based on active tab
  const filteredPosts = useMemo(() => {
    if (activeTab === "all") return posts;
    return posts.filter(
      (post) =>
        post.targets.some((t) => t.platform === activeTab) ||
        post.analytics.some((a) => a.platform === activeTab)
    );
  }, [posts, activeTab]);

  // Calculate total engagement summary
  const totalEngagement = useMemo(() => {
    const postsToSum = activeTab === "all" ? posts : filteredPosts;
    return postsToSum.reduce(
      (acc, post) => {
        post.analytics.forEach((a) => {
          if (activeTab === "all" || a.platform === activeTab) {
            acc.likes += a.likes;
            acc.comments += a.comments;
            acc.shares += a.shares;
            acc.impressions += a.impressions;
            acc.clicks += a.clicks;
          }
        });
        return acc;
      },
      { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 }
    );
  }, [posts, filteredPosts, activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Inbox className="h-8 w-8" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("description")}</p>
      </div>

      {/* Total Engagement Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("totalEngagement")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{totalEngagement.likes.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t("likes")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalEngagement.comments.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t("comments")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{totalEngagement.shares.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t("shares")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{totalEngagement.impressions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t("impressions")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{totalEngagement.clicks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t("clicks")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Tabs & Post List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">{t("allPlatforms")}</TabsTrigger>
          {availablePlatforms.map((platform) => (
            <TabsTrigger key={platform} value={platform}>
              {PLATFORM_LABELS[platform]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">{t("noMessages")}</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {t("noMessagesDesc")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} activeTab={activeTab} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────

function PostCard({ post, activeTab }: { post: InboxPost; activeTab: string }) {
  const t = useTranslations("inbox");

  // Aggregate analytics per platform (or all)
  const relevantAnalytics = useMemo(() => {
    if (activeTab === "all") return post.analytics;
    return post.analytics.filter((a) => a.platform === activeTab);
  }, [post.analytics, activeTab]);

  const aggregated = useMemo(() => {
    return relevantAnalytics.reduce(
      (acc, a) => ({
        likes: acc.likes + a.likes,
        comments: acc.comments + a.comments,
        shares: acc.shares + a.shares,
        impressions: acc.impressions + a.impressions,
        clicks: acc.clicks + a.clicks,
      }),
      { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 }
    );
  }, [relevantAnalytics]);

  // Get relevant targets for action buttons
  const relevantTargets = useMemo(() => {
    if (activeTab === "all") return post.targets;
    return post.targets.filter((t) => t.platform === activeTab);
  }, [post.targets, activeTab]);

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Top row: content preview + platforms */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-relaxed">{truncateContent(post.content)}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {post.targets.map((target) => (
                  <Badge
                    key={target.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {PLATFORM_LABELS[target.platform]}
                    {target.accountName && (
                      <span className="ml-1 opacity-60">({target.accountName})</span>
                    )}
                  </Badge>
                ))}
                {post.publishedAt && (
                  <span className="text-xs text-muted-foreground">
                    {t("publishedAt")}: {formatDate(post.publishedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Engagement metrics row */}
          <div className="flex items-center gap-4 sm:gap-6 text-sm">
            <div className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-red-500" />
              <span className="font-medium">{aggregated.likes}</span>
              <span className="text-muted-foreground hidden sm:inline">{t("likes")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
              <span className="font-medium">{aggregated.comments}</span>
              <span className="text-muted-foreground hidden sm:inline">{t("comments")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5 text-green-500" />
              <span className="font-medium">{aggregated.shares}</span>
              <span className="text-muted-foreground hidden sm:inline">{t("shares")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-purple-500" />
              <span className="font-medium">{aggregated.impressions}</span>
              <span className="text-muted-foreground hidden sm:inline">{t("impressions")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MousePointerClick className="h-3.5 w-3.5 text-orange-500" />
              <span className="font-medium">{aggregated.clicks}</span>
              <span className="text-muted-foreground hidden sm:inline">{t("clicks")}</span>
            </div>
          </div>

          {/* Action buttons row */}
          <div className="flex items-center gap-2 flex-wrap">
            {relevantTargets.map(
              (target) =>
                target.platformPostId && (
                  <div key={target.id} className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={getPlatformPostUrl(target.platform, target.platformPostId)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        {t("viewOnPlatform")} ({PLATFORM_LABELS[target.platform]})
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a
                        href={getPlatformPostUrl(target.platform, target.platformPostId)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Reply className="h-3.5 w-3.5 mr-1.5" />
                        {t("reply")}
                      </a>
                    </Button>
                  </div>
                )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
