/**
 * GET /api/trends/google
 *
 * Returns trending topics derived from the configured RSS feeds.
 * (Google Trends API requires authentication — this uses RSS-based trending
 * as an equivalent, license-free alternative.)
 */

import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { fetchAllFeeds, extractTrendingTopics } from "@/lib/data/rss-monitor";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);

  try {
    const items = await fetchAllFeeds(undefined, limit + 10);
    const trendingTopics = extractTrendingTopics(items, limit);

    return NextResponse.json({
      trends: trendingTopics.slice(0, limit),
      source: "rss",
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Trends/Google] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trends", trends: [] },
      { status: 500 }
    );
  }
}
