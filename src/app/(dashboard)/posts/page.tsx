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
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { PostContentCell } from "@/components/posts/post-content-cell";

type SortKey = "scheduled_asc" | "scheduled_desc" | "created_desc";

function buildHref(status: string | undefined, sort: string) {
  const parts: string[] = [];
  if (status) parts.push(`status=${status}`);
  parts.push(`sort=${sort}`);
  return `/posts?${parts.join("&")}`;
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string }>;
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
  const sortParam = (params.sort || "created_desc") as SortKey;

  // Build orderBy based on sort param
  const orderBy =
    sortParam === "scheduled_asc"
      ? { scheduledAt: "asc" as const }
      : sortParam === "scheduled_desc"
        ? { scheduledAt: "desc" as const }
        : { createdAt: "desc" as const };

  const posts = await prisma.post.findMany({
    where: {
      userId: session.user.id,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy,
    include: {
      targets: { include: { socialAccount: true } },
    },
    // include imageUrl and mediaUrls (already on the model)
  });

  const statusOptions: PostStatus[] = [
    "DRAFT",
    "PENDING_REVIEW",
    "SCHEDULED",
    "PUBLISHING",
    "PUBLISHED",
    "FAILED",
  ];

  // Sort toggle logic for "Geplant für" header
  const nextDateSort: SortKey =
    sortParam === "scheduled_asc" ? "scheduled_desc" : "scheduled_asc";
  const dateSortHref = buildHref(statusFilter, nextDateSort);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/posts/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("newPost")}
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link href={sortParam !== "created_desc" ? `/posts?sort=${sortParam}` : "/posts"}>
          <Button variant={!statusFilter ? "default" : "outline"} size="sm">
            {tCommon("all")}
          </Button>
        </Link>
        {statusOptions.map((status) => (
          <Link
            key={status}
            href={buildHref(status, sortParam)}
          >
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
                  {/* Sortable date column */}
                  <TableHead>
                    <Link
                      href={dateSortHref}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer select-none"
                    >
                      {t("scheduledFor")}
                      {sortParam === "scheduled_asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-primary" />
                      ) : sortParam === "scheduled_desc" ? (
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </Link>
                  </TableHead>
                  <TableHead className="text-right">{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    {/* Content cell with thumbnail + tooltip */}
                    <TableCell className="max-w-xs">
                      <Link href={`/posts/${post.id}`} className="hover:opacity-80 transition-opacity">
                        <PostContentCell
                          content={post.content}
                          imageUrl={post.imageUrl ?? null}
                          mediaUrls={post.mediaUrls ?? []}
                        />
                      </Link>
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={POST_STATUS_COLORS[post.status as PostStatus]}
                      >
                        {t(POST_STATUS_KEYS[post.status as PostStatus])}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
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

                    <TableCell className="tabular-nums text-sm">
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
                        <form
                          action={async () => {
                            "use server";
                            await deletePost(post.id);
                          }}
                        >
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
