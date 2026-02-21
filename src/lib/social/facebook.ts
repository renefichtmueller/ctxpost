const GRAPH_API_VERSION = "v22.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export function getFacebookAuthUrl(): string {
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: process.env.FACEBOOK_REDIRECT_URI!,
    scope: "pages_show_list,pages_manage_posts,pages_read_engagement,read_insights",
    response_type: "code",
    state,
  });
  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params}`;
}

export async function exchangeFacebookCode(code: string) {
  // Exchange code for user access token
  const tokenRes = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?` +
      new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID!,
        client_secret: process.env.FACEBOOK_APP_SECRET!,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI!,
        code,
      })
  );

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    console.error("[Facebook OAuth] Code exchange failed:", errorText);
    throw new Error("Failed to exchange Facebook code for token");
  }

  const tokenData = await tokenRes.json();
  const userAccessToken = tokenData.access_token;

  // Exchange for long-lived token
  const longLivedRes = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.FACEBOOK_APP_ID!,
        client_secret: process.env.FACEBOOK_APP_SECRET!,
        fb_exchange_token: userAccessToken,
      })
  );

  if (!longLivedRes.ok) {
    const errorText = await longLivedRes.text();
    console.error("[Facebook OAuth] Long-lived token exchange failed:", errorText);
    throw new Error("Failed to get long-lived Facebook token");
  }

  const longLivedData = await longLivedRes.json();
  // Long-lived tokens are valid for ~60 days
  const tokenExpiresAt = longLivedData.expires_in
    ? new Date(Date.now() + longLivedData.expires_in * 1000)
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // Default 60 days

  // Get user profile info
  const profileRes = await fetch(
    `${GRAPH_API_BASE}/me?fields=id,name,picture&access_token=${longLivedData.access_token}`
  );
  if (!profileRes.ok) {
    console.error("[Facebook OAuth] Profile fetch failed:", await profileRes.text());
    throw new Error("Failed to fetch Facebook profile");
  }
  const profileData = await profileRes.json();
  console.log("[Facebook OAuth] Profile:", profileData.id, profileData.name);

  // Get user's pages with all relevant fields
  const pagesRes = await fetch(
    `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token,category,fan_count,picture&access_token=${longLivedData.access_token}`
  );
  if (!pagesRes.ok) {
    console.error("[Facebook OAuth] Pages fetch failed:", await pagesRes.text());
    throw new Error("Failed to fetch Facebook pages");
  }
  const pagesData = await pagesRes.json();
  console.log("[Facebook OAuth] Found", pagesData.data?.length || 0, "pages");

  return {
    userToken: longLivedData.access_token,
    tokenExpiresAt,
    profile: {
      id: profileData.id,
      name: profileData.name || "Facebook User",
      picture: profileData.picture?.data?.url || null,
    },
    pages: (pagesData.data || []).map(
      (page: {
        id: string;
        name: string;
        access_token: string;
        category?: string;
        fan_count?: number;
        picture?: { data?: { url?: string } };
      }) => ({
        id: page.id,
        name: page.name,
        accessToken: page.access_token,
        category: page.category || null,
        followerCount: page.fan_count || null,
        avatarUrl: page.picture?.data?.url || null,
      })
    ),
  };
}

/**
 * Validate a Facebook access token
 * Returns true if the token is still valid, false otherwise
 */
export async function validateFacebookToken(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${GRAPH_API_BASE}/me?access_token=${accessToken}`
    );
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Refresh a Facebook Page access token using the user access token.
 * Page tokens obtained via a long-lived user token are already long-lived.
 */
export async function refreshFacebookPageToken(
  userAccessToken: string,
  pageId: string
): Promise<string> {
  try {
    const res = await fetch(
      `${GRAPH_API_BASE}/${pageId}?fields=access_token&access_token=${userAccessToken}`
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Facebook Token Refresh] Failed for page ${pageId}:`, errorText);
      throw new Error(`Failed to refresh Facebook page token: ${errorText}`);
    }

    const data = await res.json();
    if (!data.access_token) {
      throw new Error("No access_token returned from Facebook page token refresh");
    }

    console.log(`[Facebook Token Refresh] Successfully refreshed token for page ${pageId}`);
    return data.access_token;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Failed to refresh")) {
      throw error;
    }
    console.error("[Facebook Token Refresh] Unexpected error:", error);
    throw new Error(`Failed to refresh Facebook page token: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Post a first comment on a Facebook post.
 * Returns the comment ID.
 */
export async function postFirstComment(
  pageId: string,
  postId: string,
  accessToken: string,
  comment: string
): Promise<{ id: string }> {
  console.log(`[Facebook First Comment] Posting comment on ${postId}`);

  const params = new URLSearchParams();
  params.append("access_token", accessToken);
  params.append("message", comment);

  const res = await fetch(`${GRAPH_API_BASE}/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`[Facebook First Comment] Error ${res.status}:`, errorBody);
    throw new Error(`Facebook first comment failed (${res.status}): ${errorBody}`);
  }

  const result = await res.json();
  console.log(`[Facebook First Comment] Success! Comment ID: ${result.id}`);
  return result;
}

