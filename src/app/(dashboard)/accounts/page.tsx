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
import { PLATFORMS } from "@/lib/constants";
import { disconnectSocialAccount } from "@/actions/social-accounts";
import { Facebook, Linkedin, Plus, Unplug, Twitter, Instagram, AtSign, AlertTriangle, RefreshCw } from "lucide-react";
import type { Platform } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { TestPublishButton } from "@/components/accounts/test-publish-button";

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("accounts");

  const accounts = await prisma.socialAccount.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: [{ platform: "asc" }, { accountType: "asc" }, { createdAt: "desc" }],
  });

  // All OAuth flows now go through server-side authorize routes (CSRF-protected)
  const platformCards = [
    {
      platform: "FACEBOOK",
      icon: Facebook,
      color: "#1877F2",
      name: "Facebook",
      desc: t("facebookDesc"),
      connectLabel: t("facebookConnect"),
      authUrl: "/api/social/facebook/authorize",
    },
    {
      platform: "LINKEDIN",
      icon: Linkedin,
      color: "#0A66C2",
      name: "LinkedIn",
      desc: t("linkedinDesc"),
      connectLabel: t("linkedinConnect"),
      authUrl: "/api/social/linkedin/authorize",
    },
    {
      platform: "TWITTER",
      icon: Twitter,
      color: "#000000",
      name: "X / Twitter",
      desc: t("twitterDesc"),
      connectLabel: t("twitterConnect"),
      authUrl: "/api/social/twitter/authorize",
    },
    {
      platform: "INSTAGRAM",
      icon: Instagram,
      color: "#E4405F",
      name: "Instagram",
      desc: t("instagramDesc"),
      connectLabel: t("instagramConnect"),
      authUrl: "/api/social/instagram/authorize",
    },
    {
      platform: "THREADS",
      icon: AtSign,
      color: "#000000",
      name: "Threads",
      desc: t("threadsDesc"),
      connectLabel: t("threadsConnect"),
      authUrl: "/api/social/threads/authorize",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platformCards.map((pc) => (
          <Card key={pc.platform}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <pc.icon className="h-5 w-5" style={{ color: pc.color }} />
                {pc.name}
              </CardTitle>
              <CardDescription>{pc.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              {pc.authUrl ? (
                <a href={pc.authUrl}>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    {pc.connectLabel}
                  </Button>
                </a>
              ) : (
                <Button className="gap-2" disabled>
                  <Plus className="h-4 w-4" />
                  {pc.connectLabel}
                  <Badge variant="outline" className="ml-1 text-[10px]">
                    Soon
                  </Badge>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("connectedAccounts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accounts.map((account) => {
                const platformInfo = PLATFORMS[account.platform as Platform];
                const PlatformIcon =
                  account.platform === "FACEBOOK"
                    ? Facebook
                    : account.platform === "LINKEDIN"
                      ? Linkedin
                      : account.platform === "TWITTER"
                        ? Twitter
                        : account.platform === "INSTAGRAM"
                          ? Instagram
                          : AtSign;

                // Check token expiration
                const isTokenExpired = account.tokenExpiresAt
                  ? new Date(account.tokenExpiresAt) < new Date()
                  : false;
                const isTokenExpiringSoon = account.tokenExpiresAt
                  ? new Date(account.tokenExpiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && !isTokenExpired
                  : false;

                // Determine if the account can publish (page type only for FB)
                const canPublish = account.platform === "FACEBOOK"
                  ? account.accountType === "page"
                  : true;

                return (
                  <div
                    key={account.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isTokenExpired ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20" :
                      isTokenExpiringSoon ? "border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <PlatformIcon
                        className="h-5 w-5"
                        style={{ color: platformInfo?.color || "#666" }}
                      />
                      <div>
                        <p className="font-medium">{account.accountName}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-muted-foreground">
                            {platformInfo?.name || account.platform} &middot;{" "}
                            {account.accountType}
                          </p>
                          {isTokenExpired && (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                              <AlertTriangle className="h-3 w-3" />
                              {t("tokenExpired")}
                            </span>
                          )}
                          {isTokenExpiringSoon && (
                            <span className="inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                              <AlertTriangle className="h-3 w-3" />
                              {t("tokenExpiresSoon")}
                            </span>
                          )}
                          {account.platform === "FACEBOOK" && account.accountType === "profile" && (
                            <span className="text-xs text-muted-foreground italic">
                              ({t("profileNoPublish")})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canPublish && !isTokenExpired && (
                        <TestPublishButton
                          accountId={account.id}
                          accountName={account.accountName}
                        />
                      )}
                      {(isTokenExpired || isTokenExpiringSoon) && (
                        <a href={
                          account.platform === "FACEBOOK" ? "/api/social/facebook/authorize" :
                          account.platform === "INSTAGRAM" ? "/api/social/instagram/authorize" :
                          account.platform === "THREADS" ? "/api/social/threads/authorize" :
                          account.platform === "TWITTER" ? "/api/social/twitter/authorize" :
                          "/api/social/linkedin/authorize"
                        }>
                          <Button variant="outline" size="sm" className="gap-1 text-xs">
                            <RefreshCw className="h-3 w-3" />
                            {t("reconnect")}
                          </Button>
                        </a>
                      )}
                      <Badge variant={isTokenExpired ? "destructive" : "secondary"}>
                        {isTokenExpired ? t("expired") : t("connected")}
                      </Badge>
                      <form
                        action={async () => {
                          "use server";
                          await disconnectSocialAccount(account.id);
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive gap-1"
                        >
                          <Unplug className="h-4 w-4" />
                          {t("disconnect")}
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
