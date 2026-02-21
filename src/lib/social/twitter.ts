import crypto from "crypto";

// Twitter API v2 with OAuth 2.0 PKCE
// Env vars: TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, TWITTER_REDIRECT_URI

const TWITTER_API_BASE = "https://api.twitter.com/2";

/**
 * Generate a cryptographically random string for use as state or code_verifier.
 */
function generateRandomString(length: number): string {
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
}

/**
 * Generate a code_challenge from a code_verifier using SHA256 (S256 method).
 */
function generateCodeChallenge(codeVerifier: string): string {
  return crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
}

/**
 * Build the Twitter OAuth 2.0 authorization URL with PKCE.
 * Returns { url, state, codeVerifier } so the caller can store
 * the state and codeVerifier (e.g. in cookies) for validation in the callback.
 */
export function getTwitterAuthUrl(): {
  url: string;
  state: string;
  codeVerifier: string;
} {
  const state = generateRandomString(32);
  const codeVerifier = generateRandomString(64);
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.TWITTER_CLIENT_ID!,
    redirect_uri: process.env.TWITTER_REDIRECT_URI!,
    scope: "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return {
    url: `https://twitter.com/i/oauth2/authorize?${params}`,
    state,
    codeVerifier,
  };
}

/**
 * Exchange an authorization code for access and refresh tokens, then fetch the user profile.
 */
export async function exchangeTwitterCode(
  code: string,
  codeVerifier: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  name: string;
  username: string;
  profileImageUrl: string | null;
}> {
  // Build Basic auth header from client_id:client_secret
  const credentials = Buffer.from(
    `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
  ).toString("base64");

  const tokenRes = await fetch(`${TWITTER_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.TWITTER_REDIRECT_URI!,
      code_verifier: codeVerifier,
      client_id: process.env.TWITTER_CLIENT_ID!,
    }),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    console.error("[Twitter OAuth] Code exchange failed:", errorText);
    throw new Error(`Failed to exchange Twitter code for token: ${errorText}`);
  }

  const tokenData = await tokenRes.json();

  // Fetch user profile
  const userRes = await fetch(`${TWITTER_API_BASE}/users/me?user.fields=profile_image_url,name,username`, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  if (!userRes.ok) {
    const errorText = await userRes.text();
    console.error("[Twitter OAuth] User info fetch failed:", errorText);
    throw new Error(`Failed to fetch Twitter user info: ${errorText}`);
  }

  const userData = await userRes.json();
  const user = userData.data;

  console.log(`[Twitter OAuth] User: ${user.id} (@${user.username})`);

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    userId: user.id,
    name: user.name || user.username,
    username: user.username,
    profileImageUrl: user.profile_image_url || null,
  };
}

/**
 * Refresh an expired Twitter access token using a refresh token.
 */
export async function refreshTwitterToken(
  refreshToken: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const credentials = Buffer.from(
    `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${TWITTER_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.TWITTER_CLIENT_ID!,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[Twitter Token Refresh] Failed:", errorText);
    throw new Error(`Failed to refresh Twitter token: ${errorText}`);
  }

  const data = await res.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Publish a tweet to Twitter/X.
 * For text-only tweets: posts the text content (max 280 characters).
 * For tweets with images: uploads the media first via v1.1 media/upload, then attaches it.
 *
 * Note: Media upload via v1.1 requires OAuth 1.0a or app-level auth. For OAuth 2.0 PKCE,
 * we use the v2 endpoint for text tweets. Image support requires additional setup.
 */
export async function publishToTwitter(
  accessToken: string,
  content: string,
  imageUrl?: string
): Promise<{ id: string }> {
  console.log(`[Twitter Publish] Publishing tweet, hasImage: ${!!imageUrl}, length: ${content.length}`);

  if (content.length > 280) {
    throw new Error(`Tweet exceeds 280 character limit (${content.length} characters)`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tweetBody: Record<string, any> = {
    text: content,
  };

  // If image URL is provided, upload the media first
  if (imageUrl) {
    try {
      const mediaId = await uploadTwitterMedia(accessToken, imageUrl);
      if (mediaId) {
        tweetBody.media = { media_ids: [mediaId] };
      }
    } catch (imgError) {
      console.error("[Twitter Publish] Media upload failed, posting without image:", imgError);
    }
  }

  const res = await fetch(`${TWITTER_API_BASE}/tweets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tweetBody),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`[Twitter Publish] Error ${res.status}:`, errorBody);
    throw new Error(`Twitter publish failed (${res.status}): ${errorBody}`);
  }

  const result = await res.json();
  const tweetId = result.data?.id;
  console.log(`[Twitter Publish] Success! Tweet ID: ${tweetId}`);
  return { id: tweetId };
}

/**
 * Upload media to Twitter for use in tweets.
 * Uses the v1.1 media upload endpoint with chunked upload for images.
 * Returns the media_id_string to attach to a tweet.
 */
async function uploadTwitterMedia(
  accessToken: string,
  imageUrl: string
): Promise<string | null> {
  console.log(`[Twitter Media] Downloading image from: ${imageUrl}`);

  // Download the image
  const imgResponse = await fetch(imageUrl);
  if (!imgResponse.ok) {
    throw new Error(`Failed to download image: ${imgResponse.status}`);
  }

  const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
  const contentType = imgResponse.headers.get("content-type") || "image/jpeg";
  const totalBytes = imgBuffer.length;

  console.log(`[Twitter Media] Image size: ${totalBytes} bytes, type: ${contentType}`);

  // Step 1: INIT
  const initParams = new URLSearchParams({
    command: "INIT",
    total_bytes: totalBytes.toString(),
    media_type: contentType,
  });

  const initRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: initParams,
  });

  if (!initRes.ok) {
    const errorText = await initRes.text();
    console.error("[Twitter Media] INIT failed:", errorText);
    throw new Error(`Twitter media INIT failed: ${errorText}`);
  }

  const initData = await initRes.json();
  const mediaId = initData.media_id_string;

  // Step 2: APPEND (upload the image data)
  const formData = new FormData();
  formData.append("command", "APPEND");
  formData.append("media_id", mediaId);
  formData.append("segment_index", "0");
  formData.append("media_data", imgBuffer.toString("base64"));

  const appendRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!appendRes.ok) {
    const errorText = await appendRes.text();
    console.error("[Twitter Media] APPEND failed:", errorText);
    throw new Error(`Twitter media APPEND failed: ${errorText}`);
  }

  // Step 3: FINALIZE
  const finalizeParams = new URLSearchParams({
    command: "FINALIZE",
    media_id: mediaId,
  });

  const finalizeRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: finalizeParams,
  });

  if (!finalizeRes.ok) {
    const errorText = await finalizeRes.text();
    console.error("[Twitter Media] FINALIZE failed:", errorText);
    throw new Error(`Twitter media FINALIZE failed: ${errorText}`);
  }

  console.log(`[Twitter Media] Upload complete, media_id: ${mediaId}`);
  return mediaId;
}
