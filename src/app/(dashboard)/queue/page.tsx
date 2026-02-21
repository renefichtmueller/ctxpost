import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format, type Locale } from "date-fns";
import { de, enUS, fr, es, pt } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { POST_STATUS_KEYS, POST_STATUS_COLORS, PLATFORMS } from "@/lib/constants";
import type { PostStatus, Platform } from "@prisma/client";
import Link from "next/link";
import { Clock, ListOrdered } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";

export default async function QueuePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("queue");
  const tNav = await getTranslations("nav");
  const tDashboard = await getTranslations("dashboard");
  const tPosts = await getTranslations("posts");

  const locale = await getLocale();
  const dateLocaleMap: Record<string, Locale> = { de, en: enUS, fr, es, pt };
  const dateLocale = dateLocaleMap[locale] || enUS;

  const posts = await prisma.post.findMany({
    where: {
      userId: session.user.id,
      status: "SCHEDULED",
      scheduledAt: { gte: new Date() },
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      targets: { include: { socialAccount: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <Link href="/posts/new">
          <Button className="gap-2">{tNav("newPost")}</Button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <ListOrdered className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">
                  {t("empty")}
                </h3>
                <p className="text-muted-foreground">
                  {t("emptyDesc")}
                </p>
              </div>
              <Link href="/posts/new">
                <Button>{tDashboard("createPost")}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <Link
                  href={`/posts/${post.id}`}
                  className="block hover:bg-muted/30 -m-4 p-4 rounded-lg transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {post.scheduledAt
                            ? format(
                                post.scheduledAt,
                                "dd. MMM yyyy, HH:mm",
                                { locale: dateLocale }
                              )
                            : t("notScheduled")}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        className={
                          POST_STATUS_COLORS[post.status as PostStatus]
                        }
                      >
                        {tPosts(POST_STATUS_KEYS[post.status as PostStatus])}
                      </Badge>
                      <div className="flex gap-1">
                        {post.targets.map((target) => (
                          <Badge
                            key={target.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {PLATFORMS[target.socialAccount.platform as Platform]?.name ||
                              target.socialAccount.platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
