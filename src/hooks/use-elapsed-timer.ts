"use client";

import { useState, useRef, useCallback, useEffect } from "react";

function formatElapsed(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface TimerResult {
  elapsedMs: number;
  elapsedFormatted: string;
  isRunning: boolean;
  start: () => void;
  stop: () => number;
  reset: () => void;
}

export function useElapsedTimer(): TimerResult {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsRunning(true);
    setElapsedMs(0);
    intervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const finalElapsed = Date.now() - startTimeRef.current;
    setElapsedMs(finalElapsed);
    setIsRunning(false);
    return finalElapsed;
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setElapsedMs(0);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    elapsedMs,
    elapsedFormatted: formatElapsed(elapsedMs),
    isRunning,
    start,
    stop,
    reset,
  };
}

export { formatElapsed };
