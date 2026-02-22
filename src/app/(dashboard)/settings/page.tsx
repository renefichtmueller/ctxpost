import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Mail, Globe, Key, Terminal, ExternalLink, BookOpen, CheckCircle2 } from "lucide-react";
import { AISettingsForm } from "@/components/settings/ai-settings-form";
import { ApiCredentialsForm } from "@/components/settings/api-credentials-form";
import { BrandStyleForm } from "@/components/settings/brand-style-form";
import { TimezoneForm } from "@/components/settings/timezone-form";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { GdprSettings } from "@/components/settings/gdpr-settings";
import { getTranslations, getLocale } from "next-intl/server";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("settings");
  const tCommon = await getTranslations("common");
  const tApi = await getTranslations("apiCredentials");

  const locale = await getLocale();

  const [user, brandStyle, recentAudit] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        aiProvider: true, textModel: true, imageModel: true, analysisModel: true,
        ollamaUrl: true, imageGenUrl: true, imageGenProvider: true, timezone: true,
        privacyConsentAt: true, termsConsentAt: true, consentVersion: true,
      },
    }),
    prisma.brandStyleGuide.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.auditLog.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { action: true, createdAt: true, ipAddress: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
        <p style={{ color: "#94a3b8" }}>{t("languageDesc")}</p>
      </div>

      {/* Timezone Settings */}
      <TimezoneForm currentTimezone={user?.timezone ?? "Europe/Berlin"} />

      {/* Language Settings */}
      <Card style={{ background: "#0d1424", border: "1px solid rgba(168, 85, 247, 0.15)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Globe className="h-5 w-5" style={{ color: "#22d3ee" }} />
            {t("language")}
          </CardTitle>
          <CardDescription style={{ color: "#94a3b8" }}>{t("languageDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <LocaleSwitcher />
          </div>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card style={{ background: "#0d1424", border: "1px solid rgba(168, 85, 247, 0.15)" }}>
        <CardHeader>
          <CardTitle className="text-white">{t("profile")}</CardTitle>
          <CardDescription style={{ color: "#94a3b8" }}>{t("accountInfo")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.1)" }}>
            <User className="h-5 w-5 shrink-0" style={{ color: "#a855f7" }} />
            <div>
              <p className="text-xs" style={{ color: "#94a3b8" }}>{tCommon("name")}</p>
              <p className="font-medium text-white">{session.user.name || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.1)" }}>
            <Mail className="h-5 w-5 shrink-0" style={{ color: "#22d3ee" }} />
            <div>
              <p className="text-xs" style={{ color: "#94a3b8" }}>{tCommon("email")}</p>
              <p className="font-medium text-white">{session.user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AISettingsForm
        currentProvider={user?.aiProvider ?? "ollama"}
        currentTextModel={user?.textModel ?? "qwen2.5:32b"}
        currentImageModel={user?.imageModel ?? ""}
        currentAnalysisModel={user?.analysisModel ?? "qwen2.5:32b"}
        currentOllamaUrl={user?.ollamaUrl ?? "http://localhost:11434"}
        currentImageGenUrl={user?.imageGenUrl ?? ""}
        currentImageGenProvider={user?.imageGenProvider ?? "sd-webui"}
      />

      {/* API Credentials */}
      <Card style={{ background: "#0d1424", border: "1px solid rgba(168, 85, 247, 0.15)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Key className="h-5 w-5" style={{ color: "#fbbf24" }} />
            {tApi("title")}
          </CardTitle>
          <CardDescription style={{ color: "#94a3b8" }}>{tApi("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ApiCredentialsForm />
        </CardContent>
      </Card>

      {/* ── API How-To Guide ── */}
      <Card style={{ background: "#0d1424", border: "1px solid rgba(34, 211, 238, 0.2)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Terminal className="h-5 w-5" style={{ color: "#22d3ee" }} />
            So kommst du an deine API-Keys
          </CardTitle>
          <CardDescription style={{ color: "#94a3b8" }}>
            Schritt-für-Schritt-Anleitung für jede Plattform. Klicke direkt auf die Links – die Developer-Konsolen öffnen sich in einem neuen Tab.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Anthropic / Claude */}
          <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(168, 85, 247, 0.06)", border: "1px solid rgba(168, 85, 247, 0.15)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4" style={{ color: "#a855f7" }} />
                Anthropic / Claude API
              </h3>
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: "#a855f7" }}
              >
                console.anthropic.com <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <ol className="space-y-1.5 text-sm" style={{ color: "#94a3b8" }}>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Gehe zu <strong className="text-white">console.anthropic.com</strong> → Account erstellen / anmelden</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Klicke links auf <strong className="text-white">Settings → API Keys</strong></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Klicke <strong className="text-white">Create Key</strong> → Namen vergeben → Key kopieren</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Key in das Feld <strong className="text-white">Anthropic API Key</strong> oben einfügen</li>
            </ol>
          </div>

          {/* Facebook */}
          <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(24, 119, 242, 0.06)", border: "1px solid rgba(24, 119, 242, 0.2)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4" style={{ color: "#1877f2" }} />
                Facebook / Instagram API
              </h3>
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: "#1877f2" }}
              >
                developers.facebook.com <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <ol className="space-y-1.5 text-sm" style={{ color: "#94a3b8" }}>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Gehe zu <strong className="text-white">developers.facebook.com</strong> → App erstellen (Type: Business)</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Wähle <strong className="text-white">Settings → Basic</strong> → App ID + App Secret kopieren</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Setze <strong className="text-white">Valid OAuth Redirect URI</strong>: deine-domain.de/api/social/facebook/callback</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Aktiviere Produkte: <strong className="text-white">Facebook Login + Pages API</strong></li>
            </ol>
          </div>

          {/* LinkedIn */}
          <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(10, 102, 194, 0.06)", border: "1px solid rgba(10, 102, 194, 0.2)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4" style={{ color: "#0a66c2" }} />
                LinkedIn API
              </h3>
              <a
                href="https://www.linkedin.com/developers/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: "#0a66c2" }}
              >
                linkedin.com/developers <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <ol className="space-y-1.5 text-sm" style={{ color: "#94a3b8" }}>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Gehe zu <strong className="text-white">linkedin.com/developers/apps</strong> → Create App</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Unter <strong className="text-white">Auth</strong>: Client ID + Client Secret kopieren</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Authorized Redirect URL: deine-domain.de/api/social/linkedin/callback</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Products anfordern: <strong className="text-white">Share on LinkedIn + Sign In with LinkedIn</strong></li>
            </ol>
          </div>

          {/* Twitter/X */}
          <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(29, 161, 242, 0.06)", border: "1px solid rgba(29, 161, 242, 0.2)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4" style={{ color: "#1da1f2" }} />
                X / Twitter API
              </h3>
              <a
                href="https://developer.x.com/en/portal/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: "#1da1f2" }}
              >
                developer.x.com <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <ol className="space-y-1.5 text-sm" style={{ color: "#94a3b8" }}>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Gehe zu <strong className="text-white">developer.x.com</strong> → Sign Up → Basic-Abo wählen</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />App erstellen → App Settings → OAuth 2.0 aktivieren</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Callback URL: deine-domain.de/api/social/twitter/callback</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} /><strong className="text-white">Client ID</strong> (OAuth 2.0) + Client Secret kopieren</li>
            </ol>
          </div>

          {/* Ollama Info */}
          <div className="p-4 rounded-xl" style={{ background: "rgba(52, 211, 153, 0.06)", border: "1px solid rgba(52, 211, 153, 0.2)" }}>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Terminal className="h-4 w-4" style={{ color: "#34d399" }} />
              Ollama (lokal) – kein API-Key nötig!
            </h3>
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              Ollama läuft bereits auf deinem Server. Konfiguriere einfach die URL unter{" "}
              <strong className="text-white">KI-Einstellungen</strong> (Standard: http://localhost:11434).
              Kein API-Key, kein Cloud-Abo – 100% lokal und kostenlos.
            </p>
            <div className="mt-3 p-2 rounded-lg font-mono text-xs" style={{ background: "#060b14", color: "#34d399" }}>
              <span style={{ color: "#a855f7" }}>$</span> ollama list &nbsp;&nbsp;<span style={{ color: "#94a3b8" }}># zeigt alle installierten Modelle</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <BrandStyleForm
        initialData={
          brandStyle
            ? {
                id: brandStyle.id,
                name: brandStyle.name,
                tone: brandStyle.tone,
                formality: brandStyle.formality,
                emojiUsage: brandStyle.emojiUsage,
                targetAudience: brandStyle.targetAudience,
                brandVoice: brandStyle.brandVoice,
                avoidTopics: brandStyle.avoidTopics,
                preferredTopics: brandStyle.preferredTopics,
                hashtagStrategy: brandStyle.hashtagStrategy,
                preferredHashtags: brandStyle.preferredHashtags,
                languages: brandStyle.languages,
                customInstructions: brandStyle.customInstructions,
              }
            : null
        }
      />

      {/* DSGVO / GDPR Settings */}
      <GdprSettings
        consent={{
          privacyConsentAt: user?.privacyConsentAt?.toISOString() ?? null,
          termsConsentAt: user?.termsConsentAt?.toISOString() ?? null,
          consentVersion: user?.consentVersion ?? null,
        }}
        recentAudit={recentAudit.map((a) => ({
          action: a.action,
          createdAt: a.createdAt.toISOString(),
          ipAddress: a.ipAddress,
        }))}
        locale={locale}
      />
    </div>
  );
}
