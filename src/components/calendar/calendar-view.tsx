"use client";

import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  addMonths,
  subMonths,
} from "date-fns";
import { de, enUS, fr, es, pt, type Locale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { POST_STATUS_COLORS } from "@/lib/constants";
import type { PostStatus } from "@prisma/client";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface CalendarPost {
  id: string;
  content: string;
  scheduledAt: string | null;
  status: string;
  targets: Array<{
    id: string;
    platform: string;
    accountName: string;
  }>;
}

interface CalendarViewProps {
  posts: CalendarPost[];
  locale?: string;
}

const dateLocaleMap: Record<string, Locale> = { de, en: enUS, fr, es, pt };

export function CalendarView({ posts, locale = "en" }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const t = useTranslations("calendar");

  const dateLocale = dateLocaleMap[locale] || enUS;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: dateLocale });
  const calendarEnd = endOfWeek(monthEnd, { locale: dateLocale });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(calendarStart);
    day.setDate(calendarStart.getDate() + i);
    return format(day, "EEEEEE", { locale: dateLocale });
  });

  const getPostsForDay = (day: Date) => {
    return posts.filter((post) => {
      if (!post.scheduledAt) return false;
      return isSameDay(new Date(post.scheduledAt), day);
    });
  };

  const today = startOfDay(new Date());

  return (
    <Card style={{ background: "#0d1424", border: "1px solid rgba(168, 85, 247, 0.15)" }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            style={{ color: "#94a3b8" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold" style={{ color: "#e2e8f0" }}>
            {format(currentMonth, "MMMM yyyy", { locale: dateLocale })}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            style={{ color: "#94a3b8" }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="grid grid-cols-7 gap-px rounded-xl overflow-hidden"
          style={{ background: "rgba(168, 85, 247, 0.08)" }}
        >
          {weekDays.map((day, i) => (
            <div
              key={`header-${i}`}
              className="p-2 text-center text-xs font-semibold uppercase tracking-wider"
              style={{
                background: "#080e1a",
                color: "rgba(168, 85, 247, 0.6)"
              }}
            >
              {day}
            </div>
          ))}

          {days.map((day) => {
            const dayPosts = getPostsForDay(day);
            const inCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);
            const isPast = !isCurrentDay && isBefore(day, today);

            return (
              <div
                key={day.toISOString()}
                className="relative p-2 min-h-[80px] transition-colors"
                style={{
                  background: isCurrentDay
                    ? "rgba(124, 58, 237, 0.12)"
                    : isPast
                    ? "rgba(6, 11, 20, 0.95)"
                    : "rgba(13, 20, 36, 0.8)",
                  opacity: !inCurrentMonth ? 0.3 : 1,
                  outline: isCurrentDay ? "2px solid rgba(168, 85, 247, 0.4)" : "none",
                  outlineOffset: "-1px",
                }}
              >
                {isPast && inCurrentMonth && (
                  <>
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: "repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(239, 68, 68, 0.03) 5px, rgba(239, 68, 68, 0.03) 6px)"
                      }}
                    />
                    {dayPosts.length === 0 && (
                      <div className="absolute top-1.5 right-1.5 opacity-60">
                        <X className="w-3 h-3" style={{ color: "#ef4444" }} />
                      </div>
                    )}
                  </>
                )}

                <p
                  className="text-sm font-semibold mb-1 relative z-10"
                  style={{
                    color: isCurrentDay ? "#a855f7" : isPast ? "#1e293b" : "#94a3b8",
                  }}
                >
                  {format(day, "d")}
                </p>

                <div className="space-y-1 relative z-10">
                  {dayPosts.slice(0, 3).map((post) => (
                    <Link key={post.id} href={`/posts/${post.id}`}>
                      <div
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${
                          POST_STATUS_COLORS[post.status as PostStatus]
                        }`}
                      >
                        {post.content.substring(0, 18)}
                      </div>
                    </Link>
                  ))}
                  {dayPosts.length > 3 && (
                    <p className="text-[10px]" style={{ color: "#a855f7" }}>
                      +{dayPosts.length - 3} {t("more")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
