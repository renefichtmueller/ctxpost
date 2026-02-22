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
  Zap,
  ArrowRight,
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

  const totalFollowers = socialAccounts.reduce(
    (sum, a) => sum + (a.followerCount || 0),
    0
  );

  const stats = [
    {
      label: t("totalPosts"),
      value: totalPosts,
      icon: PenSquare,
      color: "#a855f7",
      bg: "rgba(168, 85, 247, 0.1)",
      border: "rgba(168, 85, 247, 0.25)",
      glow: "rgba(168, 85, 247, 0.15)",
    },
    {
      label: t("scheduledPosts"),
      value: scheduledPosts,
      icon: Calendar,
      color: "#22d3ee",
      bg: "rgba(34, 211, 238, 0.08)",
      border: "rgba(34, 211, 238, 0.2)",
      glow: "rgba(34, 211, 238, 0.12)",
    },
    {
      label: t("publishedPosts"),
      value: publishedPosts,
      icon: CheckCircle,
      color: "#34d399",
      bg: "rgba(52, 211, 153, 0.08)",
      border: "rgba(52, 211, 153, 0.2)",
      glow: "rgba(52, 211, 153, 0.12)",
    },
    {
      label: t("connectedAccounts"),
      value: socialAccounts.length,
      icon: Link2,
      color: "#f472b6",
      bg: "rgba(244, 114, 182, 0.08)",
      border: "rgba(244, 114, 182, 0.2)",
      glow: "rgba(244, 114, 182, 0.12)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ background: "#34d399" }}
            />
            <span className="text-xs font-mono" style={{ color: "#94a3b8" }}>
              SYSTEM ONLINE
            </span>
          </div>
          <h1 className="text-3xl font-black text-white">{t("title")}</h1>
          <p style={{ color: "#94a3b8" }}>
            {t("welcome")},{" "}
            <span style={{ color: "#a855f7" }}>{session.user.name || "User"}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/ai-insights">
            <Button
              variant="outline"
              className="gap-2 text-sm"
              style={{
                background: "rgba(168,85,247,0.08)",
                border: "1px solid rgba(168,85,247,0.25)",
                color: "#c084fc",
              }}
            >
              <Sparkles className="h-4 w-4" />
              {tNav("aiInsights")}
            </Button>
          </Link>
          <Link href="/posts/new">
            <Button
              className="gap-2 text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                border: "none",
                boxShadow: "0 0 20px rgba(168,85,247,0.3)",
              }}
            >
              <Plus className="h-4 w-4" />
              {tNav("newPost")}
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="relative p-5 rounded-2xl overflow-hidden transition-all hover:scale-[1.02]"
            style={{
              background: "#0d1424",
              border: `1px solid ${stat.border}`,
              boxShadow: `0 0 30px ${stat.glow}`,
            }}
          >
            {/* Background glow orb */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 80% 20%, ${stat.bg} 0%, transparent 60%)`,
              }}
            />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="flex items-center justify-center h-10 w-10 rounded-xl"
                  style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
                >
                  <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
                <div
                  className="h-1.5 w-1.5 rounded-full mt-1"
                  style={{ background: stat.color, boxShadow: `0 0 6px ${stat.color}` }}
                />
              </div>
              <p
                className="text-3xl font-black mb-1"
                style={{ color: stat.color }}
              >
                {stat.value.toLocaleString()}
              </p>
              <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Total Followers Banner (if any) */}
      {totalFollowers > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(34,211,238,0.08) 100%)",
            border: "1px solid rgba(168,85,247,0.2)",
          }}
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-black" style={{ color: "#a855f7" }}>
                {totalFollowers.toLocaleString()}
              </p>
              <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{tCommon("totalFollowers")}</p>
            </div>
            <div>
              <p className="text-2xl font-black" style={{ color: "#22d3ee" }}>
                {socialAccounts.length}
              </p>
              <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{tCommon("platforms")}</p>
            </div>
            <div>
              <p className="text-2xl font-black" style={{ color: "#34d399" }}>
                {publishedPosts}
              </p>
              <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{t("publishedPosts")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Connected Accounts Overview */}
      {socialAccounts.length > 0 && (
        <Card style={{ background: "#0d1424", border: "1px solid rgba(168, 85, 247, 0.15)" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5" style={{ color: "#a855f7" }} />
              {tCommon("connectedAccountsTitle")}
            </CardTitle>
            <CardDescription style={{ color: "#94a3b8" }}>
              {totalFollowers > 0
                ? t("followerTotal", { count: totalFollowers.toLocaleString() })
                : tCommon("followerDataInfo")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {socialAccounts.map((account) => {
                const platformInfo = PLATFORMS[account.platform as Platform];
                return (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01]"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(168,85,247,0.1)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{
                        backgroundColor: platformInfo?.color || "#a855f7",
                        boxShadow: `0 0 12px ${platformInfo?.color || "#a855f7"}40`,
                      }}
                    >
                      {account.accountName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {account.accountName}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-[10px]"
                          style={{
                            backgroundColor: platformInfo?.color ? `${platformInfo.color}15` : "rgba(168,85,247,0.1)",
                            color: platformInfo?.color || "#a855f7",
                          }}
                        >
                          {platformInfo?.name || account.platform}
                        </Badge>
                        {account.accountType !== "profile" && (
                          <span className="text-[10px]" style={{ color: "#94a3b8" }}>
                            {account.accountType === "page" ? "Page" : account.accountType}
                          </span>
                        )}
                      </div>
                    </div>
                    {account.followerCount !== null && account.followerCount > 0 && (
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: "#a855f7" }}>
                          {account.followerCount.toLocaleString()}
                        </p>
                        <p className="text-[10px]" style={{ color: "#94a3b8" }}>
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
        <div
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
        >
          <AlertCircle className="h-6 w-6 shrink-0" style={{ color: "#f87171" }} />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {failedPosts} {failedPosts === 1 ? t("failedSingular") : t("failedPlural")}
            </p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>{t("failedHint")}</p>
          </div>
          <Link href="/posts?status=FAILED">
            <Button
              variant="outline"
              size="sm"
              style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", background: "rgba(239,68,68,0.08)" }}
            >
              {tCommon("show")}
            </Button>
          </Link>
        </div>
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
      <Card style={{ background: "#0d1424", border: "1px solid rgba(168, 85, 247, 0.15)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="h-5 w-5" style={{ color: "#22d3ee" }} />
            {t("upcomingPosts")}
          </CardTitle>
          <CardDescription style={{ color: "#94a3b8" }}>
            {t("upcomingDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20 text-white" />
              <p style={{ color: "#94a3b8" }}>{t("noScheduled")}</p>
              <Link href="/posts/new">
                <Button
                  variant="outline"
                  className="mt-3"
                  style={{ border: "1px solid rgba(168,85,247,0.25)", color: "#a855f7" }}
                >
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
                  className="flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.005]"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(168,85,247,0.1)",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{post.content}</p>
                    <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                      {post.scheduledAt
                        ? format(post.scheduledAt, "dd. MMM yyyy, HH:mm", { locale: dateLocale })
                        : t("noSchedule")}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-3 items-center">
                    {post.targets.map((target) => (
                      <Badge
                        key={target.id}
                        variant="secondary"
                        className="text-xs"
                        style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7" }}
                      >
                        {target.socialAccount.platform}
                      </Badge>
                    ))}
                    <Badge className={POST_STATUS_COLORS[post.status as PostStatus]}>
                      {tPosts(POST_STATUS_KEYS[post.status as PostStatus])}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 opacity-30 text-white" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Benchmarks Widget */}
      <BenchmarksWidget
        platforms={[...new Set(socialAccounts.map((a) => a.platform))]}
      />
    </div>
  );
}
