import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { format, type Locale } from "date-fns";
import { de, enUS, fr, es, pt } from "date-fns/locale";
import { getLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { POST_STATUS_KEYS, POST_STATUS_COLORS, PLATFORMS } from "@/lib/constants";
import type { PostStatus, Platform } from "@prisma/client";
import { deletePost, retryPost } from "@/actions/posts";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, RefreshCw, ImageIcon } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("posts");
  const tCommon = await getTranslations("common");
  const locale = await getLocale();
  const dateLocaleMap: Record<string, Locale> = { de, en: enUS, fr, es, pt };
  const dateLocale = dateLocaleMap[locale] || enUS;

  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id, userId: session.user.id },
    include: {
      targets: { include: { socialAccount: true } },
      analytics: true,
    },
  });

  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/posts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon("back")}
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{t("details")}</h1>
        </div>
        <div className="flex gap-2">
          {post.status === "FAILED" && (
            <form action={async () => {
              "use server";
              await retryPost(post.id);
            }}>
              <Button variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                {t("retry")}
              </Button>
            </form>
          )}
          {(post.status === "DRAFT" || post.status === "SCHEDULED") && (
            <Link href={`/posts/${post.id}/edit`}>
              <Button variant="outline" className="gap-2">
                <Pencil className="h-4 w-4" />
                {tCommon("edit")}
              </Button>
            </Link>
          )}
          <form action={async () => {
            "use server";
            await deletePost(post.id);
            redirect("/posts");
          }}>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              {tCommon("delete")}
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t("content")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-wrap">{post.content}</p>
            {post.imageUrl && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                  {t("image")}
                </div>
                <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border bg-muted">
                  <Image
                    src={post.imageUrl}
                    alt={t("postImage")}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>
            )}
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                  {t("media", { count: post.mediaUrls.length })}
                </div>
                <div className="grid grid-cols-2 gap-2 max-w-lg">
                  {post.mediaUrls.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                      {url.endsWith(".pdf") ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                          PDF
                        </div>
                      ) : (
                        <Image
                          src={url}
                          alt={`Media ${i + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("status")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                className={POST_STATUS_COLORS[post.status as PostStatus]}
              >
                {t(POST_STATUS_KEYS[post.status as PostStatus])}
              </Badge>
              {post.errorMsg && (
                <p className="mt-3 text-sm text-destructive">
                  {t("errorPrefix")}: {post.errorMsg}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("schedule")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">{t("scheduledFor")}</p>
                <p className="font-medium">
                  {post.scheduledAt
                    ? format(post.scheduledAt, "dd. MMM yyyy, HH:mm", {
                        locale: dateLocale,
                      })
                    : t("notScheduled")}
                </p>
              </div>
              {post.publishedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("publishedAt")}
                  </p>
                  <p className="font-medium">
                    {format(post.publishedAt, "dd. MMM yyyy, HH:mm", {
                      locale: dateLocale,
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">{t("createdAt")}</p>
                <p className="font-medium">
                  {format(post.createdAt, "dd. MMM yyyy, HH:mm", {
                    locale: dateLocale,
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("platforms")}</CardTitle>
            </CardHeader>
            <CardContent>
              {post.targets.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {tCommon("none")}
                </p>
              ) : (
                <div className="space-y-3">
                  {post.targets.map((target) => (
                    <div
                      key={target.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {PLATFORMS[target.socialAccount.platform as Platform]?.name ||
                            target.socialAccount.platform}
                        </Badge>
                        <span className="text-sm">
                          {target.socialAccount.accountName}
                        </span>
                      </div>
                      <Badge
                        className={
                          POST_STATUS_COLORS[target.status as PostStatus]
                        }
                      >
                        {t(POST_STATUS_KEYS[target.status as PostStatus])}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {post.analytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>{t("engagementData")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {post.analytics.map((analytic) => (
                <div key={analytic.id} className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {PLATFORMS[analytic.platform as Platform]?.name || analytic.platform}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">{tCommon("likes")}</p>
                      <p className="font-medium">{analytic.likes}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{tCommon("comments")}</p>
                      <p className="font-medium">{analytic.comments}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{tCommon("shares")}</p>
                      <p className="font-medium">{analytic.shares}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{tCommon("impressions")}</p>
                      <p className="font-medium">{analytic.impressions}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
