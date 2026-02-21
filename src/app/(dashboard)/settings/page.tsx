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
import { User, Mail, Globe } from "lucide-react";
import { AISettingsForm } from "@/components/settings/ai-settings-form";
import { BrandStyleForm } from "@/components/settings/brand-style-form";
import { TimezoneForm } from "@/components/settings/timezone-form";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getTranslations } from "next-intl/server";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("settings");
  const tCommon = await getTranslations("common");

  const [user, brandStyle] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { aiProvider: true, textModel: true, imageModel: true, analysisModel: true, ollamaUrl: true, imageGenUrl: true, imageGenProvider: true, timezone: true },
    }),
    prisma.brandStyleGuide.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("languageDesc")}
        </p>
      </div>

      {/* Timezone Settings */}
      <TimezoneForm currentTimezone={user?.timezone ?? "Europe/Berlin"} />

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t("language")}
          </CardTitle>
          <CardDescription>{t("languageDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <LocaleSwitcher />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
          <CardDescription>{t("accountInfo")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">{tCommon("name")}</p>
              <p className="font-medium">
                {session.user.name || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">{tCommon("email")}</p>
              <p className="font-medium">{session.user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AISettingsForm
        currentProvider={user?.aiProvider ?? "ollama"}
        currentTextModel={user?.textModel ?? "qwen2.5:32b"}
        currentImageModel={user?.imageModel ?? ""}
        currentAnalysisModel={user?.analysisModel ?? "qwen2.5:32b"}
        currentOllamaUrl={user?.ollamaUrl ?? "http://192.168.178.169:11434"}
        currentImageGenUrl={user?.imageGenUrl ?? ""}
        currentImageGenProvider={user?.imageGenProvider ?? "sd-webui"}
      />

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
    </div>
  );
}
