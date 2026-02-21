"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface RankedPost {
  id: string;
  content: string;
  platform: string;
  publishedAt: string;
  score: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reason: string;
}

interface TopWorstPostsProps {
  topPosts: RankedPost[];
  worstPosts: RankedPost[];
}

function truncate(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function PostItem({ post, rank, type }: { post: RankedPost; rank: number; type: "top" | "worst" }) {
  const isTop = type === "top";
  const tCommon = useTranslations("common");

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border">
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${
          isTop
            ? "bg-green-500/15 text-green-700 dark:text-green-400"
            : "bg-red-500/15 text-red-700 dark:text-red-400"
        }`}
      >
        {rank}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium leading-snug">{truncate(post.content)}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {post.platform}
          </Badge>
          <span>{formatDate(post.publishedAt)}</span>
          <span>•</span>
          <span>{post.likes} {tCommon("likes")}</span>
          <span>{post.comments} {tCommon("comments")}</span>
          <span>{post.shares} {tCommon("shares")}</span>
          {post.impressions > 0 && (
            <>
              <span>•</span>
              <span>{post.impressions.toLocaleString()} {tCommon("impressions")}</span>
            </>
          )}
        </div>
        <p className={`text-xs ${isTop ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
          {post.reason}
        </p>
      </div>
      <Badge
        className={`shrink-0 border-0 ${
          isTop
            ? "bg-green-500/15 text-green-700 dark:text-green-400"
            : "bg-red-500/15 text-red-700 dark:text-red-400"
        }`}
      >
        {post.score.toFixed(2)}
      </Badge>
    </div>
  );
}

export function TopWorstPosts({ topPosts, worstPosts }: TopWorstPostsProps) {
  const t = useTranslations("analytics");
  const hasData = topPosts.length > 0 || worstPosts.length > 0;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            {t("topPosts")}
          </CardTitle>
          <CardDescription>
            {t("topPostsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("noPublishedPostsWithData")}
            </p>
          ) : (
            <div className="space-y-2">
              {topPosts.map((post, idx) => (
                <PostItem key={post.id} post={post} rank={idx + 1} type="top" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            {t("weakestPosts")}
          </CardTitle>
          <CardDescription>
            {t("weakestPostsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {worstPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("noPublishedPostsWithData")}
            </p>
          ) : (
            <div className="space-y-2">
              {worstPosts.map((post, idx) => (
                <PostItem key={post.id} post={post} rank={idx + 1} type="worst" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!hasData && (
        <div className="md:col-span-2 text-center py-4 text-sm text-muted-foreground">
          {t("publishPostsToSeeRanking")}
        </div>
      )}
    </div>
  );
}
