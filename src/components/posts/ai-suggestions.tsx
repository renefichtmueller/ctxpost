"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Sparkles, TrendingUp, Rss, ChevronDown, ChevronUp, Zap, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AISuggestionsProps {
  onSelectTopic: (topic: string) => void;
}

interface TrendingTopic {
  topic: string;
  count?: number;
}

interface RssItem {
  title: string;
  link: string;
  pubDate?: string;
}

type Tab = "trending" | "rss" | "generate";

const ANGLES = [
  "Teile deine Erfahrung mit diesem Thema",
  "Erkläre das Thema für Anfänger",
  "Gib 3 Profi-Tipps zu diesem Thema",
  "Stelle eine provokante Frage zu diesem Thema",
  "Teile eine Überraschung oder Kontra-Ansicht",
  "Erstelle einen motivierenden Post",
];

export function AISuggestions({ onSelectTopic }: AISuggestionsProps) {
  const t = useTranslations("posts");
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("trending");

  // Trending state
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  // RSS state
  const [rssItems, setRssItems] = useState<RssItem[]>([]);
  const [loadingRss, setLoadingRss] = useState(false);
  const [rssError, setRssError] = useState<string | null>(null);

  // Generate state
  const [selectedAngle, setSelectedAngle] = useState(ANGLES[0]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, startGenerate] = useTransition();
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const fetchTrends = async () => {
    setLoadingTrends(true);
    setTrendsError(null);
    try {
      const res = await fetch("/api/trends/google?limit=12");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTrends((data.trends || []).slice(0, 12));
    } catch (e) {
      setTrendsError("Trends konnten nicht geladen werden");
    } finally {
      setLoadingTrends(false);
    }
  };

  const fetchRss = async () => {
    setLoadingRss(true);
    setRssError(null);
    try {
      const res = await fetch("/api/trends/rss?limit=10");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRssItems((data.items || data.trendingTopics || []).slice(0, 8));
    } catch (e) {
      setRssError("RSS-Feed konnte nicht geladen werden");
    } finally {
      setLoadingRss(false);
    }
  };

  useEffect(() => {
    fetchTrends();
    fetchRss();
  }, []);

  const handleGenerate = () => {
    const prompt = customPrompt.trim() || selectedAngle;
    setGenerateError(null);
    setGeneratedText(null);
    startGenerate(async () => {
      try {
        const res = await fetch("/api/ai/generate-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, platforms: [] }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setGeneratedText(data.text || data.content || "");
      } catch (e) {
        setGenerateError("KI-Generierung fehlgeschlagen. Bitte Ollama/API prüfen.");
      }
    });
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "trending", label: "Trends", icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { id: "rss", label: "News", icon: <Rss className="h-3.5 w-3.5" /> },
    { id: "generate", label: "KI-Generator", icon: <Sparkles className="h-3.5 w-3.5" /> },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#0d1424", border: "1px solid rgba(168, 85, 247, 0.25)" }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-5 py-3.5 text-left transition-colors"
        style={{ borderBottom: isOpen ? "1px solid rgba(168, 85, 247, 0.12)" : "none" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center h-7 w-7 rounded-lg"
            style={{ background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.3)" }}
          >
            <Zap className="h-3.5 w-3.5" style={{ color: "#a855f7" }} />
          </div>
          <span className="font-semibold text-sm text-white">Content Suggestions</span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
            style={{ background: "rgba(34, 211, 238, 0.12)", color: "#22d3ee", border: "1px solid rgba(34, 211, 238, 0.2)" }}
          >
            AI
          </span>
          <span className="text-xs" style={{ color: "#94a3b8" }}>
            Ideen & Inspiration für deinen Post
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" style={{ color: "#94a3b8" }} />
        ) : (
          <ChevronDown className="h-4 w-4" style={{ color: "#94a3b8" }} />
        )}
      </button>

      {isOpen && (
        <div>
          {/* Tabs */}
          <div className="flex gap-1 px-4 pt-3 pb-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={
                  activeTab === tab.id
                    ? { background: "rgba(168, 85, 247, 0.18)", color: "#a855f7", border: "1px solid rgba(168, 85, 247, 0.3)" }
                    : { background: "transparent", color: "#94a3b8", border: "1px solid transparent" }
                }
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* TRENDING TAB */}
            {activeTab === "trending" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs" style={{ color: "#94a3b8" }}>
                    Klicke auf ein Thema, um es als Startpunkt zu nutzen
                  </p>
                  <button
                    type="button"
                    onClick={fetchTrends}
                    disabled={loadingTrends}
                    className="flex items-center gap-1 text-xs transition-colors"
                    style={{ color: "#a855f7" }}
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingTrends ? "animate-spin" : ""}`} />
                    Neu laden
                  </button>
                </div>
                {loadingTrends ? (
                  <div className="flex items-center gap-2 py-4 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#a855f7" }} />
                    <span className="text-xs" style={{ color: "#94a3b8" }}>Lade Trends...</span>
                  </div>
                ) : trendsError ? (
                  <div className="text-xs py-2 px-3 rounded-lg" style={{ background: "rgba(239, 68, 68, 0.08)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
                    {trendsError}
                  </div>
                ) : trends.length === 0 ? (
                  <div className="text-xs py-4 text-center" style={{ color: "#94a3b8" }}>
                    Keine Trends verfügbar
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {trends.map((topic, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onSelectTopic(typeof topic === "string" ? topic : topic.topic)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all hover:scale-105"
                        style={{ background: "rgba(168, 85, 247, 0.1)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.2)" }}
                      >
                        <TrendingUp className="h-3 w-3" />
                        {typeof topic === "string" ? topic : topic.topic}
                        <ArrowRight className="h-2.5 w-2.5 opacity-75" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* RSS TAB */}
            {activeTab === "rss" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs" style={{ color: "#94a3b8" }}>
                    Aktuelle News als Inspirationsquelle
                  </p>
                  <button
                    type="button"
                    onClick={fetchRss}
                    disabled={loadingRss}
                    className="flex items-center gap-1 text-xs transition-colors"
                    style={{ color: "#22d3ee" }}
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingRss ? "animate-spin" : ""}`} />
                    Neu laden
                  </button>
                </div>
                {loadingRss ? (
                  <div className="flex items-center gap-2 py-4 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#22d3ee" }} />
                    <span className="text-xs" style={{ color: "#94a3b8" }}>Lade News...</span>
                  </div>
                ) : rssError ? (
                  <div className="text-xs py-2 px-3 rounded-lg" style={{ background: "rgba(239, 68, 68, 0.08)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
                    {rssError}
                  </div>
                ) : rssItems.length === 0 ? (
                  <div className="text-xs py-4 text-center" style={{ color: "#94a3b8" }}>
                    Keine News verfügbar
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rssItems.map((item, i) => {
                      const title = typeof item === "string" ? item : (item as { topic?: string; title?: string }).topic || (item as { title?: string }).title || "";
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => onSelectTopic(title)}
                          className="w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all hover:scale-[1.01]"
                          style={{ background: "rgba(34, 211, 238, 0.06)", border: "1px solid rgba(34, 211, 238, 0.12)" }}
                        >
                          <Rss className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#22d3ee" }} />
                          <span className="text-xs text-white leading-relaxed line-clamp-2">{title}</span>
                          <ArrowRight className="h-3 w-3 mt-0.5 shrink-0 opacity-40 ml-auto" style={{ color: "#22d3ee" }} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* GENERATE TAB */}
            {activeTab === "generate" && (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: "#94a3b8" }}>
                  Lass die KI einen Post-Entwurf für dich generieren
                </p>

                {/* Angle selector */}
                <div>
                  <p className="text-xs font-medium text-white mb-2">Blickwinkel wählen:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ANGLES.map((angle, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setSelectedAngle(angle); setCustomPrompt(""); }}
                        className="px-2.5 py-1 rounded-lg text-xs transition-all"
                        style={
                          selectedAngle === angle && !customPrompt
                            ? { background: "rgba(168, 85, 247, 0.2)", color: "#a855f7", border: "1px solid rgba(168, 85, 247, 0.35)" }
                            : { background: "rgba(255,255,255,0.03)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.06)" }
                        }
                      >
                        {angle}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Or custom prompt */}
                <div>
                  <p className="text-xs font-medium text-white mb-1.5">Oder eigener Prompt:</p>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="z.B. Schreibe einen Post über KI-Tools für Solopreneure..."
                    rows={2}
                    className="w-full text-xs rounded-xl px-3 py-2 resize-none outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(168,85,247,0.2)",
                      color: "#e2e8f0",
                    }}
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  size="sm"
                  className="w-full text-xs font-semibold"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none" }}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                      KI generiert...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-2" />
                      Post generieren
                    </>
                  )}
                </Button>

                {generateError && (
                  <div className="text-xs py-2 px-3 rounded-lg" style={{ background: "rgba(239, 68, 68, 0.08)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
                    {generateError}
                  </div>
                )}

                {generatedText && (
                  <div
                    className="rounded-xl p-3 space-y-2"
                    style={{ background: "rgba(52, 211, 153, 0.06)", border: "1px solid rgba(52, 211, 153, 0.2)" }}
                  >
                    <p className="text-xs font-semibold" style={{ color: "#34d399" }}>Generierter Entwurf:</p>
                    <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">{generatedText}</p>
                    <button
                      type="button"
                      onClick={() => onSelectTopic(generatedText)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium w-full justify-center transition-all"
                      style={{ background: "rgba(52, 211, 153, 0.15)", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.3)" }}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      In Post-Feld übernehmen
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
