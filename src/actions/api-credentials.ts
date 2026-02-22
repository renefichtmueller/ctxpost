"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { encrypt, decrypt } from "@/lib/crypto";

function maskSecret(value: string | null | undefined): string {
  if (!value) return "";
  // Decrypt first if encrypted, then mask
  let plain = value;
  if (process.env.ENCRYPTION_KEY) {
    try { plain = decrypt(value); } catch { /* use raw */ }
  }
  if (plain.length <= 6) return "●".repeat(plain.length);
  return "●".repeat(plain.length - 4) + plain.slice(-4);
}

/** Encrypt a secret if ENCRYPTION_KEY is configured */
function encryptIfConfigured(value: string | null): string | null {
  if (!value) return null;
  if (!process.env.ENCRYPTION_KEY) return value;
  try { return encrypt(value); } catch { return value; }
}

export async function getApiCredentials() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const config = await prisma.appConfig.findUnique({
    where: { userId: session.user.id },
  });

  if (!config) return null;

  // Return masked secrets for display, full IDs (not secrets)
  return {
    facebookAppId: config.facebookAppId || "",
    facebookAppSecret: maskSecret(config.facebookAppSecret),
    facebookAppSecretSet: !!config.facebookAppSecret,
    linkedinClientId: config.linkedinClientId || "",
    linkedinClientSecret: maskSecret(config.linkedinClientSecret),
    linkedinClientSecretSet: !!config.linkedinClientSecret,
    twitterClientId: config.twitterClientId || "",
    twitterClientSecret: maskSecret(config.twitterClientSecret),
    twitterClientSecretSet: !!config.twitterClientSecret,
    threadsAppId: config.threadsAppId || "",
    threadsAppSecret: maskSecret(config.threadsAppSecret),
    threadsAppSecretSet: !!config.threadsAppSecret,
    anthropicApiKey: maskSecret(config.anthropicApiKey),
    anthropicApiKeySet: !!config.anthropicApiKey,
  };
}

export async function updateApiCredentials(formData: FormData) {
  const t = await getTranslations("common");
  const session = await auth();
  if (!session?.user?.id) {
    return { error: t("notAuthenticated") };
  }

  const platform = formData.get("platform") as string;

  try {
    // Build update data based on which platform is being saved
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};

    switch (platform) {
      case "facebook": {
        const appId = formData.get("facebookAppId") as string;
        const appSecret = formData.get("facebookAppSecret") as string;
        if (appId !== undefined) data.facebookAppId = appId || null;
        if (appSecret && !appSecret.startsWith("●")) {
          data.facebookAppSecret = encryptIfConfigured(appSecret || null);
        }
        break;
      }
      case "linkedin": {
        const clientId = formData.get("linkedinClientId") as string;
        const clientSecret = formData.get("linkedinClientSecret") as string;
        if (clientId !== undefined) data.linkedinClientId = clientId || null;
        if (clientSecret && !clientSecret.startsWith("●")) {
          data.linkedinClientSecret = encryptIfConfigured(clientSecret || null);
        }
        break;
      }
      case "twitter": {
        const clientId = formData.get("twitterClientId") as string;
        const clientSecret = formData.get("twitterClientSecret") as string;
        if (clientId !== undefined) data.twitterClientId = clientId || null;
        if (clientSecret && !clientSecret.startsWith("●")) {
          data.twitterClientSecret = encryptIfConfigured(clientSecret || null);
        }
        break;
      }
      case "threads": {
        const appId = formData.get("threadsAppId") as string;
        const appSecret = formData.get("threadsAppSecret") as string;
        if (appId !== undefined) data.threadsAppId = appId || null;
        if (appSecret && !appSecret.startsWith("●")) {
          data.threadsAppSecret = encryptIfConfigured(appSecret || null);
        }
        break;
      }
      case "anthropic": {
        const apiKey = formData.get("anthropicApiKey") as string;
        if (apiKey && !apiKey.startsWith("●")) {
          data.anthropicApiKey = encryptIfConfigured(apiKey || null);
        }
        break;
      }
      default:
        return { error: "Unknown platform" };
    }

    await prisma.appConfig.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...data,
      },
      update: data,
    });

    revalidatePath("/settings");
    revalidatePath("/accounts");
    return { success: true };
  } catch (error) {
    console.error("API credentials update error:", error);
    return { error: t("error") };
  }
}
