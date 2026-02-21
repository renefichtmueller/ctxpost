/**
 * LinkedIn Metrics Fetcher
 * Fetches engagement metrics for published LinkedIn posts.
 *
 * Note: LinkedIn API requires special scopes (r_organization_social, r_member_social)
 * which may not yet be available. Therefore this implementation returns 0 values
 * when the API is not reachable.
 */

interface LinkedInMetrics {
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  clicks: number;
}

export async function fetchLinkedInMetrics(
  platformPostId: string,
  accessToken: string
): Promise<LinkedInMetrics> {
  try {
    // LinkedIn API v2 - Social Actions
    const statsUrl = `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(platformPostId)}?count=true`;

    const response = await fetch(statsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });

    if (!response.ok) {
      console.error(
        `[LinkedIn Metrics] API Error (${response.status}) for post ${platformPostId}`
      );
      return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
    }

    const data = await response.json();

    const likes = data.likesSummary?.totalLikes || 0;
    const comments = data.commentsSummary?.totalFirstLevelComments || 0;

    // Shares are harder to retrieve on LinkedIn
    // Impressions/clicks require r_organization_social scope
    return {
      likes,
      comments,
      shares: 0,
      impressions: 0,
      clicks: 0,
    };
  } catch (error) {
    console.error(
      `Error fetching LinkedIn metrics for post ${platformPostId}:`,
      error
    );
    return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
  }
}
