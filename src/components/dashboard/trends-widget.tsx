"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Rss,
  ExternalLink,
  RefreshCw,
  Loader2,
  Flame,
  Newspaper,
  Lightbulb,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface TrendingTopic {
  title: string;
  description: string;
  link: string;
  traffic: string;
  relatedQueries: string[];
}

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  snippet: string;
}

interface TrendingKeyword {
  topic: string;
  count: number;
}

const CATEGORY_FILTERS = [
  { key: "all", color: "bg-gray-500" },
  { key: "social-media", color: "bg-blue-500" },
  { key: "marketing", color: "bg-purple-500" },
  { key: "tech", color: "bg-green-500" },
  { key: "industry", color: "bg-orange-500" },
] as const;

const AUTO_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-2.5">
          <Skeleton className="h-4 w-6 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TrendsWidget() {
  const t = useTranslations("trends");
  const [activeTab, setActiveTab] = useState("google");
  const [activeCategory, setActiveCategory] = useState("all");
  const [googleTrends, setGoogleTrends] = useState<TrendingTopic[]>([]);
  const [rssItems, setRssItems] = useState<FeedItem[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingKeyword[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchGoogleTrends = useCallback(async () => {
    setLoading((l) => ({ ...l, google: true }));
    setError(null);
    try {
      const res = await fetch("/api/trends");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setGoogleTrends(data.trends || []);
    } catch {
      setError(t("fetchError"));
    } finally {
      setLoading((l) => ({ ...l, google: false }));
    }
  }, [t]);

  const fetchRSSFeeds = useCallback(async (category?: string) => {
    setLoading((l) => ({ ...l, rss: true }));
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "15" });
      if (category && category !== "all") {
        params.set("categories", category);
      }
      const res = await fetch(`/api/trends/rss?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRssItems(data.items || []);
      setTrendingTopics(data.trendingTopics || []);
    } catch {
      setError(t("fetchError"));
    } finally {
      setLoading((l) => ({ ...l, rss: false }));
    }
  }, [t]);

  useEffect(() => {
    fetchGoogleTrends();
    fetchRSSFeeds();
  }, [fetchGoogleTrends, fetchRSSFeeds]);

  // Auto-refresh every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGoogleTrends();
      fetchRSSFeeds(activeCategory);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [activeCategory, fetchGoogleTrends, fetchRSSFeeds]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    fetchRSSFeeds(category);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 1) return t("justNow");
      if (hours < 24) return t("hoursAgo", { count: hours });
      const days = Math.floor(hours / 24);
      return t("daysAgo", { count: days });
    } catch {
      return "";
    }
  };

  const getInspirationUrl = (item: FeedItem) => {
    const content = encodeURIComponent(`${item.title} ${item.link}`);
    return `/posts/new?content=${content}`;
  };

  // Category color mapping for badges
  const getCategoryBadgeColor = (index: number) => {
    const colors = [
      "bg-red-500/90 hover:bg-red-500",
      "bg-orange-500/90 hover:bg-orange-500",
      "bg-amber-500/90 hover:bg-amber-500",
      "bg-blue-500/90 hover:bg-blue-500",
      "bg-purple-500/90 hover:bg-purple-500",
      "bg-green-500/90 hover:bg-green-500",
      "bg-teal-500/90 hover:bg-teal-500",
    ];
    return colors[index % colors.length];
  };

  // Limit display counts
  const displayedTopics = trendingTopics.slice(0, 5);
  const displayedRssItems = rssItems.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="google" className="gap-1.5 text-xs">
              <Flame className="h-3.5 w-3.5" />
              {t("googleTrends")}
            </TabsTrigger>
            <TabsTrigger value="rss" className="gap-1.5 text-xs">
              <Newspaper className="h-3.5 w-3.5" />
              {t("industryNews")}
            </TabsTrigger>
            <TabsTrigger value="topics" className="gap-1.5 text-xs">
              <Lightbulb className="h-3.5 w-3.5" />
              {t("hotTopics")}
            </TabsTrigger>
          </TabsList>

          {/* Google Trends */}
          <TabsContent value="google" className="mt-4">
            <div className="flex justify-end mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchGoogleTrends}
                disabled={loading.google}
                className="text-xs"
              >
                {loading.google ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                )}
                {t("refresh")}
              </Button>
            </div>
            {loading.google && googleTrends.length === 0 ? (
              <LoadingSkeleton />
            ) : googleTrends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Flame className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t("noTrends")}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {googleTrends.map((trend, i) => (
                  <a
                    key={i}
                    href={trend.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-2.5 rounded-lg border hover:bg-muted/50 transition-colors group"
                  >
                    <span className="text-lg font-bold text-muted-foreground/40 mt-0.5 w-6 text-right shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                        {trend.title}
                      </p>
                      {trend.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {trend.description}
                        </p>
                      )}
                      {trend.traffic && (
                        <Badge variant="secondary" className="text-[10px] mt-1">
                          <BarChart3 className="h-2.5 w-2.5 mr-0.5" />
                          {trend.traffic}
                        </Badge>
                      )}
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            )}
          </TabsContent>

          {/* RSS Industry News */}
          <TabsContent value="rss" className="mt-4">
            {/* Category filter buttons */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {CATEGORY_FILTERS.map((cat) => (
                <Button
                  key={cat.key}
                  variant={activeCategory === cat.key ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7 px-2.5"
                  onClick={() => handleCategoryChange(cat.key)}
                >
                  {cat.key === "all"
                    ? t("allCategories")
                    : cat.key === "social-media"
                    ? t("socialMedia")
                    : cat.key === "marketing"
                    ? t("marketing")
                    : cat.key === "tech"
                    ? t("tech")
                    : t("industry")}
                </Button>
              ))}
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchRSSFeeds(activeCategory)}
                disabled={loading.rss}
                className="text-xs h-7"
              >
                {loading.rss ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                )}
                {t("refresh")}
              </Button>
            </div>

            {loading.rss && rssItems.length === 0 ? (
              <LoadingSkeleton />
            ) : displayedRssItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Rss className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t("noNews")}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {displayedRssItems.map((item, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg border hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-0"
                      >
                        <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                          {item.title}
                        </p>
                      </a>
                      <div className="flex items-center gap-1 shrink-0">
                        <Link href={getInspirationUrl(item)}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Sparkles className="h-3 w-3 mr-0.5" />
                            {t("useAsInspiration")}
                          </Button>
                        </Link>
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </div>
                    </div>
                    {item.snippet && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.snippet}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {item.source}
                      </Badge>
                      {item.category && (
                        <Badge variant="secondary" className="text-[10px]">
                          {item.category}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(item.pubDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Hot Topics */}
          <TabsContent value="topics" className="mt-4">
            {displayedTopics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t("noTopics")}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchRSSFeeds(activeCategory)}
                  className="mt-3"
                  disabled={loading.rss}
                >
                  {t("loadTopics")}
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-3">
                  {t("topicsDescription")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {displayedTopics.map((topic, i) => (
                    <Badge
                      key={i}
                      variant={i < 3 ? "default" : "secondary"}
                      className={`text-xs px-3 py-1 cursor-default ${
                        i < 3 ? getCategoryBadgeColor(i) : ""
                      }`}
                    >
                      <Flame className={`h-3 w-3 mr-1 ${i < 3 ? "text-yellow-200" : ""}`} />
                      {topic.topic}
                      <span className="ml-1.5 opacity-60">{topic.count}</span>
                    </Badge>
                  ))}
                </div>

                {/* Show remaining topics as secondary badges */}
                {trendingTopics.length > 5 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
                    {trendingTopics.slice(5, 10).map((topic, i) => (
                      <Badge
                        key={i + 5}
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 cursor-default"
                      >
                        {topic.topic}
                        <span className="ml-1 opacity-50">{topic.count}</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <p className="text-xs text-destructive mt-3">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
