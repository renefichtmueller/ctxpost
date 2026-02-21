import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLATFORMS, POST_STATUS_KEYS, POST_STATUS_COLORS } from "@/lib/constants";
import {
  PenSquare,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  Sparkles,
  Users,
  Link2,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { format, type Locale } from "date-fns";
import { de, enUS, fr, es, pt } from "date-fns/locale";
import type { PostStatus, Platform } from "@prisma/client";
import { getTranslations, getLocale } from "next-intl/server";
import { TrendsWidget } from "@/components/dashboard/trends-widget";
import { BenchmarksWidget } from "@/components/dashboard/benchmarks-widget";
import { CalendarMiniWidget } from "@/components/dashboard/calendar-mini-widget";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("dashboard");
  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const tPosts = await getTranslations("posts");

  const locale = await getLocale();
  const dateLocaleMap: Record<string, Locale> = { de, en: enUS, fr, es, pt };
  const dateLocale = dateLocaleMap[locale] || enUS;

  const [
    totalPosts,
    scheduledPosts,
    publishedPosts,
    failedPosts,
    upcoming,
    socialAccounts,
  ] = await Promise.all([
    prisma.post.count({ where: { userId: session.user.id } }),
    prisma.post.count({
      where: { userId: session.user.id, status: "SCHEDULED" },
    }),
    prisma.post.count({
      where: { userId: session.user.id, status: "PUBLISHED" },
    }),
    prisma.post.count({
      where: { userId: session.user.id, status: "FAILED" },
    }),
    prisma.post.findMany({
      where: {
        userId: session.user.id,
        status: "SCHEDULED",
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
      include: {
        targets: { include: { socialAccount: true } },
      },
    }),
    prisma.socialAccount.findMany({
      where: { userId: session.user.id, isActive: true },
      select: {
        id: true,
        platform: true,
        accountName: true,
        accountType: true,
        avatarUrl: true,
        followerCount: true,
        followingCount: true,
        postsCount: true,
      },
    }),
  ]);

  const stats = [
    {
      label: t("totalPosts"),
      value: totalPosts,
      icon: PenSquare,
      color: "text-foreground",
    },
    {
      label: t("scheduledPosts"),
      value: scheduledPosts,
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      label: t("publishedPosts"),
      value: publishedPosts,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      label: t("connectedAccounts"),
      value: socialAccounts.length,
      icon: Link2,
      color: "text-purple-600",
    },
  ];

  // Calculate total followers across all accounts
  const totalFollowers = socialAccounts.reduce(
    (sum, a) => sum + (a.followerCount || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("welcome")}, {session.user.name || "User"}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/ai-insights">
            <Button variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              {tNav("aiInsights")}
            </Button>
          </Link>
          <Link href="/posts/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {tNav("newPost")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connected Accounts Overview */}
      {socialAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {tCommon("connectedAccountsTitle")}
            </CardTitle>
            <CardDescription>
              {totalFollowers > 0
                ? t("followerTotal", { count: totalFollowers.toLocaleString() })
                : tCommon("followerDataInfo")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {socialAccounts.map((account) => {
                const platformInfo =
                  PLATFORMS[account.platform as Platform];
                return (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{
                        backgroundColor: platformInfo?.color || "#666",
                      }}
                    >
                      {account.accountName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {account.accountName}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-[10px]"
                          style={{
                            backgroundColor: platformInfo?.color
                              ? `${platformInfo.color}15`
                              : undefined,
                            color: platformInfo?.color,
                          }}
                        >
                          {platformInfo?.name || account.platform}
                        </Badge>
                        {account.accountType !== "profile" && (
                          <span className="text-[10px] text-muted-foreground">
                            {account.accountType === "page"
                              ? "Page"
                              : account.accountType}
                          </span>
                        )}
                      </div>
                    </div>
                    {account.followerCount !== null &&
                      account.followerCount > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {account.followerCount.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {tCommon("follower")}
                          </p>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed posts alert */}
      {failedPosts > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {failedPosts}{" "}
                  {failedPosts === 1
                    ? t("failedSingular")
                    : t("failedPlural")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("failedHint")}
                </p>
              </div>
              <Link href="/posts?status=FAILED">
                <Button variant="outline" size="sm">
                  {tCommon("show")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trends Widget (2/3) + Calendar Mini Widget (1/3) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendsWidget />
        </div>
        <div className="lg:col-span-1">
          <CalendarMiniWidget />
        </div>
      </div>

      {/* Upcoming Posts */}
      <Card>
        <CardHeader>
          <CardTitle>{t("upcomingPosts")}</CardTitle>
          <CardDescription>
            {t("upcomingDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t("noScheduled")}</p>
              <Link href="/posts/new">
                <Button variant="outline" className="mt-3">
                  {t("createPost")}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{post.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {post.scheduledAt
                        ? format(post.scheduledAt, "dd. MMM yyyy, HH:mm", {
                            locale: dateLocale,
                          })
                        : t("noSchedule")}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-3">
                    {post.targets.map((target) => (
                      <Badge
                        key={target.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {target.socialAccount.platform}
                      </Badge>
                    ))}
                    <Badge
                      className={
                        POST_STATUS_COLORS[post.status as PostStatus]
                      }
                    >
                      {tPosts(POST_STATUS_KEYS[post.status as PostStatus])}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick engagement stats */}
      {totalFollowers > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {tCommon("reach")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">
                  {totalFollowers.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tCommon("totalFollowers")}
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {socialAccounts.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tCommon("platforms")}
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold">{publishedPosts}</p>
                <p className="text-xs text-muted-foreground">
                  {t("publishedPosts")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benchmarks Widget */}
      <BenchmarksWidget
        platforms={[...new Set(socialAccounts.map((a) => a.platform))]}
      />
    </div>
  );
}
