"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { POST_STATUS_COLORS } from "@/lib/constants";
import type { PostStatus } from "@prisma/client";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import type { CalendarPost } from "./drag-drop-calendar";

interface DraggablePostProps {
  post: CalendarPost;
  canDrag: boolean;
}

export function DraggablePost({ post, canDrag }: DraggablePostProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: post.id,
      disabled: !canDrag,
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  if (!canDrag) {
    return (
      <Link href={`/posts/${post.id}`}>
        <div
          className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${
            POST_STATUS_COLORS[post.status as PostStatus]
          }`}
        >
          {post.content.substring(0, 20)}
        </div>
      </Link>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group text-xs px-1 py-0.5 rounded truncate flex items-center gap-0.5 ${
        POST_STATUS_COLORS[post.status as PostStatus]
      } ${isDragging ? "opacity-60" : "hover:opacity-80"} ${
        canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      }`}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
      <Link
        href={`/posts/${post.id}`}
        className="truncate flex-1"
        onClick={(e) => {
          // Prevent navigation when dragging
          if (isDragging) {
            e.preventDefault();
          }
        }}
      >
        {post.content.substring(0, 20)}
      </Link>
    </div>
  );
}
