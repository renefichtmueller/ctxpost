"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
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
  setHours,
  setMinutes,
} from "date-fns";
import { de, enUS, fr, es, pt, type Locale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { POST_STATUS_COLORS } from "@/lib/constants";
import type { PostStatus } from "@prisma/client";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { reschedulePost } from "@/actions/calendar";
import { toast } from "sonner";
import { DraggablePost } from "./draggable-post";
import { DroppableDay } from "./droppable-day";

export interface CalendarPost {
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

interface DragDropCalendarProps {
  posts: CalendarPost[];
  locale?: string;
}

const dateLocaleMap: Record<string, Locale> = { de, en: enUS, fr, es, pt };

export function DragDropCalendar({ posts: initialPosts, locale = "en" }: DragDropCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [posts, setPosts] = useState<CalendarPost[]>(initialPosts);
  const [activePost, setActivePost] = useState<CalendarPost | null>(null);
  const [overDayId, setOverDayId] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const t = useTranslations("calendar");

  const dateLocale = dateLocaleMap[locale] || enUS;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  const getPostsForDay = useCallback(
    (day: Date) => {
      return posts.filter((post) => {
        if (!post.scheduledAt) return false;
        return isSameDay(new Date(post.scheduledAt), day);
      });
    },
    [posts]
  );

  const canDrag = (post: CalendarPost) => {
    return ["DRAFT", "SCHEDULED", "PENDING_REVIEW"].includes(post.status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const postId = event.active.id as string;
    const post = posts.find((p) => p.id === postId);
    if (post) {
      setActivePost(post);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id as string | null;
    setOverDayId(overId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePost(null);
    setOverDayId(null);

    if (!over) return;

    const postId = active.id as string;
    const targetDayStr = over.id as string;
    const post = posts.find((p) => p.id === postId);

    if (!post || !post.scheduledAt) return;

    const targetDay = new Date(targetDayStr);
    const currentDate = new Date(post.scheduledAt);

    // If dropped on the same day, do nothing
    if (isSameDay(currentDate, targetDay)) return;

    // Preserve the original time, just change the date
    const newDate = setMinutes(
      setHours(targetDay, currentDate.getHours()),
      currentDate.getMinutes()
    );

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, scheduledAt: newDate.toISOString() } : p
      )
    );

    setIsRescheduling(true);

    try {
      const result = await reschedulePost(postId, newDate.toISOString());
      if (result.error) {
        // Revert on error
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, scheduledAt: post.scheduledAt } : p
          )
        );
        toast.error(result.error);
      } else {
        toast.success(
          t("rescheduled", {
            date: format(newDate, "PPP", { locale: dateLocale }),
          })
        );
      }
    } catch {
      // Revert on error
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, scheduledAt: post.scheduledAt } : p
        )
      );
      toast.error(t("rescheduleError"));
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleDragCancel = () => {
    setActivePost(null);
    setOverDayId(null);
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
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              {format(currentMonth, "MMMM yyyy", { locale: dateLocale })}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("dragHint")}
            </p>
          </div>
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
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
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
              const dayId = format(day, "yyyy-MM-dd");
              const isOver = overDayId === dayId;

              return (
                <DroppableDay
                  key={day.toISOString()}
                  dayId={dayId}
                  inCurrentMonth={inCurrentMonth}
                  isToday={today}
                  isOver={isOver}
                  isDragging={activePost !== null}
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
                      <DraggablePost
                        key={post.id}
                        post={post}
                        canDrag={canDrag(post)}
                      />
                    ))}
                    {dayPosts.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{dayPosts.length - 3} {t("more")}
                      </p>
                    )}
                  </div>
                </DroppableDay>
              );
            })}
          </div>

          <DragOverlay dropAnimation={null}>
            {activePost ? (
              <div
                className={`text-xs px-2 py-1 rounded shadow-lg border-2 border-primary flex items-center gap-1 max-w-[180px] ${
                  POST_STATUS_COLORS[activePost.status as PostStatus]
                }`}
              >
                <GripVertical className="h-3 w-3 shrink-0 opacity-50" />
                <span className="truncate">{activePost.content.substring(0, 30)}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {isRescheduling && (
          <div className="mt-2 text-center">
            <p className="text-sm text-muted-foreground animate-pulse">
              {t("saving")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
