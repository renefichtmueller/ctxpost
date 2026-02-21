"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface UpcomingPost {
  id: string;
  content: string;
  scheduledAt: string;
  status: string;
  targets: Array<{
    id: string;
    platform: string;
  }>;
}

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: "#1877F2",
  LINKEDIN: "#0A66C2",
  TWITTER: "#000000",
  INSTAGRAM: "#E4405F",
  THREADS: "#000000",
};

const PLATFORM_NAMES: Record<string, string> = {
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  TWITTER: "X",
  INSTAGRAM: "Instagram",
  THREADS: "Threads",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-3 rounded-lg border space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function CalendarMiniWidget() {
  const t = useTranslations("dashboard");
  const [posts, setPosts] = useState<UpcomingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUpcoming() {
      try {
        const res = await fetch("/api/posts/upcoming");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setPosts(data.posts || []);
      } catch {
        setError("Could not load upcoming posts");
      } finally {
        setLoading(false);
      }
    }

    fetchUpcoming();
  }, []);

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const timeStr = date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (diffDays === 0) {
        return { date: "Today", time: timeStr };
      } else if (diffDays === 1) {
        return { date: "Tomorrow", time: timeStr };
      } else {
        const dateFormatted = date.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        return { date: dateFormatted, time: timeStr };
      }
    } catch {
      return { date: "", time: "" };
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5" />
            {t("upcomingPosts")}
          </CardTitle>
          <Link href="/calendar">
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
              {t("viewCalendar")}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-xs">{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("noUpcomingPosts")}</p>
            <Link href="/posts/new">
              <Button variant="outline" size="sm" className="mt-3">
                {t("createPost")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => {
              const { date, time } = formatDateTime(post.scheduledAt);
              return (
                <Link
                  key={post.id}
                  href={`/posts/${post.id}`}
                  className="block p-2.5 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span className="font-medium">{date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{time}</span>
                    </div>
                    <div className="flex-1" />
                    {post.targets.map((target) => (
                      <Badge
                        key={target.id}
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                        style={{
                          backgroundColor: PLATFORM_COLORS[target.platform]
                            ? `${PLATFORM_COLORS[target.platform]}15`
                            : undefined,
                          color: PLATFORM_COLORS[target.platform],
                        }}
                      >
                        {PLATFORM_NAMES[target.platform] || target.platform}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs line-clamp-2 text-foreground/80">
                    {post.content}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
