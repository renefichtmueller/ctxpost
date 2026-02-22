import { prisma } from "@/lib/prisma";

type PlatformCredentials = {
  appId: string;
  appSecret: string;
  redirectUri: string;
};

type AnthropicCredentials = {
  apiKey: string;
};

/**
 * Get credentials for a social platform.
 * Priority: DB (per-user) → Environment Variables (system-wide)
 */
export async function getCredentialsForPlatform(
  userId: string,
  platform: "facebook" | "linkedin" | "twitter" | "threads"
): Promise<PlatformCredentials> {
  let config = null;
  try {
    config = await prisma.appConfig.findUnique({
      where: { userId },
    });
  } catch {
    // DB error - fall back to env
  }

  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";

  switch (platform) {
    case "facebook":
      return {
        appId: config?.facebookAppId || process.env.FACEBOOK_APP_ID || "",
        appSecret: config?.facebookAppSecret || process.env.FACEBOOK_APP_SECRET || "",
        redirectUri: process.env.FACEBOOK_REDIRECT_URI || `${baseUrl}/api/social/facebook/callback`,
      };
    case "linkedin":
      return {
        appId: config?.linkedinClientId || process.env.LINKEDIN_CLIENT_ID || "",
        appSecret: config?.linkedinClientSecret || process.env.LINKEDIN_CLIENT_SECRET || "",
        redirectUri: process.env.LINKEDIN_REDIRECT_URI || `${baseUrl}/api/social/linkedin/callback`,
      };
    case "twitter":
      return {
        appId: config?.twitterClientId || process.env.TWITTER_CLIENT_ID || "",
        appSecret: config?.twitterClientSecret || process.env.TWITTER_CLIENT_SECRET || "",
        redirectUri: process.env.TWITTER_REDIRECT_URI || `${baseUrl}/api/social/twitter/callback`,
      };
    case "threads":
      return {
        appId: config?.threadsAppId || process.env.THREADS_APP_ID || "",
        appSecret: config?.threadsAppSecret || process.env.THREADS_APP_SECRET || "",
        redirectUri: process.env.THREADS_REDIRECT_URI || `${baseUrl}/api/social/threads/callback`,
      };
  }
}

/**
 * Get Instagram credentials (reuses Facebook App credentials).
 */
export async function getInstagramCredentials(
  userId: string
): Promise<PlatformCredentials> {
  const fbCreds = await getCredentialsForPlatform(userId, "facebook");
  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
  return {
    appId: fbCreds.appId,
    appSecret: fbCreds.appSecret,
    redirectUri: process.env.INSTAGRAM_REDIRECT_URI || `${baseUrl}/api/social/instagram/callback`,
  };
}

/**
 * Get Anthropic API key.
 * Priority: DB (per-user) → Environment Variable
 */
export async function getAnthropicCredentials(
  userId: string
): Promise<AnthropicCredentials> {
  let config = null;
  try {
    config = await prisma.appConfig.findUnique({
      where: { userId },
    });
  } catch {
    // DB error - fall back to env
  }

  return {
    apiKey: config?.anthropicApiKey || process.env.ANTHROPIC_API_KEY || "",
  };
}