/** Error categories for Facebook API errors */
export type FacebookErrorCategory =
  | "TOKEN_EXPIRED"
  | "PERMISSION_DENIED"
  | "RATE_LIMIT"
  | "INVALID_PARAMETER"
  | "SERVER_ERROR"
  | "UNKNOWN";

/**
 * Categorize a Facebook API error based on error code and subcode.
 */
function categorizeFacebookError(errorCode?: number, errorSubcode?: number): FacebookErrorCategory {
  // Token expired or invalid
  if (errorCode === 190) return "TOKEN_EXPIRED";
  if (errorSubcode === 463 || errorSubcode === 467) return "TOKEN_EXPIRED";

  // Permission denied
  if (errorCode === 200 || errorCode === 10) return "PERMISSION_DENIED";
  if (errorCode === 3) return "PERMISSION_DENIED";

  // Rate limiting
  if (errorCode === 4 || errorCode === 17 || errorCode === 32) return "RATE_LIMIT";
  if (errorCode === 613) return "RATE_LIMIT";

  // Invalid parameters
  if (errorCode === 100) return "INVALID_PARAMETER";

  // Server errors
  if (errorCode === 1 || errorCode === 2) return "SERVER_ERROR";

  return "UNKNOWN";
}

/** Helper to detect URLs in content text */
function extractFirstUrl(content: string): string | null {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/i;
  const match = content.match(urlRegex);
  return match ? match[0] : null;
}

export async function publishToFacebook(
  pageId: string,
  accessToken: string,
  content: string,
  imageUrl?: string
): Promise<{ id: string }> {
  console.log(`[Facebook Publish] Publishing to page ${pageId}, hasImage: ${!!imageUrl}`);

  // Facebook Graph API accepts URL-encoded form data, NOT JSON
  let endpoint: string;
  const params = new URLSearchParams();
  params.append("access_token", accessToken);

  if (imageUrl) {
    // Post with image — use photos endpoint
    endpoint = `${GRAPH_API_BASE}/${pageId}/photos`;
    params.append("caption", content);
    params.append("url", imageUrl);
  } else {
    // Text-only post — check for link attachment
    endpoint = `${GRAPH_API_BASE}/${pageId}/feed`;
    const detectedUrl = extractFirstUrl(content);

    if (detectedUrl) {
      // Post with link attachment: set the link and let Facebook unfurl it
      params.append("message", content);
      params.append("link", detectedUrl);
      console.log(`[Facebook Publish] Detected URL in content, attaching as link: ${detectedUrl}`);
    } else {
      params.append("message", content);
    }
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    let errorMessage = "Unknown error";
    let errorCategory: FacebookErrorCategory = "UNKNOWN";

    try {
      const errorJson = JSON.parse(errorBody);
      const fbError = errorJson.error;
      errorMessage = fbError?.message || fbError?.type || errorBody;
      errorCategory = categorizeFacebookError(fbError?.code, fbError?.error_subcode);

      console.error(`[Facebook Publish] Error ${res.status} [${errorCategory}]:`, {
        code: fbError?.code,
        subcode: fbError?.error_subcode,
        type: fbError?.type,
        message: fbError?.message,
        fbtrace_id: fbError?.fbtrace_id,
        category: errorCategory,
        pageId,
      });
    } catch {
      console.error(`[Facebook Publish] Error ${res.status} (non-JSON): ${errorBody}`);
      errorMessage = errorBody;
    }

    throw new Error(`Facebook publish failed [${errorCategory}] (${res.status}): ${errorMessage}`);
  }

  const result = await res.json();
  console.log(`[Facebook Publish] Success! Post ID: ${result.id}`);
  return result;
}
