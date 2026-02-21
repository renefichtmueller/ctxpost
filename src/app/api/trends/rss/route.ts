import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { fetchAllFeeds, extractTrendingTopics } from "@/lib/data/rss-monitor";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const categories = searchParams.get("categories")?.split(",") || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  const items = await fetchAllFeeds(categories, limit);
  const trendingTopics = extractTrendingTopics(items);

  return NextResponse.json({
    items,
    trendingTopics,
    fetchedAt: new Date().toISOString(),
  });
}
