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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { POST_STATUS_KEYS, POST_STATUS_COLORS } from "@/lib/constants";
import type { PostStatus } from "@prisma/client";
import { deletePost } from "@/actions/posts";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("posts");
  const tCommon = await getTranslations("common");

  const locale = await getLocale();
  const dateLocaleMap: Record<string, Locale> = { de, en: enUS, fr, es, pt };
  const dateLocale = dateLocaleMap[locale] || enUS;

  const params = await searchParams;
  const statusFilter = params.status as PostStatus | undefined;

  const posts = await prisma.post.findMany({
    where: {
      userId: session.user.id,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      targets: { include: { socialAccount: true } },
    },
  });

  const statusOptions: PostStatus[] = [
    "DRAFT",
    "PENDING_REVIEW",
    "SCHEDULED",
    "PUBLISHING",
    "PUBLISHED",
    "FAILED",
  ];

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
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("newPost")}
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link href="/posts">
          <Button variant={!statusFilter ? "default" : "outline"} size="sm">
            {tCommon("all")}
          </Button>
        </Link>
        {statusOptions.map((status) => (
          <Link key={status} href={`/posts?status=${status}`}>
            <Button
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
            >
              {t(POST_STATUS_KEYS[status])}
            </Button>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {statusFilter
              ? t("statusPosts", { status: t(POST_STATUS_KEYS[statusFilter]) })
              : t("allPosts")}
          </CardTitle>
          <CardDescription>
            {t("postsFound", { count: posts.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t("noPosts")}</p>
              <Link href="/posts/new">
                <Button variant="outline" className="mt-3">
                  {t("createFirst")}
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("content")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("platforms")}</TableHead>
                  <TableHead>{t("scheduledFor")}</TableHead>
                  <TableHead className="text-right">{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-xs">
                      <Link
                        href={`/posts/${post.id}`}
                        className="hover:underline"
                      >
                        <span className="truncate block">
                          {post.content.length > 80
                            ? `${post.content.substring(0, 80)}...`
                            : post.content}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          POST_STATUS_COLORS[post.status as PostStatus]
                        }
                      >
                        {t(POST_STATUS_KEYS[post.status as PostStatus])}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {post.targets.map((target) => (
                          <Badge
                            key={target.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {target.socialAccount.platform}
                          </Badge>
                        ))}
                        {post.targets.length === 0 && (
                          <span className="text-xs text-muted-foreground">
                            {tCommon("none")}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {post.scheduledAt
                        ? format(post.scheduledAt, "dd. MMM yyyy, HH:mm", {
                            locale: dateLocale,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/posts/${post.id}`}>
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <form action={async () => {
                          "use server";
                          await deletePost(post.id);
                        }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
