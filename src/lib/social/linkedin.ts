const LINKEDIN_API_VERSION = "202601";

type LinkedInCredentials = {
  appId: string;
  appSecret: string;
  redirectUri: string;
};

export function getLinkedInAuthUrl(creds?: LinkedInCredentials): string {
  const clientId = creds?.appId || process.env.LINKEDIN_CLIENT_ID!;
  const redirectUri = creds?.redirectUri || process.env.LINKEDIN_REDIRECT_URI!;

  let scope = "openid profile email w_member_social";

  // Add organization scopes if enabled (requires special LinkedIn approval)
  if (process.env.LINKEDIN_ORG_SCOPE) {
    scope += " r_organization_social w_organization_social";
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state: crypto.randomUUID(),
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
}

export async function exchangeLinkedInCode(code: string, creds?: LinkedInCredentials) {
  const clientId = creds?.appId || process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = creds?.appSecret || process.env.LINKEDIN_CLIENT_SECRET!;
  const redirectUri = creds?.redirectUri || process.env.LINKEDIN_REDIRECT_URI!;

  // Exchange code for access token
  const tokenRes = await fetch(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }
  );

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    console.error("LinkedIn token exchange error:", errorText);
    throw new Error(`Failed to exchange LinkedIn code for token: ${errorText}`);
  }

  const tokenData = await tokenRes.json();

  // Get user info via OpenID Connect userinfo endpoint
  const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  if (!userRes.ok) {
    const errorText = await userRes.text();
    console.error("LinkedIn userinfo error:", errorText);
    throw new Error(`Failed to fetch LinkedIn user info: ${errorText}`);
  }

  const userData = await userRes.json();
  console.log("LinkedIn userinfo response:", JSON.stringify(userData));

  // Build display name from available fields
  const displayName =
    userData.name ||
    userData.given_name ||
    userData.email ||
    `LinkedIn User ${userData.sub}`;

  return {
    accessToken: tokenData.access_token,
    expiresIn: tokenData.expires_in,
    userId: userData.sub,
    name: displayName,
    email: userData.email,
    picture: userData.picture,
  };
}

export interface LinkedInOrganization {
  orgId: string;
  name: string;
  vanityName: string | null;
  logoUrl: string | null;
}

/**
 * Fetch LinkedIn organizations the authenticated user is an administrator of.
 * Requires r_organization_social scope.
 */
export async function getLinkedInOrganizations(
  accessToken: string
): Promise<LinkedInOrganization[]> {
  try {
    // Step 1: Get organization ACLs for the authenticated user
    const aclRes = await fetch(
      "https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "LinkedIn-Version": LINKEDIN_API_VERSION,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    if (!aclRes.ok) {
      const errorText = await aclRes.text();
      console.error("[LinkedIn Organizations] ACL fetch failed:", errorText);
      throw new Error(`Failed to fetch LinkedIn organizations: ${errorText}`);
    }

    const aclData = await aclRes.json();
    const elements = aclData.elements || [];

    if (elements.length === 0) {
      return [];
    }

    // Step 2: Fetch details for each organization
    const organizations: LinkedInOrganization[] = [];

    for (const acl of elements) {
      // Extract org ID from the organization URN (e.g., "urn:li:organization:12345")
      const orgUrn: string = acl.organization || acl["organization~"]?.id || "";
      const orgId = orgUrn.replace("urn:li:organization:", "");

      if (!orgId) continue;

      try {
        const orgRes = await fetch(
          `https://api.linkedin.com/rest/organizations/${orgId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "LinkedIn-Version": LINKEDIN_API_VERSION,
              "X-Restli-Protocol-Version": "2.0.0",
            },
          }
        );

        if (orgRes.ok) {
          const orgData = await orgRes.json();
          organizations.push({
            orgId,
            name: orgData.localizedName || orgData.name?.localized?.en_US || `Organization ${orgId}`,
            vanityName: orgData.vanityName || null,
            logoUrl: orgData.logoV2?.original || orgData.logoV2?.["cropped~"]?.elements?.[0]?.identifiers?.[0]?.identifier || null,
          });
        } else {
          console.warn(`[LinkedIn Organizations] Failed to fetch org ${orgId}:`, await orgRes.text());
          organizations.push({
            orgId,
            name: `Organization ${orgId}`,
            vanityName: null,
            logoUrl: null,
          });
        }
      } catch (orgError) {
        console.error(`[LinkedIn Organizations] Error fetching org ${orgId}:`, orgError);
        organizations.push({
          orgId,
          name: `Organization ${orgId}`,
          vanityName: null,
          logoUrl: null,
        });
      }
    }

    console.log(`[LinkedIn Organizations] Found ${organizations.length} organization(s)`);
    return organizations;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Failed to fetch LinkedIn")) {
      throw error;
    }
    console.error("[LinkedIn Organizations] Unexpected error:", error);
    throw new Error(`Failed to fetch LinkedIn organizations: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Post a comment on a LinkedIn post (used for first comment feature).
 * Returns the comment URN.
 */
export async function postLinkedInComment(
  postUrn: string,
  accessToken: string,
  authorUrn: string,
  comment: string
): Promise<{ id: string }> {
  console.log(`[LinkedIn First Comment] Posting comment on ${postUrn}`);

  const res = await fetch(`https://api.linkedin.com/rest/socialActions/${encodeURIComponent(postUrn)}/comments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": LINKEDIN_API_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      actor: authorUrn,
      message: {
        text: comment,
      },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`[LinkedIn First Comment] Error ${res.status}:`, errorBody);
    throw new Error(`LinkedIn first comment failed (${res.status}): ${errorBody}`);
  }

  const commentId = res.headers.get("x-restli-id") || "";
  console.log(`[LinkedIn First Comment] Success! Comment ID: ${commentId}`);
  return { id: commentId };
}

export async function publishToLinkedIn(
  personUrn: string,
  accessToken: string,
  content: string,
  imageUrl?: string,
  isOrganization?: boolean
): Promise<{ id: string }> {
  const author = isOrganization
    ? `urn:li:organization:${personUrn}`
    : `urn:li:person:${personUrn}`;

  // Build post body — with or without image
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const postBody: Record<string, any> = {
    author,
    commentary: content,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
  };

  if (imageUrl) {
    try {
      // Step 1: Register image upload
      const initRes = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "LinkedIn-Version": LINKEDIN_API_VERSION,
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          initializeUploadRequest: {
            owner: author,
          },
        }),
      });

      if (initRes.ok) {
        const initData = await initRes.json();
        const uploadUrl = initData.value?.uploadUrl;
        const imageUrn = initData.value?.image;

        if (uploadUrl && imageUrn) {
          // Step 2: Download the image and upload to LinkedIn
          const imgResponse = await fetch(imageUrl);
          const imgBuffer = await imgResponse.arrayBuffer();

          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/octet-stream",
            },
            body: imgBuffer,
          });

          if (uploadRes.ok) {
            // Step 3: Attach image to post
            postBody.content = {
              media: {
                altText: content.slice(0, 200),
                id: imageUrn,
              },
            };
          }
        }
      }
    } catch (imgError) {
      // If image upload fails, post without image
      console.error("LinkedIn image upload failed, posting without image:", imgError);
    }
  }

  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": LINKEDIN_API_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(postBody),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`LinkedIn publish failed: ${error}`);
  }

  const postId = res.headers.get("x-restli-id") || "";
  return { id: postId };
}
