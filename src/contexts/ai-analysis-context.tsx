"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useTranslations } from "next-intl";

// ─── Types ──────────────────────

interface AnalysisResult<T = unknown> {
  data: T | null;
  loading: boolean;
  progress: boolean;
  error: string | null;
  durationMs: number | null;
  serverDurationMs: number | null;
  modelUsed: string | null;
  date: string | null;
  elapsedMs: number;
  isRunning: boolean;
}

interface BestTimesData {
  recommendations: Array<{
    platform: string;
    bestDays: string[];
    bestTimeSlots: Array<{
      start: string;
      end: string;
      score: number;
      reason: string;
    }>;
  }>;
  confidenceLevel?: string;
  generalInsights?: string[];
}

interface SuggestionsData {
  suggestions: Array<{
    platform: string;
    improvedContent: string;
    reasoning: string;
    tips: string[];
  }>;
}

interface AIAnalysisContextType {
  bestTimes: AnalysisResult<BestTimesData>;
  suggestions: AnalysisResult<SuggestionsData>;
  startBestTimesAnalysis: () => void;
  startSuggestionsAnalysis: (content: string, platforms: string[]) => void;
  cancelBestTimes: () => void;
  cancelSuggestions: () => void;
  isAnyRunning: boolean;
}

const defaultResult: AnalysisResult = {
  data: null,
  loading: false,
  progress: false,
  error: null,
  durationMs: null,
  serverDurationMs: null,
  modelUsed: null,
  date: null,
  elapsedMs: 0,
  isRunning: false,
};

const AIAnalysisContext = createContext<AIAnalysisContextType | null>(null);

// ─── SSE Reader ──────────────────────

