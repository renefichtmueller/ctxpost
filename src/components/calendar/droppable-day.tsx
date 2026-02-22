"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";

interface DroppableDayProps {
  dayId: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isOver: boolean;
  isDragging: boolean;
  children: ReactNode;
}

export function DroppableDay({
  dayId,
  inCurrentMonth,
  isToday,
  isPast,
  isOver,
  isDragging,
  children,
}: DroppableDayProps) {
  const { setNodeRef } = useDroppable({
    id: dayId,
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative bg-card p-2 min-h-[80px] transition-colors duration-150 ${
        !inCurrentMonth ? "opacity-70" : ""
      } ${isToday ? "ring-2 ring-primary ring-inset" : ""} ${
        isPast ? "opacity-50 bg-muted/30" : ""
      } ${
        isOver && isDragging
          ? "bg-primary/10 ring-2 ring-primary ring-dashed ring-inset"
          : ""
      } ${isDragging && !isOver ? "hover:bg-muted/50" : ""}`}
    >
      {isPast && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 past-day-stripe" />
        </div>
      )}
      {children}
    </div>
  );
}
