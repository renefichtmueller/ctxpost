"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Globe,
  Linkedin,
  Twitter,
  AtSign,
  Bot,
  Copy,
  Check,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getApiCredentials,
  updateApiCredentials,
} from "@/actions/api-credentials";

interface PlatformCredentials {
  facebookAppId: string;
  facebookAppSecret: string;
  facebookAppSecretSet: boolean;
  linkedinClientId: string;
  linkedinClientSecret: string;
  linkedinClientSecretSet: boolean;
  twitterClientId: string;
  twitterClientSecret: string;
  twitterClientSecretSet: boolean;
  threadsAppId: string;
  threadsAppSecret: string;
  threadsAppSecretSet: boolean;
  anthropicApiKey: string;
  anthropicApiKeySet: boolean;
}

type Platform = "facebook" | "linkedin" | "twitter" | "threads" | "anthropic";

interface PlatformConfig {
  key: Platform;
  icon: React.ReactNode;
  labelKey: string;
  idField?: string;
  idLabel: string;
  secretField: string;
  secretLabel: string;
  secretSetKey: keyof PlatformCredentials;
  hasRedirectUri: boolean;
  callbackPath?: string;
}

export function ApiCredentialsForm() {
  const t = useTranslations("apiCredentials");

  const [credentials, setCredentials] = useState<PlatformCredentials | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [openPlatforms, setOpenPlatforms] = useState<Set<Platform>>(new Set());
  const [editingSecrets, setEditingSecrets] = useState<Set<string>>(new Set());
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [savingPlatform, setSavingPlatform] = useState<Platform | null>(null);
  const [saveMessages, setSaveMessages] = useState<
    Record<Platform, { type: "success" | "error"; text: string } | null>
  >({
    facebook: null,
    linkedin: null,
    twitter: null,
    threads: null,
    anthropic: null,
  });
  const [copiedUri, setCopiedUri] = useState<Platform | null>(null);
  const [isPending, startTransition] = useTransition();
  const [origin, setOrigin] = useState("http://localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const loadCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getApiCredentials();
      if (data) {
        setCredentials(data);
        setFormValues({
          facebookAppId: data.facebookAppId,
          facebookAppSecret: data.facebookAppSecret,
          linkedinClientId: data.linkedinClientId,
          linkedinClientSecret: data.linkedinClientSecret,
          twitterClientId: data.twitterClientId,
          twitterClientSecret: data.twitterClientSecret,
          threadsAppId: data.threadsAppId,
          threadsAppSecret: data.threadsAppSecret,
          anthropicApiKey: data.anthropicApiKey,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  const platforms: PlatformConfig[] = [
    {
      key: "facebook",
      icon: <Globe className="h-5 w-5" />,
      labelKey: "facebook",
      idField: "facebookAppId",
      idLabel: "appId",
      secretField: "facebookAppSecret",
      secretLabel: "appSecret",
      secretSetKey: "facebookAppSecretSet",
      hasRedirectUri: true,
      callbackPath: "facebook",
    },
    {
      key: "linkedin",
      icon: <Linkedin className="h-5 w-5" />,
      labelKey: "linkedin",
      idField: "linkedinClientId",
      idLabel: "clientId",
      secretField: "linkedinClientSecret",
      secretLabel: "clientSecret",
      secretSetKey: "linkedinClientSecretSet",
      hasRedirectUri: true,
      callbackPath: "linkedin",
    },
    {
      key: "twitter",
      icon: <Twitter className="h-5 w-5" />,
      labelKey: "twitter",
      idField: "twitterClientId",
      idLabel: "clientId",
      secretField: "twitterClientSecret",
      secretLabel: "clientSecret",
      secretSetKey: "twitterClientSecretSet",
      hasRedirectUri: true,
      callbackPath: "twitter",
    },
    {
      key: "threads",
      icon: <AtSign className="h-5 w-5" />,
      labelKey: "threads",
      idField: "threadsAppId",
      idLabel: "appId",
      secretField: "threadsAppSecret",
      secretLabel: "appSecret",
      secretSetKey: "threadsAppSecretSet",
      hasRedirectUri: true,
      callbackPath: "threads",
    },
    {
      key: "anthropic",
      icon: <Bot className="h-5 w-5" />,
      labelKey: "anthropic",
      idField: undefined,
      idLabel: "apiKey",
      secretField: "anthropicApiKey",
      secretLabel: "apiKey",
      secretSetKey: "anthropicApiKeySet",
      hasRedirectUri: false,
    },
  ];

  const platformGuides: Record<Platform, { link: string; guideKey: string }> = {
    facebook: {
      link: "https://developers.facebook.com/apps/",
      guideKey: "facebookGuide",
    },
    linkedin: {
      link: "https://www.linkedin.com/developers/apps/",
      guideKey: "linkedinGuide",
    },
    twitter: {
      link: "https://developer.x.com/en/portal/projects-and-apps",
      guideKey: "twitterGuide",
    },
    threads: {
      link: "https://developers.facebook.com/apps/",
      guideKey: "threadsGuide",
    },
    anthropic: {
      link: "https://console.anthropic.com/settings/keys",
      guideKey: "anthropicGuide",
    },
  };

  const togglePlatform = (platform: Platform) => {
    setOpenPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  const isSecretSet = (platform: PlatformConfig): boolean => {
    if (!credentials) return false;
    return !!credentials[platform.secretSetKey];
  };

  const isEditing = (fieldName: string): boolean => {
    return editingSecrets.has(fieldName);
  };

  const startEditingSecret = (fieldName: string) => {
    setEditingSecrets((prev) => new Set(prev).add(fieldName));
    setFormValues((prev) => ({ ...prev, [fieldName]: "" }));
  };

  const cancelEditingSecret = (fieldName: string, originalValue: string) => {
    setEditingSecrets((prev) => {
      const next = new Set(prev);
      next.delete(fieldName);
      return next;
    });
    setFormValues((prev) => ({ ...prev, [fieldName]: originalValue }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleCopyRedirectUri = async (platform: Platform, uri: string) => {
    try {
      await navigator.clipboard.writeText(uri);
      setCopiedUri(platform);
      setTimeout(() => setCopiedUri(null), 2000);
    } catch {
      // Fallback: do nothing
    }
  };

  const handleSave = (platform: PlatformConfig) => {
    setSavingPlatform(platform.key);
    setSaveMessages((prev) => ({ ...prev, [platform.key]: null }));

    const formData = new FormData();
    formData.set("platform", platform.key);

    if (platform.key === "anthropic") {
      formData.set("anthropicApiKey", formValues.anthropicApiKey || "");
    } else {
      if (platform.idField) {
        formData.set(platform.idField, formValues[platform.idField] || "");
      }
      formData.set(platform.secretField, formValues[platform.secretField] || "");
    }

    startTransition(async () => {
      const result = await updateApiCredentials(formData);
      if (result?.error) {
        setSaveMessages((prev) => ({
          ...prev,
          [platform.key]: { type: "error" as const, text: t("saveError") },
        }));
      } else {
        setSaveMessages((prev) => ({
          ...prev,
          [platform.key]: { type: "success" as const, text: t("saved") },
        }));
        // Clear editing states for this platform's secret
        setEditingSecrets((prev) => {
          const next = new Set(prev);
          next.delete(platform.secretField);
          return next;
        });
        // Reload credentials to get fresh masked values
        await loadCredentials();
        setTimeout(() => {
          setSaveMessages((prev) => ({ ...prev, [platform.key]: null }));
        }, 3000);
      }
      setSavingPlatform(null);
    });
  };

  const getRedirectUri = (callbackPath: string) => {
    return `${origin}/api/social/${callbackPath}/callback`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
        {platforms.map((platform) => {
          const configured = isSecretSet(platform);
          const isOpen = openPlatforms.has(platform.key);
          const isSaving = savingPlatform === platform.key && isPending;
          const message = saveMessages[platform.key];

          return (
            <CollapsiblePrimitive.Root
              key={platform.key}
              open={isOpen}
              onOpenChange={() => togglePlatform(platform.key)}
            >
              <div className="rounded-lg border">
                <CollapsiblePrimitive.Trigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex items-center justify-center rounded-md p-2",
                          configured
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {platform.icon}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">
                          {t(platform.labelKey)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={cn(
                              "inline-block h-2 w-2 rounded-full",
                              configured ? "bg-green-500" : "bg-gray-300"
                            )}
                          />
                          <span className="text-xs text-muted-foreground">
                            {configured
                              ? t("configured")
                              : t("notConfigured")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                </CollapsiblePrimitive.Trigger>

                <CollapsiblePrimitive.Content>
                  <div className="border-t px-4 pb-4 pt-4 space-y-4">
                    {/* Setup Guide Info Box */}
                    {platformGuides[platform.key] && (
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2.5 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            {t("setupGuide")}
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                          {t(platformGuides[platform.key].guideKey)}
                        </p>
                        <a
                          href={platformGuides[platform.key].link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-medium transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {t("setupLink")}
                        </a>
                      </div>
                    )}

                    {/* Instagram hint for Facebook section */}
                    {platform.key === "facebook" && (
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                        {t("instagramHint")}
                      </p>
                    )}

                    {/* ID field (not for Anthropic) */}
                    {platform.idField && (
                      <div className="space-y-2">
                        <Label htmlFor={platform.idField}>
                          {t(platform.idLabel)}
                        </Label>
                        <Input
                          id={platform.idField}
                          value={formValues[platform.idField] || ""}
                          onChange={(e) =>
                            handleInputChange(
                              platform.idField!,
                              e.target.value
                            )
                          }
                          placeholder={t(platform.idLabel)}
                        />
                      </div>
                    )}

                    {/* Secret / API Key field */}
                    <div className="space-y-2">
                      <Label htmlFor={platform.secretField}>
                        {t(platform.secretLabel)}
                      </Label>
                      {configured &&
                      !isEditing(platform.secretField) ? (
                        <div className="flex items-center gap-2">
                          <Input
                            id={platform.secretField}
                            value={
                              formValues[platform.secretField] || ""
                            }
                            readOnly
                            className="font-mono text-muted-foreground"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              startEditingSecret(platform.secretField)
                            }
                            className="shrink-0"
                          >
                            {t("clearSecret")}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            id={platform.secretField}
                            type="password"
                            value={
                              formValues[platform.secretField] || ""
                            }
                            onChange={(e) =>
                              handleInputChange(
                                platform.secretField,
                                e.target.value
                              )
                            }
                            placeholder={t(platform.secretLabel)}
                          />
                          {isEditing(platform.secretField) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                cancelEditingSecret(
                                  platform.secretField,
                                  credentials?.[
                                    platform.secretField as keyof PlatformCredentials
                                  ] as string || ""
                                )
                              }
                              className="shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Redirect URI */}
                    {platform.hasRedirectUri && platform.callbackPath && (
                      <div className="space-y-2">
                        <Label>{t("redirectUri")}</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={getRedirectUri(platform.callbackPath)}
                            readOnly
                            className="font-mono text-xs text-muted-foreground"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleCopyRedirectUri(
                                platform.key,
                                getRedirectUri(platform.callbackPath!)
                              )
                            }
                            className="shrink-0"
                          >
                            {copiedUri === platform.key ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t("redirectUriHint")}
                        </p>
                      </div>
                    )}

                    {/* Save button and status message */}
                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        type="button"
                        onClick={() => handleSave(platform)}
                        disabled={isSaving}
                        size="sm"
                        className="gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("save")}
                          </>
                        ) : (
                          t("save")
                        )}
                      </Button>

                      {message && (
                        <div
                          className={cn(
                            "flex items-center gap-1 text-sm",
                            message.type === "success"
                              ? "text-green-600"
                              : "text-destructive"
                          )}
                        >
                          {message.type === "success" ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                          {message.text}
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsiblePrimitive.Content>
              </div>
            </CollapsiblePrimitive.Root>
          );
        })}
    </div>
  );
}
