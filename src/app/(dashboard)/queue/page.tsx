import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format, type Locale, isToday, isTomorrow, differenceInHours } from "date-fns";
import { de, enUS, fr, es, pt } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLATFORMS } from "@/lib/constants";
import type { Platform } from "@prisma/client";
import Link from "next/link";
import { Clock, ListOrdered, Plus, ArrowRight, Zap } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";

function getTimeLabel(date: Date, locale: Locale): { label: string; isUrgent: boolean } {
  const hoursUntil = differenceInHours(date, new Date());
  if (isToday(date)) {
    return {
      label: `Heute, ${format(date, "HH:mm")}`,
      isUrgent: hoursUntil < 2,
    };
  }
  if (isTomorrow(date)) {
    return { label: `Morgen, ${format(date, "HH:mm")}`, isUrgent: false };
  }
  return { label: format(date, "dd. MMM, HH:mm", { locale }), isUrgent: false };
}

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: "#1877F2",
  INSTAGRAM: "#E4405F",
  THREADS: "#a855f7",
  TWITTER: "#1da1f2",
  LINKEDIN: "#0A66C2",
};

export default async function QueuePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("queue");
  const tNav = await getTranslations("nav");
  const tDashboard = await getTranslations("dashboard");

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(168,85,247,0.1))", border: "1px solid rgba(34,211,238,0.3)" }}
            >
              <ListOrdered className="w-4 h-4" style={{ color: "#22d3ee" }} />
            </div>
            {t("title")}
          </h1>
          <p className="mt-1" style={{ color: "#94a3b8" }}>
            {posts.length > 0
              ? `${posts.length} Post${posts.length > 1 ? "s" : ""} in der Warteschlange`
              : t("subtitle")}
          </p>
        </div>
        <Link href="/posts/new">
          <Button
            className="gap-2 font-semibold"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", boxShadow: "0 0 20px rgba(168,85,247,0.25)" }}
          >
            <Plus className="h-4 w-4" />
            {tNav("newPost")}
          </Button>
        </Link>
      </div>

      {posts.length === 0 ? (
        /* Empty state */
        <div
          className="flex flex-col items-center py-16 text-center rounded-2xl"
          style={{ background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(34,211,238,0.15)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.15)" }}
          >
            <Clock className="h-7 w-7" style={{ color: "#22d3ee" }} />
          </div>
          <p className="text-lg font-bold text-white mb-2">{t("empty")}</p>
          <p className="text-sm max-w-sm mb-5" style={{ color: "#94a3b8" }}>
            {t("emptyDesc")}
          </p>
          <Link href="/posts/new">
            <Button style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none" }}>
              {tDashboard("createPost")}
            </Button>
          </Link>
        </div>
      ) : (
        /* Timeline */
        <div className="relative">
          {/* Vertical timeline line */}
          <div
            className="absolute left-[19px] top-4 bottom-4 w-[1px]"
            style={{ background: "linear-gradient(180deg, rgba(168,85,247,0.4) 0%, rgba(34,211,238,0.2) 50%, rgba(168,85,247,0.1) 100%)" }}
          />

          <div className="space-y-3 pl-12">
            {posts.map((post, idx) => {
              const scheduledAt = post.scheduledAt!;
              const { label: timeLabel, isUrgent } = getTimeLabel(scheduledAt, dateLocale);
              const uniquePlatforms = [...new Set(post.targets.map((t) => t.socialAccount.platform as string))];

              return (
                <div key={post.id} className="relative">
                  {/* Timeline dot */}
                  <div
                    className="absolute -left-[37px] top-4 w-[10px] h-[10px] rounded-full"
                    style={{
                      background: isUrgent ? "#f472b6" : idx === 0 ? "#a855f7" : "#22d3ee",
                      boxShadow: `0 0 8px ${isUrgent ? "#f472b6" : idx === 0 ? "#a855f7" : "#22d3ee"}`,
                      border: "2px solid #080e1a",
                    }}
                  />
                  {isUrgent && (
                    <div
                      className="absolute -left-[37px] top-4 w-[10px] h-[10px] rounded-full animate-ping"
                      style={{ background: "#f472b6", opacity: 0.4 }}
                    />
                  )}

                  {/* Post card */}
                  <Link href={`/posts/${post.id}`} className="block group">
                    <div
                      className="p-4 rounded-2xl transition-all duration-200 group-hover:scale-[1.005]"
                      style={{
                        background: "#0d1424",
                        border: `1px solid ${isUrgent ? "rgba(244,114,182,0.25)" : "rgba(168,85,247,0.1)"}`,
                        boxShadow: isUrgent ? "0 0 16px rgba(244,114,182,0.08)" : "none",
                      }}
                    >
                      {/* Top row: time + platforms */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock
                            className="h-3.5 w-3.5 shrink-0"
                            style={{ color: isUrgent ? "#f472b6" : "#94a3b8" }}
                          />
                          <span
                            className="text-xs font-semibold"
                            style={{ color: isUrgent ? "#f472b6" : "#94a3b8" }}
                          >
                            {timeLabel}
                          </span>
                          {isUrgent && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: "rgba(244,114,182,0.12)", color: "#f472b6", border: "1px solid rgba(244,114,182,0.25)" }}
                            >
                              BALD
                            </span>
                          )}
                        </div>

                        {/* Platform color dots */}
                        <div className="flex items-center gap-1.5">
                          {uniquePlatforms.map((platform) => (
                            <div
                              key={platform}
                              className="w-5 h-5 rounded-full flex items-center justify-center"
                              title={PLATFORMS[platform as Platform]?.name || platform}
                              style={{ background: (PLATFORM_COLORS[platform] || "#6b7280") + "20", border: `1px solid ${PLATFORM_COLORS[platform] || "#6b7280"}40` }}
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: PLATFORM_COLORS[platform] || "#6b7280" }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-sm text-white line-clamp-2 leading-relaxed mb-3">
                        {post.content}
                      </p>

                      {/* Bottom: accounts + arrow */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1.5">
                          {post.targets.map((target) => (
                            <Badge
                              key={target.id}
                              variant="secondary"
                              className="text-[10px] font-medium"
                              style={{
                                background: (PLATFORM_COLORS[target.socialAccount.platform] || "#6b7280") + "15",
                                color: PLATFORM_COLORS[target.socialAccount.platform] || "#94a3b8",
                                border: `1px solid ${(PLATFORM_COLORS[target.socialAccount.platform] || "#6b7280")}30`,
                              }}
                            >
                              {target.socialAccount.accountName}
                            </Badge>
                          ))}
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-40 text-white transition-opacity" />
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}

            {/* Timeline end marker */}
            <div className="relative pl-0">
              <div
                className="absolute -left-[37px] top-2 w-[10px] h-[10px] rounded-full"
                style={{ background: "rgba(168,85,247,0.2)", border: "2px solid rgba(168,85,247,0.3)" }}
              />
              <div className="flex items-center gap-3 py-2">
                <Zap className="h-4 w-4" style={{ color: "#94a3b8" }} />
                <span className="text-sm" style={{ color: "#94a3b8" }}>
                  {posts.length} geplante{posts.length > 1 ? "r" : ""} Post{posts.length > 1 ? "s" : ""} —
                  <Link href="/posts/new" className="ml-1 underline" style={{ color: "#a855f7" }}>
                    weiteren hinzufügen
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
