"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";

interface DroppableDayProps {
  dayId: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isOver: boolean;
  isDragging: boolean;
  children: ReactNode;
}

export function DroppableDay({
  dayId,
  inCurrentMonth,
  isToday,
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
      className={`bg-card p-2 min-h-[80px] transition-colors duration-150 ${
        !inCurrentMonth ? "opacity-40" : ""
      } ${isToday ? "ring-2 ring-primary ring-inset" : ""} ${
        isOver && isDragging
          ? "bg-primary/10 ring-2 ring-primary ring-dashed ring-inset"
          : ""
      } ${isDragging && !isOver ? "hover:bg-muted/50" : ""}`}
    >
      {children}
    </div>
  );
}
