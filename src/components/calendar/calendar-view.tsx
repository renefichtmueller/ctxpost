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
  addMonths,
  subMonths,
} from "date-fns";
import { de, enUS, fr, es, pt, type Locale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { POST_STATUS_COLORS } from "@/lib/constants";
import type { PostStatus } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  // Generate weekday headers from locale
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {format(currentMonth, "MMMM yyyy", { locale: dateLocale })}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
          {weekDays.map((day, i) => (
            <div
              key={`header-${i}`}
              className="bg-card p-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {days.map((day) => {
            const dayPosts = getPostsForDay(day);
            const inCurrentMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`bg-card p-2 min-h-[80px] ${
                  !inCurrentMonth ? "opacity-40" : ""
                } ${today ? "ring-2 ring-primary ring-inset" : ""}`}
              >
                <p
                  className={`text-sm font-medium mb-1 ${
                    today
                      ? "text-primary font-bold"
                      : "text-foreground"
                  }`}
                >
                  {format(day, "d")}
                </p>
                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map((post) => (
                    <Link key={post.id} href={`/posts/${post.id}`}>
                      <div
                        className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${
                          POST_STATUS_COLORS[post.status as PostStatus]
                        }`}
                      >
                        {post.content.substring(0, 20)}
                      </div>
                    </Link>
                  ))}
                  {dayPosts.length > 3 && (
                    <p className="text-xs text-muted-foreground">
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
