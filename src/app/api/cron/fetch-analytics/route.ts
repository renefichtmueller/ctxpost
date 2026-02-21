import { prisma } from "@/lib/prisma";
import { fetchFacebookMetrics } from "@/lib/social/facebook-metrics";
import { fetchLinkedInMetrics } from "@/lib/social/linkedin-metrics";

export const maxDuration = 120; // 2 minutes

export async function GET(request: Request) {
  // Check auth
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Find all published post targets with platformPostId
    const targets = await prisma.postTarget.findMany({
      where: {
        status: "PUBLISHED",
        platformPostId: { not: null },
      },
      include: {
        post: {
          select: { id: true, userId: true },
        },
        socialAccount: {
          select: {
            platform: true,
            accessToken: true,
            platformUserId: true,
          },
        },
      },
      take: 50, // Max 50 per run
    });

    if (targets.length === 0) {
      return Response.json({
        message: "No published posts to analyze",
        processed: 0,
      });
    }

    const results = await Promise.allSettled(
      targets.map(async (target) => {
        if (!target.platformPostId) return null;

        const platform = target.socialAccount.platform;
        const accessToken = target.socialAccount.accessToken;

        let metrics;
        if (platform === "FACEBOOK") {
          metrics = await fetchFacebookMetrics(target.platformPostId, accessToken);
        } else if (platform === "LINKEDIN") {
          metrics = await fetchLinkedInMetrics(target.platformPostId, accessToken);
        } else {
          return null;
        }

        // Calculate engagement rate
        const totalEngagement = metrics.likes + metrics.comments + metrics.shares;
        const engagementRate =
          metrics.impressions > 0
            ? totalEngagement / metrics.impressions
            : null;

        // Save to PostAnalytics
        await prisma.postAnalytics.create({
          data: {
            postId: target.post.id,
            platform,
            likes: metrics.likes,
            comments: metrics.comments,
            shares: metrics.shares,
            impressions: metrics.impressions,
            clicks: metrics.clicks,
            engagementRate,
          },
        });

        return {
          postId: target.post.id,
          platform,
          likes: metrics.likes,
          comments: metrics.comments,
          shares: metrics.shares,
          impressions: metrics.impressions,
        };
      })
    );

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value !== null
    ).length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `[Analytics Cron] ${successful} posts analyzed, ${failed} failed`
    );

    return Response.json({
      message: `Analytics fetched`,
      processed: successful,
      failed,
      total: targets.length,
    });
  } catch (error) {
    console.error("[Analytics Cron] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal error fetching analytics",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
