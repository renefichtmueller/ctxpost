/**
 * Facebook Metrics Fetcher
 * Fetches engagement metrics for published Facebook posts.
 */

const GRAPH_API_BASE = "https://graph.facebook.com/v22.0";

interface FacebookMetrics {
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  clicks: number;
}

interface GraphAPIResponse {
  likes?: { summary?: { total_count?: number } };
  comments?: { summary?: { total_count?: number } };
  shares?: { count?: number };
  insights?: {
    data?: Array<{
      name: string;
      values?: Array<{ value: number }>;
    }>;
  };
}

export async function fetchFacebookMetrics(
  platformPostId: string,
  accessToken: string
): Promise<FacebookMetrics> {
  const fields = [
    "likes.summary(true)",
    "comments.summary(true)",
    "shares",
    "insights.metric(post_impressions,post_clicks)",
  ].join(",");

  const url = `${GRAPH_API_BASE}/${platformPostId}?fields=${fields}&access_token=${accessToken}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        `[Facebook Metrics] API Error (${response.status}) for post ${platformPostId}:`,
        errorData
      );

      // On token error -> return 0 values (token might be expired)
      if (response.status === 401 || response.status === 190) {
        return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
      }

      throw new Error(`Facebook API error: ${response.status}`);
    }

    const data: GraphAPIResponse = await response.json();

    const likes = data.likes?.summary?.total_count || 0;
    const comments = data.comments?.summary?.total_count || 0;
    const shares = data.shares?.count || 0;

    // Extract insights
    let impressions = 0;
    let clicks = 0;

    if (data.insights?.data) {
      for (const metric of data.insights.data) {
        if (metric.name === "post_impressions" && metric.values?.[0]) {
          impressions = metric.values[0].value || 0;
        }
        if (metric.name === "post_clicks" && metric.values?.[0]) {
          clicks = metric.values[0].value || 0;
        }
      }
    }

    return { likes, comments, shares, impressions, clicks };
  } catch (error) {
    console.error(`Error fetching metrics for post ${platformPostId}:`, error);
    // On network errors -> return 0 values instead of crashing
    return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
  }
}
