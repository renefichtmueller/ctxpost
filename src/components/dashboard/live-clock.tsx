"use client";

import { useState, useEffect } from "react";

interface LiveClockProps {
  timezone?: string;
  locale?: string;
}

export function LiveClock({ timezone = "Europe/Berlin", locale = "de-DE" }: LiveClockProps) {
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: timezone,
        })
      );
      setDate(
        now.toLocaleDateString(locale, {
          weekday: "short",
          day: "numeric",
          month: "short",
          timeZone: timezone,
        })
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timezone, locale]);

  if (!time) return null; // Prevent hydration mismatch

  return (
    <div
      className="flex flex-col items-end shrink-0"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      <span
        className="text-lg font-black tracking-tight leading-none"
        style={{ color: "#e2e8f0", letterSpacing: "-0.02em" }}
      >
        {time}
      </span>
      <span
        className="text-[10px] mt-0.5 uppercase tracking-widest"
        style={{ color: "#475569" }}
      >
        {date}
      </span>
    </div>
  );
}
