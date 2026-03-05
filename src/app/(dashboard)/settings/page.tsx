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
import { User, Mail, Globe, Key, Terminal, ExternalLink, BookOpen, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import { AISettingsForm } from "@/components/settings/ai-settings-form";
import { ApiCredentialsForm } from "@/components/settings/api-credentials-form";
import { BrandStyleForm } from "@/components/settings/brand-style-form";
import { TimezoneForm } from "@/components/settings/timezone-form";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { GdprSettings } from "@/components/settings/gdpr-settings";
import { getTranslations, getLocale } from "next-intl/server";

function checkEnvCredentials() {
  return {
    facebook: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
    twitter: !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET),
    linkedin: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
    threads: !!(process.env.THREADS_APP_ID && process.env.THREADS_APP_SECRET),
    anthropic: !!process.env.ANTHROPIC_API_KEY,
  };
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("settings");
  const tCommon = await getTranslations("common");

  const locale = await getLocale();
  const envStatus = checkEnvCredentials();
  const allPlatformsConfigured = envStatus.facebook && envStatus.twitter && envStatus.linkedin;
  const configuredCount = Object.values(envStatus).filter(Boolean).length;
  const totalCount = Object.keys(envStatus).length;

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

  const platformStatusList = [
    { name: "Facebook & Instagram", key: "facebook", color: "#1877f2", configured: envStatus.facebook },
    { name: "X / Twitter", key: "twitter", color: "#1da1f2", configured: envStatus.twitter },
    { name: "LinkedIn", key: "linkedin", color: "#0a66c2", configured: envStatus.linkedin },
    { name: "Threads", key: "threads", color: "#000000", configured: envStatus.threads },
    { name: "Anthropic / Claude AI", key: "anthropic", color: "#a855f7", configured: envStatus.anthropic },
  ];

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
        currentOllamaUrl={(user?.ollamaUrl ?? process.env.OLLAMA_BASE_URL) || "http://localhost:11434"}
        currentImageGenUrl={user?.imageGenUrl ?? ""}
        currentImageGenProvider={user?.imageGenProvider ?? "sd-webui"}
      />

      {/* Platform Credentials Status */}
      <Card style={{ background: "#0d1424", border: `1px solid ${allPlatformsConfigured ? "rgba(52,211,153,0.25)" : "rgba(251,191,36,0.2)"}` }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            {allPlatformsConfigured
              ? <ShieldCheck className="h-5 w-5" style={{ color: "#34d399" }} />
              : <AlertTriangle className="h-5 w-5" style={{ color: "#fbbf24" }} />
            }
            Platform Credentials
          </CardTitle>
          <CardDescription style={{ color: "#94a3b8" }}>
            {allPlatformsConfigured
              ? `Alle Plattformen sind über Serverumgebungsvariablen konfiguriert. Gehe zu Accounts und verbinde deine Konten mit einem Klick.`
              : `${configuredCount} von ${totalCount} Plattformen via .env konfiguriert. Fehlende können hier manuell gesetzt werden.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Status overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {platformStatusList.map((p) => (
              <div
                key={p.key}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: p.configured ? "rgba(52,211,153,0.05)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${p.configured ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.05)"}`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: p.configured ? "#34d399" : "#4b5563", boxShadow: p.configured ? "0 0 6px #34d399" : "none" }}
                />
                <span className="text-sm font-medium" style={{ color: p.configured ? "#f0fdf4" : "#6b7280" }}>
                  {p.name}
                </span>
                <span className="ml-auto text-xs" style={{ color: p.configured ? "#34d399" : "#6b7280" }}>
                  {p.configured ? "✓ .env" : "—"}
                </span>
              </div>
            ))}
          </div>

          {/* If NOT all configured: show the form for manual setup */}
          {!allPlatformsConfigured && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
                <Key className="h-4 w-4 shrink-0" style={{ color: "#fbbf24" }} />
                <p className="text-xs" style={{ color: "#94a3b8" }}>
                  Du kannst Plattform-Credentials direkt hier hinterlegen (werden verschlüsselt gespeichert). Empfehlung: Setze sie per .env auf dem Server.
                </p>
              </div>
              <ApiCredentialsForm />
            </div>
          )}

          {/* If ALL configured: show hint to go to accounts */}
          {allPlatformsConfigured && (
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
              <ShieldCheck className="h-5 w-5 shrink-0" style={{ color: "#34d399" }} />
              <div>
                <p className="text-sm font-medium text-white">Bereit zum Verbinden</p>
                <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                  Alle App-Credentials sind gesetzt. Gehe zu{" "}
                  <a href="/accounts" className="underline" style={{ color: "#22d3ee" }}>Accounts</a>{" "}
                  und verbinde deine sozialen Profile mit einem Klick — kein weiterer API-Key nötig.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── API How-To Guide ── */}
      <Card style={{ background: "#0d1424", border: "1px solid rgba(34, 211, 238, 0.15)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Terminal className="h-5 w-5" style={{ color: "#22d3ee" }} />
            Operator Setup — So konfigurierst du die App-Credentials
          </CardTitle>
          <CardDescription style={{ color: "#94a3b8" }}>
            Als Server-Betreiber registrierst du einmalig eine App bei jeder Plattform und setzt die Credentials in der .env. Danach können alle Nutzer ihre Konten mit einem Klick verbinden — ohne API-Keys einzugeben.
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
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "#a855f7" }}>
                console.anthropic.com <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="p-2 rounded-lg font-mono text-xs" style={{ background: "#060b14", color: "#34d399" }}>
              <span style={{ color: "#94a3b8" }}># .env</span><br />
              ANTHROPIC_API_KEY=sk-ant-...
            </div>
          </div>

          {/* Facebook / Instagram */}
          <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(24, 119, 242, 0.06)", border: "1px solid rgba(24, 119, 242, 0.15)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4" style={{ color: "#1877f2" }} />
                Facebook + Instagram + Threads API
              </h3>
              <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "#1877f2" }}>
                developers.facebook.com <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <ol className="space-y-1.5 text-sm" style={{ color: "#94a3b8" }}>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />App erstellen (Typ: Business) → Settings → Basic: App ID + Secret kopieren</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Valid OAuth Redirect URI setzen: <code className="text-white">https://DEINE-DOMAIN/api/social/facebook/callback</code></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Produkte aktivieren: Facebook Login, Pages API, Instagram Basic Display, Threads API</li>
            </ol>
            <div className="p-2 rounded-lg font-mono text-xs" style={{ background: "#060b14", color: "#34d399" }}>
              <span style={{ color: "#94a3b8" }}># .env</span><br />
              FACEBOOK_APP_ID=123456789<br />
              FACEBOOK_APP_SECRET=abc123...<br />
              <span style={{ color: "#94a3b8" }}># Instagram + Threads nutzen dieselben Credentials</span><br />
              THREADS_APP_ID=123456789<br />
              THREADS_APP_SECRET=abc123...
            </div>
          </div>

          {/* Twitter/X */}
          <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(29, 161, 242, 0.06)", border: "1px solid rgba(29, 161, 242, 0.15)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4" style={{ color: "#1da1f2" }} />
                X / Twitter API
              </h3>
              <a href="https://developer.x.com/en/portal/dashboard" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "#1da1f2" }}>
                developer.x.com <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <ol className="space-y-1.5 text-sm" style={{ color: "#94a3b8" }}>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Developer Portal → App erstellen → OAuth 2.0 aktivieren (PKCE)</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Callback URL: <code className="text-white">https://DEINE-DOMAIN/api/social/twitter/callback</code></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />App permissions: Read + Write</li>
            </ol>
            <div className="p-2 rounded-lg font-mono text-xs" style={{ background: "#060b14", color: "#34d399" }}>
              <span style={{ color: "#94a3b8" }}># .env</span><br />
              TWITTER_CLIENT_ID=xyz...<br />
              TWITTER_CLIENT_SECRET=abc123...
            </div>
          </div>

          {/* LinkedIn */}
          <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(10, 102, 194, 0.06)", border: "1px solid rgba(10, 102, 194, 0.15)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4" style={{ color: "#0a66c2" }} />
                LinkedIn API
              </h3>
              <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "#0a66c2" }}>
                linkedin.com/developers <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <ol className="space-y-1.5 text-sm" style={{ color: "#94a3b8" }}>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />App erstellen → Auth Tab: Client ID + Secret kopieren</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Redirect URL: <code className="text-white">https://DEINE-DOMAIN/api/social/linkedin/callback</code></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />Products: Share on LinkedIn + Sign In with LinkedIn</li>
            </ol>
            <div className="p-2 rounded-lg font-mono text-xs" style={{ background: "#060b14", color: "#34d399" }}>
              <span style={{ color: "#94a3b8" }}># .env</span><br />
              LINKEDIN_CLIENT_ID=abc123<br />
              LINKEDIN_CLIENT_SECRET=xyz...
            </div>
          </div>

          {/* Ollama */}
          <div className="p-4 rounded-xl" style={{ background: "rgba(52, 211, 153, 0.06)", border: "1px solid rgba(52, 211, 153, 0.15)" }}>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <Terminal className="h-4 w-4" style={{ color: "#34d399" }} />
              Ollama (lokal) — kein API-Key nötig!
            </h3>
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              Konfiguriere einfach die URL unter <strong className="text-white">KI-Einstellungen</strong>. Kein API-Key, kein Cloud-Abo.
            </p>
            <div className="mt-3 p-2 rounded-lg font-mono text-xs" style={{ background: "#060b14", color: "#34d399" }}>
              <span style={{ color: "#a855f7" }}>$</span> ollama list &nbsp;&nbsp;<span style={{ color: "#94a3b8" }}># zeigt alle Modelle</span>
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
