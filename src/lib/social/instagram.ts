const GRAPH_API_VERSION = "v22.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Instagram Graph API (via Facebook)
 * Instagram Business accounts are linked through Facebook Pages.
 * Uses shared Facebook App credentials (FACEBOOK_APP_ID, FACEBOOK_APP_SECRET).
 * Requires INSTAGRAM_REDIRECT_URI env var.
 */

type InstagramCredentials = {
  appId: string;
  appSecret: string;
  redirectUri: string;
};

export function getInstagramAuthUrl(creds?: InstagramCredentials): string {
  const appId = creds?.appId || process.env.FACEBOOK_APP_ID!;
  const redirectUri = creds?.redirectUri || process.env.INSTAGRAM_REDIRECT_URI!;

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope:
      "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement",
    response_type: "code",
    state,
  });
  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params}`;
}

export async function exchangeInstagramCode(code: string, creds?: InstagramCredentials) {
  const appId = creds?.appId || process.env.FACEBOOK_APP_ID!;
  const appSecret = creds?.appSecret || process.env.FACEBOOK_APP_SECRET!;
  const redirectUri = creds?.redirectUri || process.env.INSTAGRAM_REDIRECT_URI!;

  // Step 1: Exchange code for short-lived user access token
  const tokenRes = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?` +
      new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      })
  );

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    console.error("[Instagram OAuth] Code exchange failed:", errorText);
    throw new Error("Failed to exchange Instagram code for token");
  }

  const tokenData = await tokenRes.json();
  const userAccessToken = tokenData.access_token;

  // Step 2: Exchange for long-lived token
  const longLivedRes = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: userAccessToken,
      })
  );

  if (!longLivedRes.ok) {
    const errorText = await longLivedRes.text();
    console.error(
      "[Instagram OAuth] Long-lived token exchange failed:",
      errorText
    );
    throw new Error("Failed to get long-lived Instagram token");
  }

  const longLivedData = await longLivedRes.json();
  const longLivedToken = longLivedData.access_token;

  // Long-lived tokens are valid for ~60 days
  const tokenExpiresAt = longLivedData.expires_in
    ? new Date(Date.now() + longLivedData.expires_in * 1000)
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // Default 60 days

  // Step 3: Get user's Facebook Pages
  const pagesRes = await fetch(
    `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${longLivedToken}`
  );

  if (!pagesRes.ok) {
    const errorText = await pagesRes.text();
    console.error("[Instagram OAuth] Pages fetch failed:", errorText);
    throw new Error("Failed to fetch Facebook pages for Instagram");
  }

  const pagesData = await pagesRes.json();
  const pages = pagesData.data || [];

  // Step 4: Find pages with linked Instagram Business Accounts
  const igAccounts: Array<{
    igUserId: string;
    username: string;
    profilePictureUrl: string | null;
    followersCount: number | null;
    mediaCount: number | null;
    pageAccessToken: string;
  }> = [];

  for (const page of pages) {
    if (!page.instagram_business_account?.id) continue;

    const igUserId = page.instagram_business_account.id;

    // Fetch Instagram Business Account details
    const igRes = await fetch(
      `${GRAPH_API_BASE}/${igUserId}?fields=id,username,profile_picture_url,followers_count,media_count&access_token=${page.access_token}`
    );

    if (!igRes.ok) {
      console.warn(
        `[Instagram OAuth] Failed to fetch IG account ${igUserId}:`,
        await igRes.text()
      );
      continue;
    }

    const igData = await igRes.json();

    igAccounts.push({
      igUserId: igData.id,
      username: igData.username || `ig_user_${igData.id}`,
      profilePictureUrl: igData.profile_picture_url || null,
      followersCount: igData.followers_count ?? null,
      mediaCount: igData.media_count ?? null,
      pageAccessToken: page.access_token,
    });

    console.log(
      `[Instagram OAuth] Found IG account: @${igData.username} (${igData.id})`
    );
  }

  if (igAccounts.length === 0) {
    throw new Error(
      "No Instagram Business accounts found. Make sure your Instagram account is linked to a Facebook Page and is a Business or Creator account."
    );
  }

  return {
    userToken: longLivedToken,
    tokenExpiresAt,
    igAccounts,
  };
}

/**
 * Validate an Instagram access token.
 * Returns true if the token is still valid.
 */
export async function validateInstagramToken(
  accessToken: string
): Promise<boolean> {
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
 * Publish a post to Instagram.
 * Instagram REQUIRES an image for every post (no text-only posts via API).
 *
 * Step 1: Create media container with image_url and caption
 * Step 2: Publish the container
 */
export async function publishToInstagram(
  igUserId: string,
  accessToken: string,
  content: string,
  imageUrl: string
): Promise<{ id: string }> {
  console.log(
    `[Instagram Publish] Publishing to IG user ${igUserId}, image: ${imageUrl}`
  );

  // Step 1: Create media container
  const containerParams = new URLSearchParams({
    access_token: accessToken,
    caption: content,
    image_url: imageUrl,
  });

  const containerRes = await fetch(
    `${GRAPH_API_BASE}/${igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: containerParams.toString(),
    }
  );

  if (!containerRes.ok) {
    const errorBody = await containerRes.text();
    console.error(
      `[Instagram Publish] Container creation failed (${containerRes.status}):`,
      errorBody
    );
    throw new Error(
      `Instagram media container creation failed (${containerRes.status}): ${errorBody}`
    );
  }

  const containerData = await containerRes.json();
  const creationId = containerData.id;

  if (!creationId) {
    throw new Error("Instagram media container creation returned no ID");
  }

  console.log(
    `[Instagram Publish] Container created: ${creationId}`
  );

  // Step 2: Publish the container
  const publishParams = new URLSearchParams({
    access_token: accessToken,
    creation_id: creationId,
  });

  const publishRes = await fetch(
    `${GRAPH_API_BASE}/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: publishParams.toString(),
    }
  );

  if (!publishRes.ok) {
    const errorBody = await publishRes.text();
    console.error(
      `[Instagram Publish] Publish failed (${publishRes.status}):`,
      errorBody
    );
    throw new Error(
      `Instagram publish failed (${publishRes.status}): ${errorBody}`
    );
  }

  const result = await publishRes.json();
  console.log(`[Instagram Publish] Success! Post ID: ${result.id}`);
  return result;
}
