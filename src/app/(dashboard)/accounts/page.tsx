import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PLATFORMS } from "@/lib/constants";
import { disconnectSocialAccount } from "@/actions/social-accounts";
import {
  Facebook, Linkedin, Plus, Unplug, Twitter, Instagram, AtSign,
  AlertTriangle, RefreshCw, CheckCircle2, Wifi, WifiOff, Link2,
} from "lucide-react";
import type { Platform } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { TestPublishButton } from "@/components/accounts/test-publish-button";

type PlatformKey = "FACEBOOK" | "LINKEDIN" | "TWITTER" | "INSTAGRAM" | "THREADS";

const PLATFORM_META: Record<PlatformKey, {
  icon: typeof Facebook;
  color: string;
  gradient: string;
  glow: string;
  name: string;
  tagline: string;
  authUrl: string;
  hint?: string;
}> = {
  FACEBOOK: {
    icon: Facebook,
    color: "#1877F2",
    gradient: "linear-gradient(135deg, rgba(24,119,242,0.15), rgba(24,119,242,0.05))",
    glow: "rgba(24,119,242,0.15)",
    name: "Facebook",
    tagline: "Seiten & Profile verbinden",
    authUrl: "/api/social/facebook/authorize",
  },
  INSTAGRAM: {
    icon: Instagram,
    color: "#E4405F",
    gradient: "linear-gradient(135deg, rgba(228,64,95,0.15), rgba(228,64,95,0.05))",
    glow: "rgba(228,64,95,0.15)",
    name: "Instagram",
    tagline: "Business-Profile posten",
    authUrl: "/api/social/instagram/authorize",
    hint: "Benötigt Facebook Business-Verbindung",
  },
  THREADS: {
    icon: AtSign,
    color: "#a855f7",
    gradient: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))",
    glow: "rgba(168,85,247,0.15)",
    name: "Threads",
    tagline: "Via Meta-App verbinden",
    authUrl: "/api/social/threads/authorize",
  },
  TWITTER: {
    icon: Twitter,
    color: "#1da1f2",
    gradient: "linear-gradient(135deg, rgba(29,161,242,0.15), rgba(29,161,242,0.05))",
    glow: "rgba(29,161,242,0.15)",
    name: "X / Twitter",
    tagline: "Posts & Threads teilen",
    authUrl: "/api/social/twitter/authorize",
  },
  LINKEDIN: {
    icon: Linkedin,
    color: "#0A66C2",
    gradient: "linear-gradient(135deg, rgba(10,102,194,0.15), rgba(10,102,194,0.05))",
    glow: "rgba(10,102,194,0.15)",
    name: "LinkedIn",
    tagline: "Profil & Unternehmensseite",
    authUrl: "/api/social/linkedin/authorize",
  },
};

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("accounts");

  const accounts = await prisma.socialAccount.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: [{ platform: "asc" }, { accountType: "asc" }, { createdAt: "desc" }],
  });

  const accountsByPlatform = accounts.reduce(
    (acc, acct) => {
      const key = acct.platform as PlatformKey;
      if (!acc[key]) acc[key] = [];
      acc[key].push(acct);
      return acc;
    },
    {} as Record<PlatformKey, typeof accounts>
  );

  const platforms = (Object.keys(PLATFORM_META) as PlatformKey[]);
  const totalConnected = accounts.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(34,211,238,0.1))", border: "1px solid rgba(168,85,247,0.3)" }}
            >
              <Link2 className="w-4 h-4" style={{ color: "#a855f7" }} />
            </div>
            {t("title")}
          </h1>
          <p className="mt-1" style={{ color: "#94a3b8" }}>
            Klicke auf <strong className="text-white">Verbinden</strong> → autorisiere deinen Account → fertig. Kein API-Key nötig.
          </p>
        </div>

        {/* Stats bubble */}
        {totalConnected > 0 && (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-2xl shrink-0"
            style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}
          >
            <Wifi className="h-4 w-4" style={{ color: "#34d399" }} />
            <span className="text-sm font-bold" style={{ color: "#34d399" }}>{totalConnected}</span>
            <span className="text-xs" style={{ color: "#94a3b8" }}>verbunden</span>
          </div>
        )}
      </div>

      {/* Hootsuite-style connect hint */}
      <div
        className="flex items-center gap-4 p-4 rounded-2xl"
        style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(34,211,238,0.04))", border: "1px solid rgba(168,85,247,0.15)" }}
      >
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: i === 1 ? "#a855f7" : i === 2 ? "#22d3ee" : "#34d399" }}
            >
              {i}
            </div>
          ))}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">So einfach wie Hootsuite</p>
          <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
            Wähle eine Plattform → <strong className="text-white">Verbinden</strong> klicken → bei der Plattform einloggen & autorisieren → Account erscheint hier ✓
          </p>
        </div>
      </div>

      {/* Platform Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {platforms.map((platformKey) => {
          const meta = PLATFORM_META[platformKey];
          const Icon = meta.icon;
          const connectedAccts = accountsByPlatform[platformKey] || [];
          const hasConnected = connectedAccts.length > 0;

          return (
            <div
              key={platformKey}
              className="rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: "#0d1424",
                border: `1px solid ${hasConnected ? meta.color + "40" : "rgba(255,255,255,0.05)"}`,
                boxShadow: hasConnected ? `0 0 24px ${meta.glow}` : "none",
              }}
            >
              {/* Card header */}
              <div
                className="p-4 flex items-center gap-3"
                style={{ background: meta.gradient, borderBottom: `1px solid ${meta.color}20` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: meta.color + "20", border: `1px solid ${meta.color}40` }}
                >
                  <Icon className="h-5 w-5" style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white">{meta.name}</p>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>{meta.tagline}</p>
                </div>
                {/* Status indicator */}
                <div className="shrink-0">
                  {hasConnected ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)" }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#34d399", boxShadow: "0 0 4px #34d399" }} />
                      <span className="text-xs font-medium" style={{ color: "#34d399" }}>{connectedAccts.length}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <WifiOff className="h-3 w-3" style={{ color: "#6b7280" }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Connected accounts list */}
              {connectedAccts.length > 0 && (
                <div className="px-4 py-3 space-y-2">
                  {connectedAccts.map((account) => {
                    const isTokenExpired = account.tokenExpiresAt ? new Date(account.tokenExpiresAt) < new Date() : false;
                    const isTokenExpiringSoon = account.tokenExpiresAt
                      ? new Date(account.tokenExpiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && !isTokenExpired
                      : false;
                    const canPublish = platformKey === "FACEBOOK" ? account.accountType === "page" : true;

                    return (
                      <div
                        key={account.id}
                        className="flex items-center gap-3 p-2.5 rounded-xl"
                        style={{
                          background: isTokenExpired
                            ? "rgba(239,68,68,0.06)"
                            : isTokenExpiringSoon
                              ? "rgba(251,191,36,0.06)"
                              : "rgba(255,255,255,0.03)",
                          border: isTokenExpired
                            ? "1px solid rgba(239,68,68,0.2)"
                            : isTokenExpiringSoon
                              ? "1px solid rgba(251,191,36,0.2)"
                              : `1px solid ${meta.color}15`,
                        }}
                      >
                        {/* Avatar */}
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: meta.color + "30", border: `1px solid ${meta.color}40` }}
                        >
                          {account.accountName.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{account.accountName}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs" style={{ color: "#94a3b8" }}>{account.accountType}</span>
                            {isTokenExpired && (
                              <span className="flex items-center gap-0.5 text-xs" style={{ color: "#f87171" }}>
                                <AlertTriangle className="h-3 w-3" />{t("tokenExpired")}
                              </span>
                            )}
                            {isTokenExpiringSoon && (
                              <span className="flex items-center gap-0.5 text-xs" style={{ color: "#fbbf24" }}>
                                <AlertTriangle className="h-3 w-3" />{t("tokenExpiresSoon")}
                              </span>
                            )}
                            {platformKey === "FACEBOOK" && account.accountType === "profile" && (
                              <span className="text-xs italic" style={{ color: "#6b7280" }}>({t("profileNoPublish")})</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {canPublish && !isTokenExpired && (
                            <TestPublishButton accountId={account.id} accountName={account.accountName} />
                          )}
                          {(isTokenExpired || isTokenExpiringSoon) && (
                            <a href={`/api/social/${platformKey.toLowerCase()}/authorize`}>
                              <Button variant="outline" size="icon" className="h-7 w-7" style={{ borderColor: "rgba(251,191,36,0.3)", color: "#fbbf24" }}>
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            </a>
                          )}
                          {!isTokenExpired && canPublish && (
                            <CheckCircle2 className="h-4 w-4" style={{ color: "#34d399" }} />
                          )}
                          <form action={async () => {
                            "use server";
                            await disconnectSocialAccount(account.id);
                          }}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-red-400">
                              <Unplug className="h-3 w-3" />
                            </Button>
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Connect button */}
              <div className="p-4 pt-2">
                {meta.hint && (
                  <p className="text-xs mb-2" style={{ color: "#6b7280" }}>💡 {meta.hint}</p>
                )}
                <a href={meta.authUrl} className="block">
                  <Button
                    className="w-full gap-2 font-semibold transition-all duration-200"
                    style={{
                      background: hasConnected
                        ? "rgba(255,255,255,0.04)"
                        : `linear-gradient(135deg, ${meta.color}cc, ${meta.color}99)`,
                      border: hasConnected
                        ? `1px solid ${meta.color}30`
                        : "none",
                      color: hasConnected ? meta.color : "white",
                      boxShadow: hasConnected ? "none" : `0 0 16px ${meta.color}30`,
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    {hasConnected ? `Weiteres ${meta.name}-Konto verbinden` : `${meta.name} verbinden`}
                  </Button>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {totalConnected === 0 && (
        <div
          className="flex flex-col items-center py-12 text-center rounded-2xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(168,85,247,0.2)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}
          >
            <Link2 className="h-7 w-7" style={{ color: "#a855f7" }} />
          </div>
          <p className="text-lg font-bold text-white mb-2">Noch keine Accounts verbunden</p>
          <p className="text-sm max-w-sm" style={{ color: "#94a3b8" }}>
            Wähle eine Plattform oben und klicke auf <strong className="text-white">Verbinden</strong>. Du wirst zu der jeweiligen Plattform weitergeleitet — kein API-Key nötig.
          </p>
        </div>
      )}
    </div>
  );
}
