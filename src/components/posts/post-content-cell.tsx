"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileText, Film } from "lucide-react";

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
}

function isVideoUrl(url: string) {
  return /\.(mp4|mov|avi|webm)(\?|$)/i.test(url);
}

interface PostContentCellProps {
  content: string;
  imageUrl: string | null;
  mediaUrls: string[];
}

export function PostContentCell({
  content,
  imageUrl,
  mediaUrls,
}: PostContentCellProps) {
  const firstImage =
    imageUrl || mediaUrls.find((url) => isImageUrl(url)) || null;
  const hasVideo =
    !firstImage && mediaUrls.some((url) => isVideoUrl(url));
  const hasDoc = !firstImage && !hasVideo && mediaUrls.length > 0;

  const previewText =
    content.length > 80 ? `${content.substring(0, 80)}…` : content;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2.5 cursor-default min-w-0">
            {/* Thumbnail */}
            {firstImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={firstImage}
                alt=""
                className="w-10 h-10 object-cover rounded shrink-0 border border-border"
              />
            )}
            {hasVideo && (
              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center shrink-0 border border-border">
                <Film className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            {hasDoc && (
              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center shrink-0 border border-border">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
            )}

            {/* Truncated text */}
            <span className="truncate block text-sm">{previewText}</span>
          </div>
        </TooltipTrigger>

        <TooltipContent
          side="right"
          className="max-w-[420px] max-h-[320px] overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
