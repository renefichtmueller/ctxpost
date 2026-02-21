"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  Send,
  Globe,
  MoreHorizontal,
  Heart,
} from "lucide-react";
import Image from "next/image";

interface PostPreviewProps {
  content: string;
  imageUrl?: string | null;
  platforms: string[];
  accountName?: string;
}

function FacebookPreview({
  content,
  imageUrl,
  accountName,
  t,
}: {
  content: string;
  imageUrl?: string | null;
  accountName: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="text-[10px] bg-[#1877F2]/10 text-[#1877F2] border-0"
          >
            Facebook
          </Badge>
          <span className="text-xs text-muted-foreground">{t("preview")}</span>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="bg-white dark:bg-zinc-900 border rounded-lg mx-3 mb-3 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2.5 p-3">
            <div className="w-10 h-10 rounded-full bg-[#1877F2]/20 flex items-center justify-center">
              <span className="text-sm font-bold text-[#1877F2]">
                {accountName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{accountName}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{t("justNow")}</span>
                <span>·</span>
                <Globe className="h-3 w-3" />
              </div>
            </div>
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Content */}
          <div className="px-3 pb-2">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {content.length > 300 ? content.slice(0, 300) + "..." : content}
            </p>
          </div>

          {/* Image */}
          {imageUrl && (
            <div className="relative w-full aspect-video bg-muted">
              <Image
                src={imageUrl}
                alt={t("title")}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Engagement Bar */}
          <div className="border-t px-3 py-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground py-1">
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-[#1877F2] flex items-center justify-center">
                  <ThumbsUp className="h-2.5 w-2.5 text-white" />
                </span>
                0
              </span>
              <span>0 {t("comments")}</span>
            </div>
          </div>
          <div className="border-t flex">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
              <ThumbsUp className="h-4 w-4" />
              {t("like")}
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
              <MessageCircle className="h-4 w-4" />
              {t("comment")}
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
              <Share2 className="h-4 w-4" />
              {t("share")}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LinkedInPreview({
  content,
  imageUrl,
  accountName,
  t,
}: {
  content: string;
  imageUrl?: string | null;
  accountName: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="text-[10px] bg-[#0A66C2]/10 text-[#0A66C2] border-0"
          >
            LinkedIn
          </Badge>
          <span className="text-xs text-muted-foreground">{t("preview")}</span>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="bg-white dark:bg-zinc-900 border rounded-lg mx-3 mb-3 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2.5 p-3">
            <div className="w-12 h-12 rounded-full bg-[#0A66C2]/20 flex items-center justify-center">
              <span className="text-base font-bold text-[#0A66C2]">
                {accountName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{accountName}</p>
              <p className="text-xs text-muted-foreground">{t("justNow")}</p>
            </div>
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Content */}
          <div className="px-3 pb-2">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {content.length > 300 ? content.slice(0, 300) + "..." : content}
            </p>
          </div>

          {/* Image */}
          {imageUrl && (
            <div className="relative w-full aspect-video bg-muted">
              <Image
                src={imageUrl}
                alt={t("title")}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Engagement */}
          <div className="px-3 py-1.5 border-t">
            <div className="flex items-center gap-1 text-xs text-muted-foreground py-1">
              <Heart className="h-3 w-3 text-red-500" />
              <ThumbsUp className="h-3 w-3 text-[#0A66C2]" />
              <span>0</span>
            </div>
          </div>
          <div className="border-t flex">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
              <ThumbsUp className="h-4 w-4" />
              {t("like")}
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
              <MessageCircle className="h-4 w-4" />
              {t("comment")}
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
              <Share2 className="h-4 w-4" />
              {t("repost")}
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
              <Send className="h-4 w-4" />
              {t("send")}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PostPreview({
  content,
  imageUrl,
  platforms,
  accountName,
}: PostPreviewProps) {
  const t = useTranslations("preview");
  const tCommon = useTranslations("common");

  const displayName = accountName || tCommon("myAccount");

  if (!content.trim()) return null;

  const showFacebook = platforms.includes("FACEBOOK");
  const showLinkedIn = platforms.includes("LINKEDIN");

  if (!showFacebook && !showLinkedIn) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        {t("title")}
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        {showFacebook && (
          <FacebookPreview
            content={content}
            imageUrl={imageUrl}
            accountName={displayName}
            t={t}
          />
        )}
        {showLinkedIn && (
          <LinkedInPreview
            content={content}
            imageUrl={imageUrl}
            accountName={displayName}
            t={t}
          />
        )}
      </div>
    </div>
  );
}
