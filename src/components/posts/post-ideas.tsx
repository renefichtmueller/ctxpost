"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Lightbulb, Sparkles, RefreshCw, ArrowRight, Loader2,
  TrendingUp, Rss, AlertCircle, Zap, Brain
} from "lucide-react";

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

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  engagement: { bg: "rgba(168, 85, 247, 0.15)", text: "#c084fc" },
  educational: { bg: "rgba(34, 211, 238, 0.15)", text: "#22d3ee" },
  promotional: { bg: "rgba(251, 146, 60, 0.15)", text: "#fb923c" },
  storytelling: { bg: "rgba(244, 114, 182, 0.15)", text: "#f472b6" },
  trending: { bg: "rgba(52, 211, 153, 0.15)", text: "#34d399" },
  general: { bg: "rgba(100, 116, 139, 0.15)", text: "#94a3b8" },
};

export function PostIdeas({ hasAI, hasBrand, socialAccounts }: PostIdeasProps) {
  const t = useTranslations("ideas");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [isLoadingRSS, setIsLoadingRSS] = useState(false);
  const [topic, setTopic] = useState("");
  const [trendTopics, setTrendTopics] = useState<string[]>([]);
  const [rssIdeas, setRssIdeas] = useState<Idea[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Auto-load trends + RSS on mount
  useEffect(() => {
    loadTrends();
    loadRSSIdeas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateIdeas = async (overrideTopic?: string) => {
    setIsLoading(true);
    setError(null);
    const useTopic = overrideTopic ?? topic;
    try {
      const res = await fetch("/api/ai/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: useTopic || undefined,
          count: 6,
          platforms: socialAccounts.map((a) => a.platform),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrends = async () => {
    setIsLoadingTrends(true);
    try {
      const res = await fetch("/api/trends?limit=12");
      if (res.ok) {
        const data = await res.json();
        const titles = data.trends?.map((t: { title: string }) => t.title) || [];
        setTrendTopics(titles);
      }
    } catch { /* ignore */ } finally {
      setIsLoadingTrends(false);
    }
  };

  const loadRSSIdeas = async () => {
    setIsLoadingRSS(true);
    try {
      const res = await fetch("/api/trends/rss?limit=10");
      if (res.ok) {
        const data = await res.json();
        const items = (data.items || []).slice(0, 8).map(
          (item: { title: string; snippet?: string; category?: string }, i: number) => ({
            id: `rss-${Date.now()}-${i}`,
            title: item.title,
            content: item.snippet || item.title,
            category: item.category || "news",
            source: "rss" as const,
          })
        );
        setRssIdeas(items);
      }
    } catch { /* ignore */ } finally {
      setIsLoadingRSS(false);
    }
  };

  const useIdea = (idea: Idea) => {
    const params = new URLSearchParams({ prefill: idea.content });
    window.location.href = `/posts/new?${params.toString()}`;
  };

  const cardStyle = {
    background: "#0d1424",
    border: "1px solid rgba(168, 85, 247, 0.15)",
  };

  const getCategoryStyle = (cat: string) => {
    return CATEGORY_COLORS[cat.toLowerCase()] || CATEGORY_COLORS.general;
  };

  void hasBrand;

  return (
    <div className="space-y-6">
      {/* AI Idea Generator */}
      <Card style={cardStyle}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "#e2e8f0" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(168, 85, 247, 0.2)", border: "1px solid rgba(168, 85, 247, 0.3)" }}>
              <Brain className="h-4 w-4" style={{ color: "#a855f7" }} />
            </div>
            {t("aiIdeas")}
          </CardTitle>
          <CardDescription style={{ color: "#94a3b8" }}>{t("aiIdeasDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasAI && (
            <div className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: "rgba(251, 146, 60, 0.08)", border: "1px solid rgba(251, 146, 60, 0.2)" }}>
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#fb923c" }} />
              <p className="text-sm" style={{ color: "#94a3b8" }}>
                Kein KI-Anbieter konfiguriert. Bitte unter{" "}
                <a href="/settings" className="underline" style={{ color: "#a855f7" }}>Einstellungen → KI</a>{" "}
                Ollama oder Claude API einrichten.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder={t("topicPlaceholder")}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateIdeas()}
              className="flex-1 text-white placeholder:text-slate-300 h-11"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(168, 85, 247, 0.2)",
              }}
            />
            <Button
              onClick={() => generateIdeas()}
              disabled={isLoading}
              className="gap-2 h-11 text-white border-0"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                boxShadow: isLoading ? "none" : "0 0 16px rgba(124,58,237,0.4)",
              }}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isLoading ? "Generiere..." : t("generate")}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              Fehler: {error}
            </div>
          )}

          {ideas.length > 0 && (
            <div className="space-y-3">
              {ideas.map((idea) => {
                const catStyle = getCategoryStyle(idea.category);
                return (
                  <div
                    key={idea.id}
                    className="flex items-start gap-3 p-4 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(168, 85, 247, 0.1)",
                    }}
                  >
                    <Lightbulb className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: "#fbbf24" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{idea.title}</p>
                      <p className="text-sm mt-1 line-clamp-2" style={{ color: "#94a3b8" }}>{idea.content}</p>
                      <span
                        className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background: catStyle.bg, color: catStyle.text }}
                      >
                        {idea.category}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => useIdea(idea)}
                      className="gap-1 flex-shrink-0 text-white border-0"
                      style={{
                        background: "rgba(168, 85, 247, 0.2)",
                        border: "1px solid rgba(168, 85, 247, 0.3)",
                      }}
                    >
                      {t("useIdea")} <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
              <Button
                variant="ghost"
                className="w-full gap-2"
                style={{ color: "#94a3b8", border: "1px solid rgba(168,85,247,0.1)" }}
                onClick={() => generateIdeas()}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4" /> {t("generateMore")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trending Topics */}
      <Card style={cardStyle}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2" style={{ color: "#e2e8f0" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(251, 146, 60, 0.15)", border: "1px solid rgba(251, 146, 60, 0.25)" }}>
                  <TrendingUp className="h-4 w-4" style={{ color: "#fb923c" }} />
                </div>
                {t("trendingTopics")}
              </CardTitle>
              <CardDescription style={{ color: "#94a3b8" }}>{t("trendingDesc")}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadTrends}
              disabled={isLoadingTrends}
              style={{ color: "#94a3b8" }}
            >
              {isLoadingTrends ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTrends && trendTopics.length === 0 ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#94a3b8" }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Lade Trends...
            </div>
          ) : trendTopics.length === 0 ? (
            <div className="text-center py-6">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-60" style={{ color: "#fb923c" }} />
              <p className="text-sm mb-3" style={{ color: "#94a3b8" }}>Keine Trends verfügbar</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadTrends}
                className="gap-2"
                style={{ border: "1px solid rgba(168,85,247,0.2)", color: "#94a3b8" }}
              >
                <RefreshCw className="h-4 w-4" /> {t("loadTrends")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {trendTopics.map((tp, i) => (
                <button
                  key={i}
                  onClick={() => { setTopic(tp); generateIdeas(tp); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    background: i < 3 ? "rgba(251, 146, 60, 0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${i < 3 ? "rgba(251, 146, 60, 0.3)" : "rgba(168,85,247,0.15)"}`,
                    color: i < 3 ? "#fb923c" : "#94a3b8",
                  }}
                >
                  {i < 3 && <Zap className="h-3 w-3" />}
                  {tp}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RSS Inspiration */}
      <Card style={cardStyle}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2" style={{ color: "#e2e8f0" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(34, 211, 238, 0.12)", border: "1px solid rgba(34, 211, 238, 0.2)" }}>
                  <Rss className="h-4 w-4" style={{ color: "#22d3ee" }} />
                </div>
                {t("rssInspiration")}
              </CardTitle>
              <CardDescription style={{ color: "#94a3b8" }}>{t("rssDesc")}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadRSSIdeas}
              disabled={isLoadingRSS}
              style={{ color: "#94a3b8" }}
            >
              {isLoadingRSS ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingRSS && rssIdeas.length === 0 ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#94a3b8" }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Lade News-Feed...
            </div>
          ) : rssIdeas.length === 0 ? (
            <div className="text-center py-6">
              <Rss className="h-8 w-8 mx-auto mb-2 opacity-60" style={{ color: "#22d3ee" }} />
              <p className="text-sm mb-3" style={{ color: "#94a3b8" }}>Keine News verfügbar</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadRSSIdeas}
                className="gap-2"
                style={{ border: "1px solid rgba(168,85,247,0.2)", color: "#94a3b8" }}
              >
                <RefreshCw className="h-4 w-4" /> {t("loadRSS")}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {rssIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group hover:scale-[1.005]"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(34, 211, 238, 0.08)",
                  }}
                >
                  <Rss className="h-4 w-4 flex-shrink-0" style={{ color: "#22d3ee" }} />
                  <p className="flex-1 text-sm truncate" style={{ color: "#94a3b8" }}>{idea.title}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => useIdea(idea)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "#a855f7" }}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
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
