"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Lightbulb, Sparkles, RefreshCw, ArrowRight, Loader2, TrendingUp, Rss } from "lucide-react";

interface PostIdeasProps {
  hasAI: boolean;
  hasBrand: boolean;
  socialAccounts: Array<{ id: string; platform: string; accountName: string }>;
}

interface Idea {
  id: string;
  title: string;
  content: string;
  category: string;
  source: "ai" | "trend" | "rss";
}

export function PostIdeas({ hasAI, hasBrand, socialAccounts }: PostIdeasProps) {
  const t = useTranslations("ideas");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [trendTopics, setTrendTopics] = useState<string[]>([]);
  const [rssIdeas, setRssIdeas] = useState<Idea[]>([]);

  const generateIdeas = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/content-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic || undefined,
          count: 5,
          platforms: socialAccounts.map((a) => a.platform),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const suggestions = (data.suggestions || []).map(
          (s: { title?: string; content: string; category?: string }, i: number) => ({
            id: `ai-${Date.now()}-${i}`,
            title: s.title || s.content.slice(0, 60),
            content: s.content,
            category: s.category || "general",
            source: "ai" as const,
          })
        );
        setIdeas(suggestions);
      }
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  };

  const loadTrends = async () => {
    try {
      const res = await fetch("/api/trends?limit=10");
      if (res.ok) {
        const data = await res.json();
        setTrendTopics(data.trends?.map((t: { topic: string }) => t.topic) || []);
      }
    } catch { /* ignore */ }
  };

  const loadRSSIdeas = async () => {
    try {
      const res = await fetch("/api/trends/rss?limit=10");
      if (res.ok) {
        const data = await res.json();
        const items = (data.items || []).slice(0, 8).map(
          (item: { title: string; summary?: string; categories?: string[] }, i: number) => ({
            id: `rss-${Date.now()}-${i}`,
            title: item.title,
            content: item.summary || item.title,
            category: item.categories?.[0] || "news",
            source: "rss" as const,
          })
        );
        setRssIdeas(items);
      }
    } catch { /* ignore */ }
  };

  const useIdea = (idea: Idea) => {
    const params = new URLSearchParams({ prefill: idea.content });
    window.location.href = `/posts/new?${params.toString()}`;
  };

  // Suppress unused variable warnings
  void hasAI;
  void hasBrand;

  return (
    <div className="space-y-6">
      {/* AI Idea Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("aiIdeas")}
          </CardTitle>
          <CardDescription>{t("aiIdeasDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={t("topicPlaceholder")}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateIdeas()}
              className="flex-1"
            />
            <Button onClick={generateIdeas} disabled={isLoading} className="gap-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
              {t("generate")}
            </Button>
          </div>
          {ideas.length > 0 && (
            <div className="space-y-3">
              {ideas.map((idea) => (
                <div key={idea.id} className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                  <Lightbulb className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{idea.title}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{idea.content}</p>
                    <Badge variant="secondary" className="mt-2 text-xs">{idea.category}</Badge>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1 flex-shrink-0" onClick={() => useIdea(idea)}>
                    {t("useIdea")} <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button variant="ghost" className="w-full gap-2" onClick={generateIdeas} disabled={isLoading}>
                <RefreshCw className="h-4 w-4" /> {t("generateMore")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trending Topics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            {t("trendingTopics")}
          </CardTitle>
          <CardDescription>{t("trendingDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {trendTopics.length === 0 ? (
            <Button variant="outline" onClick={loadTrends} className="gap-2">
              <TrendingUp className="h-4 w-4" /> {t("loadTrends")}
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              {trendTopics.map((tp, i) => (
                <Badge key={i} variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => { setTopic(tp); generateIdeas(); }}>
                  {tp}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RSS Inspiration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rss className="h-5 w-5 text-orange-500" />
            {t("rssInspiration")}
          </CardTitle>
          <CardDescription>{t("rssDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {rssIdeas.length === 0 ? (
            <Button variant="outline" onClick={loadRSSIdeas} className="gap-2">
              <Rss className="h-4 w-4" /> {t("loadRSS")}
            </Button>
          ) : (
            <div className="space-y-2">
              {rssIdeas.map((idea) => (
                <div key={idea.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <Rss className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  <p className="flex-1 text-sm truncate">{idea.title}</p>
                  <Button size="sm" variant="ghost" className="gap-1 flex-shrink-0" onClick={() => useIdea(idea)}>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
