import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLATFORMS, POST_STATUS_KEYS, POST_STATUS_COLORS } from "@/lib/constants";
import {
  PenSquare,
  Calendar,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Link2,
  Zap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { format, type Locale } from "date-fns";
import { de, enUS, fr, es, pt } from "date-fns/locale";
import type { PostStatus, Platform } from "@prisma/client";
import { getTranslations, getLocale } from "next-intl/server";
import { TrendsWidget } from "@/components/dashboard/trends-widget";
import { CalendarMiniWidget } from "@/components/dashboard/calendar-mini-widget";
import { QuickComposerCard } from "@/components/dashboard/quick-composer-card";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("dashboard");
  const tNav = await getTranslations("nav");
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
    prisma.post.count({ where: { userId: session.user.id, status: "SCHEDULED" } }),
    prisma.post.count({ where: { userId: session.user.id, status: "PUBLISHED" } }),
    prisma.post.count({ where: { userId: session.user.id, status: "FAILED" } }),
    prisma.post.findMany({
      where: { userId: session.user.id, status: "SCHEDULED", scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: "asc" },
      take: 4,
      include: { targets: { include: { socialAccount: true } } },
    }),
    prisma.socialAccount.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { id: true, platform: true, accountName: true, accountType: true, avatarUrl: true, followerCount: true },
    }),
  ]);

  const totalFollowers = socialAccounts.reduce((sum, a) => sum + (a.followerCount || 0), 0);

  const stats = [
    { label: t("totalPosts"), value: totalPosts, icon: PenSquare, color: "#a855f7", border: "rgba(168,85,247,0.25)", bg: "rgba(168,85,247,0.08)" },
    { label: t("scheduledPosts"), value: scheduledPosts, icon: Calendar, color: "#22d3ee", border: "rgba(34,211,238,0.2)", bg: "rgba(34,211,238,0.06)" },
    { label: t("publishedPosts"), value: publishedPosts, icon: CheckCircle, color: "#34d399", border: "rgba(52,211,153,0.2)", bg: "rgba(52,211,153,0.06)" },
    { label: t("connectedAccounts"), value: socialAccounts.length, icon: Link2, color: "#f472b6", border: "rgba(244,114,182,0.2)", bg: "rgba(244,114,182,0.06)" },
  ];

  return (
    <div className="space-y-5">

      {/* Header — slim */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#34d399" }} />
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "#94a3b8" }}>ONLINE</span>
          </div>
          <h1 className="text-2xl font-black text-white">
            {t("welcome")}, <span style={{ color: "#a855f7" }}>{session.user.name?.split(" ")[0] || "Hi"}</span> 👋
          </h1>
        </div>
        <Link href="/ai-insights">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.2)", color: "#c084fc" }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {tNav("aiInsights")}
          </Button>
        </Link>
      </div>

      {/* ── QUICK COMPOSER (Hero) ── */}
      <QuickComposerCard
        connectedAccounts={socialAccounts.map((a) => ({
          id: a.id,
          platform: a.platform,
          accountName: a.accountName,
        }))}
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-2xl transition-all hover:scale-[1.02] relative overflow-hidden"
            style={{ background: "#0d1424", border: `1px solid ${stat.border}` }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 80% 20%, ${stat.bg} 0%, transparent 60%)` }}
            />
            <div className="relative">
              <div
                className="inline-flex items-center justify-center h-8 w-8 rounded-xl mb-2"
                style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
              >
                <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-black" style={{ color: stat.color }}>
                {stat.value.toLocaleString()}
              </p>
              <p className="text-xs font-medium mt-0.5" style={{ color: "#94a3b8" }}>
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Followers + Platforms Banner (if any) */}
      {totalFollowers > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(34,211,238,0.06))", border: "1px solid rgba(168,85,247,0.15)" }}
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-black" style={{ color: "#a855f7" }}>{totalFollowers.toLocaleString()}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>Follower gesamt</p>
            </div>
            <div>
              <p className="text-xl font-black" style={{ color: "#22d3ee" }}>{socialAccounts.length}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>Accounts</p>
            </div>
            <div>
              <p className="text-xl font-black" style={{ color: "#34d399" }}>{publishedPosts}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>Veröffentlicht</p>
            </div>
          </div>
        </div>
      )}

      {/* Failed alert */}
      {failedPosts > 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <AlertCircle className="h-5 w-5 shrink-0" style={{ color: "#f87171" }} />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {failedPosts} {failedPosts === 1 ? t("failedSingular") : t("failedPlural")}
            </p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>{t("failedHint")}</p>
          </div>
          <Link href="/posts?status=FAILED">
            <Button variant="outline" size="sm" style={{ border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", background: "rgba(239,68,68,0.06)" }}>
              Ansehen
            </Button>
          </Link>
        </div>
      )}

      {/* Trends + Mini Calendar */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendsWidget />
        </div>
        <div className="lg:col-span-1">
          <CalendarMiniWidget />
        </div>
      </div>

      {/* Upcoming Posts */}
      {upcoming.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#0d1424", border: "1px solid rgba(168,85,247,0.12)" }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(168,85,247,0.08)" }}>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" style={{ color: "#22d3ee" }} />
              <span className="font-semibold text-white text-sm">{t("upcomingPosts")}</span>
            </div>
            <Link href="/queue">
              <Button variant="ghost" size="sm" className="text-xs gap-1" style={{ color: "#94a3b8" }}>
                Alle <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="p-4 space-y-2">
            {upcoming.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.005]"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(168,85,247,0.08)" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{post.content}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                    {post.scheduledAt
                      ? format(post.scheduledAt, "dd. MMM, HH:mm", { locale: dateLocale })
                      : "—"}
                  </p>
                </div>
                <div className="flex gap-1.5 ml-3 items-center">
                  {post.targets.slice(0, 3).map((target) => (
                    <Badge key={target.id} variant="secondary" className="text-[10px]"
                      style={{ background: "rgba(168,85,247,0.08)", color: "#a855f7" }}>
                      {PLATFORMS[target.socialAccount.platform as Platform]?.name?.substring(0, 2) || target.socialAccount.platform.substring(0, 2)}
                    </Badge>
                  ))}
                  <Badge className={POST_STATUS_COLORS[post.status as PostStatus]}>
                    {tPosts(POST_STATUS_KEYS[post.status as PostStatus])}
                  </Badge>
                  <ArrowRight className="h-3 w-3 opacity-30 text-white" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No accounts + no posts empty state */}
      {socialAccounts.length === 0 && totalPosts === 0 && (
        <div
          className="flex flex-col items-center py-10 text-center rounded-2xl"
          style={{ background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(168,85,247,0.15)" }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
            <Zap className="h-6 w-6" style={{ color: "#a855f7" }} />
          </div>
          <p className="text-lg font-bold text-white mb-2">Willkommen bei CtxPost!</p>
          <p className="text-sm max-w-sm mb-5" style={{ color: "#94a3b8" }}>
            Verbinde zuerst deine sozialen Netzwerke, dann kannst du direkt loslegen.
          </p>
          <div className="flex gap-3">
            <Link href="/accounts">
              <Button style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none" }}>
                Accounts verbinden
              </Button>
            </Link>
            <Link href="/posts/new">
              <Button variant="outline" style={{ border: "1px solid rgba(168,85,247,0.25)", color: "#a855f7" }}>
                Erster Post
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