async function readSSEStream<T>(
  response: Response,
  onProgress: () => void,
  signal: AbortSignal
): Promise<{ data: T; durationMs?: number; modelUsed?: string }> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No streaming response");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal.aborted) throw new Error("Cancelled");

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const dataLine = line.trim();
        if (!dataLine.startsWith("data: ")) continue;

        try {
          const event = JSON.parse(dataLine.slice(6));

          if (event.type === "ping" || event.type === "progress") {
            onProgress();
            continue;
          }

          if (event.type === "error") {
            throw new Error(event.error || "Analysis failed");
          }

          if (event.type === "result") {
            return {
              data: event.data as T,
              durationMs: event.durationMs,
              modelUsed: event.modelUsed,
            };
          }
        } catch (e) {
          if (e instanceof Error && e.message !== "Analysis failed") {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
          throw e;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  throw new Error("Stream ended without result");
}

// ─── Provider ──────────────────────

export function AIAnalysisProvider({
  children,
  initialBestTimes,
  initialBestTimesDate,
  initialBestTimesDuration,
  initialBestTimesModel,
  initialSuggestions,
  initialSuggestionsDate,
  initialSuggestionsDuration,
  initialSuggestionsModel,
}: {
  children: React.ReactNode;
  initialBestTimes?: BestTimesData | null;
  initialBestTimesDate?: string | null;
  initialBestTimesDuration?: number | null;
  initialBestTimesModel?: string | null;
  initialSuggestions?: SuggestionsData | null;
  initialSuggestionsDate?: string | null;
  initialSuggestionsDuration?: number | null;
  initialSuggestionsModel?: string | null;
}) {
  const t = useTranslations("common");

  const [bestTimes, setBestTimes] = useState<AnalysisResult<BestTimesData>>({
    ...defaultResult,
    data: initialBestTimes || null,
    date: initialBestTimesDate || null,
    serverDurationMs: initialBestTimesDuration || null,
    modelUsed: initialBestTimesModel || null,
  });

  const [suggestions, setSuggestions] = useState<AnalysisResult<SuggestionsData>>({
    ...defaultResult,
    data: initialSuggestions || null,
    date: initialSuggestionsDate || null,
    serverDurationMs: initialSuggestionsDuration || null,
    modelUsed: initialSuggestionsModel || null,
  });

  const bestTimesAbortRef = useRef<AbortController | null>(null);
  const suggestionsAbortRef = useRef<AbortController | null>(null);
  const bestTimesStartRef = useRef<number>(0);
  const suggestionsStartRef = useRef<number>(0);
  const bestTimesIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const suggestionsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      bestTimesAbortRef.current?.abort();
      suggestionsAbortRef.current?.abort();
      if (bestTimesIntervalRef.current) clearInterval(bestTimesIntervalRef.current);
      if (suggestionsIntervalRef.current) clearInterval(suggestionsIntervalRef.current);
    };
  }, []);

  const cancelBestTimes = useCallback(() => {
    bestTimesAbortRef.current?.abort();
    if (bestTimesIntervalRef.current) {
      clearInterval(bestTimesIntervalRef.current);
      bestTimesIntervalRef.current = null;
    }
    setBestTimes((prev) => ({
      ...prev,
      loading: false,
      progress: false,
      isRunning: false,
      error: t("cancelled"),
    }));
  }, [t]);

  const cancelSuggestions = useCallback(() => {
    suggestionsAbortRef.current?.abort();
    if (suggestionsIntervalRef.current) {
      clearInterval(suggestionsIntervalRef.current);
      suggestionsIntervalRef.current = null;
    }
    setSuggestions((prev) => ({
      ...prev,
      loading: false,
      progress: false,
      isRunning: false,
      error: t("cancelled"),
    }));
  }, [t]);

  const startBestTimesAnalysis = useCallback(() => {
    // Cancel any existing
    bestTimesAbortRef.current?.abort();
    if (bestTimesIntervalRef.current) clearInterval(bestTimesIntervalRef.current);

    const abortController = new AbortController();
    bestTimesAbortRef.current = abortController;
    bestTimesStartRef.current = Date.now();

    setBestTimes((prev) => ({
      ...prev,
      loading: true,
      progress: false,
      error: null,
      durationMs: null,
      serverDurationMs: null,
      elapsedMs: 0,
      isRunning: true,
    }));

    // Elapsed timer
    bestTimesIntervalRef.current = setInterval(() => {
      setBestTimes((prev) =>
        prev.isRunning
          ? { ...prev, elapsedMs: Date.now() - bestTimesStartRef.current }
          : prev
      );
    }, 100);

    (async () => {
      try {
        const res = await fetch("/api/ai/best-times", {
          signal: abortController.signal,
        });

        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          throw new Error(data.error || "Analysis failed");
        }

        if (!res.ok) {
          throw new Error(t("serverError", { status: res.status.toString() }));
        }

        const result = await readSSEStream<BestTimesData>(
          res,
          () => setBestTimes((prev) => ({ ...prev, progress: true })),
          abortController.signal
        );

        const finalMs = Date.now() - bestTimesStartRef.current;
        if (bestTimesIntervalRef.current) {
          clearInterval(bestTimesIntervalRef.current);
          bestTimesIntervalRef.current = null;
        }

        setBestTimes({
          data: result.data,
          loading: false,
          progress: false,
          error: null,
          durationMs: finalMs,
          serverDurationMs: result.durationMs || null,
          modelUsed: result.modelUsed || null,
          date: new Date().toISOString(),
          elapsedMs: finalMs,
          isRunning: false,
        });
      } catch (err) {
        if (bestTimesIntervalRef.current) {
          clearInterval(bestTimesIntervalRef.current);
          bestTimesIntervalRef.current = null;
        }
        if (abortController.signal.aborted) return;
        setBestTimes((prev) => ({
          ...prev,
          loading: false,
          progress: false,
          isRunning: false,
          error: err instanceof Error ? err.message : t("unknownError"),
        }));
      }
    })();
  }, [t]);

  const startSuggestionsAnalysis = useCallback(
    (content: string, platforms: string[]) => {
      // Cancel any existing
      suggestionsAbortRef.current?.abort();
      if (suggestionsIntervalRef.current) clearInterval(suggestionsIntervalRef.current);

      const abortController = new AbortController();
      suggestionsAbortRef.current = abortController;
      suggestionsStartRef.current = Date.now();

      setSuggestions((prev) => ({
        ...prev,
        loading: true,
        progress: false,
        error: null,
        durationMs: null,
        serverDurationMs: null,
        elapsedMs: 0,
        isRunning: true,
      }));

      // Elapsed timer
      suggestionsIntervalRef.current = setInterval(() => {
        setSuggestions((prev) =>
          prev.isRunning
            ? { ...prev, elapsedMs: Date.now() - suggestionsStartRef.current }
            : prev
        );
      }, 100);

      (async () => {
        try {
          const res = await fetch("/api/ai/content-suggestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, platforms }),
            signal: abortController.signal,
          });

          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const data = await res.json();
            throw new Error(data.error || "Suggestions could not be loaded");
          }

          if (!res.ok) {
            throw new Error(t("serverError", { status: res.status.toString() }));
          }

          const result = await readSSEStream<SuggestionsData>(
            res,
            () => setSuggestions((prev) => ({ ...prev, progress: true })),
            abortController.signal
          );

          const finalMs = Date.now() - suggestionsStartRef.current;
          if (suggestionsIntervalRef.current) {
            clearInterval(suggestionsIntervalRef.current);
            suggestionsIntervalRef.current = null;
          }

          setSuggestions({
            data: result.data,
            loading: false,
            progress: false,
            error: null,
            durationMs: finalMs,
            serverDurationMs: result.durationMs || null,
            modelUsed: result.modelUsed || null,
            date: new Date().toISOString(),
            elapsedMs: finalMs,
            isRunning: false,
          });
        } catch (err) {
          if (suggestionsIntervalRef.current) {
            clearInterval(suggestionsIntervalRef.current);
            suggestionsIntervalRef.current = null;
          }
          if (abortController.signal.aborted) return;
          setSuggestions((prev) => ({
            ...prev,
            loading: false,
            progress: false,
            isRunning: false,
            error: err instanceof Error ? err.message : t("unknownError"),
          }));
        }
      })();
    },
    [t]
  );

  const isAnyRunning = bestTimes.isRunning || suggestions.isRunning;

  return (
    <AIAnalysisContext.Provider
      value={{
        bestTimes,
        suggestions,
        startBestTimesAnalysis,
        startSuggestionsAnalysis,
        cancelBestTimes,
        cancelSuggestions,
        isAnyRunning,
      }}
    >
      {children}
    </AIAnalysisContext.Provider>
  );
}

export function useAIAnalysis() {
  const ctx = useContext(AIAnalysisContext);
  if (!ctx) {
    throw new Error("useAIAnalysis must be used within AIAnalysisProvider");
  }
  return ctx;
}
