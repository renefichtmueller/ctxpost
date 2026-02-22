const THREADS_API_BASE = "https://graph.threads.net";

/**
 * Threads API
 * Threads has its own OAuth flow and API, separate from Facebook/Instagram.
 * Env vars: THREADS_APP_ID, THREADS_APP_SECRET, THREADS_REDIRECT_URI
 * API Docs: https://developers.facebook.com/docs/threads
 */

type ThreadsCredentials = {
  appId: string;
  appSecret: string;
  redirectUri: string;
};

export function getThreadsAuthUrl(creds?: ThreadsCredentials): string {
  const appId = creds?.appId || process.env.THREADS_APP_ID!;
  const redirectUri = creds?.redirectUri || process.env.THREADS_REDIRECT_URI!;

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "threads_basic,threads_content_publish,threads_manage_replies",
    response_type: "code",
    state,
  });
  return `https://threads.net/oauth/authorize?${params}`;
}

export async function exchangeThreadsCode(code: string, creds?: ThreadsCredentials) {
  const appId = creds?.appId || process.env.THREADS_APP_ID!;
  const appSecret = creds?.appSecret || process.env.THREADS_APP_SECRET!;
  const redirectUri = creds?.redirectUri || process.env.THREADS_REDIRECT_URI!;

  // Step 1: Exchange code for short-lived access token
  const tokenRes = await fetch(
    `${THREADS_API_BASE}/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code,
      }),
    }
  );

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    console.error("[Threads OAuth] Code exchange failed:", errorText);
    throw new Error("Failed to exchange Threads code for token");
  }

  const tokenData = await tokenRes.json();
  const shortLivedToken = tokenData.access_token;
  const threadsUserId = tokenData.user_id;

  // Step 2: Exchange for long-lived token
  const longLivedRes = await fetch(
    `${THREADS_API_BASE}/access_token?` +
      new URLSearchParams({
        grant_type: "th_exchange_token",
        client_secret: appSecret,
        access_token: shortLivedToken,
      })
  );

  if (!longLivedRes.ok) {
    const errorText = await longLivedRes.text();
    console.error(
      "[Threads OAuth] Long-lived token exchange failed:",
      errorText
    );
    throw new Error("Failed to get long-lived Threads token");
  }

  const longLivedData = await longLivedRes.json();
  const longLivedToken = longLivedData.access_token;

  // Long-lived tokens are valid for ~60 days
  const tokenExpiresAt = longLivedData.expires_in
    ? new Date(Date.now() + longLivedData.expires_in * 1000)
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // Default 60 days

  // Step 3: Fetch user profile
  const profileRes = await fetch(
    `${THREADS_API_BASE}/me?fields=id,username,threads_profile_picture_url&access_token=${longLivedToken}`
  );

  if (!profileRes.ok) {
    const errorText = await profileRes.text();
    console.error("[Threads OAuth] Profile fetch failed:", errorText);
    throw new Error("Failed to fetch Threads profile");
  }

  const profileData = await profileRes.json();

  console.log(
    `[Threads OAuth] Profile: @${profileData.username} (${profileData.id})`
  );

  return {
    accessToken: longLivedToken,
    tokenExpiresAt,
    userId: String(threadsUserId || profileData.id),
    username: profileData.username || `threads_user_${profileData.id}`,
    profilePictureUrl: profileData.threads_profile_picture_url || null,
  };
}

/**
 * Validate a Threads access token.
 * Returns true if the token is still valid.
 */
export async function validateThreadsToken(
  accessToken: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${THREADS_API_BASE}/me?access_token=${accessToken}`
    );
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Publish a post to Threads.
 * Threads supports text-only posts and posts with images.
 *
 * Step 1: Create media container
 * Step 2: Publish the container
 */
export async function publishToThreads(
  threadsUserId: string,
  accessToken: string,
  content: string,
  imageUrl?: string
): Promise<{ id: string }> {
  console.log(
    `[Threads Publish] Publishing to user ${threadsUserId}, hasImage: ${!!imageUrl}`
  );

  // Step 1: Create media container
  const containerParams = new URLSearchParams({
    access_token: accessToken,
    text: content,
    media_type: imageUrl ? "IMAGE" : "TEXT",
  });

  if (imageUrl) {
    containerParams.append("image_url", imageUrl);
  }

  const containerRes = await fetch(
    `${THREADS_API_BASE}/${threadsUserId}/threads`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: containerParams.toString(),
    }
  );

  if (!containerRes.ok) {
    const errorBody = await containerRes.text();
    console.error(
      `[Threads Publish] Container creation failed (${containerRes.status}):`,
      errorBody
    );
    throw new Error(
      `Threads media container creation failed (${containerRes.status}): ${errorBody}`
    );
  }

  const containerData = await containerRes.json();
  const creationId = containerData.id;

  if (!creationId) {
    throw new Error("Threads media container creation returned no ID");
  }

  console.log(`[Threads Publish] Container created: ${creationId}`);

  // Step 2: Publish the container
  const publishParams = new URLSearchParams({
    access_token: accessToken,
    creation_id: creationId,
  });

  const publishRes = await fetch(
    `${THREADS_API_BASE}/${threadsUserId}/threads_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: publishParams.toString(),
    }
  );

  if (!publishRes.ok) {
    const errorBody = await publishRes.text();
    console.error(
      `[Threads Publish] Publish failed (${publishRes.status}):`,
      errorBody
    );
    throw new Error(
      `Threads publish failed (${publishRes.status}): ${errorBody}`
    );
  }

  const result = await publishRes.json();
  console.log(`[Threads Publish] Success! Post ID: ${result.id}`);
  return result;
}
