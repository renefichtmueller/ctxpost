/**
 * POST /api/ai/crawl-enhance
 *
 * Manual trigger for the RSS+AI pipeline.
 * Fetches latest RSS items, enhances them with AI, and creates draft posts.
 * Requires authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuthAndRateLimit } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { fetchAllFeeds } from "@/lib/data/rss-monitor";
import { getUserAIConfig } from "@/lib/ai/ai-provider";
import { enhanceRSSItemsBatch } from "@/lib/ai/rss-enhancer";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes — AI enhancement can take time

export async function POST(request: NextRequest) {
  const authResult = await withAuthAndRateLimit(request);
  if (authResult instanceof NextResponse) return authResult;

  const userId = authResult.userId;

  // Parse optional request params
  let limit = 3;
  let categories: string[] | undefined;
  let skipDedup = false;

  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.limit === "number") limit = Math.min(Math.max(1, body.limit), 10);
    if (Array.isArray(body.categories)) categories = body.categories;
    if (body.skipDedup === true) skipDedup = true;
  } catch {
    // Ignore parse errors, use defaults
  }

  try {
    // Fetch RSS items
    const items = await fetchAllFeeds(categories, limit + 5); // fetch extra to account for dedup

    if (items.length === 0) {
      return NextResponse.json({ created: 0, aiEnhanced: 0, message: "No RSS items found" });
    }

    // Get user's active social accounts
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        socialAccounts: {
          where: { isActive: true },
          select: { id: true },
          take: 1,
        },
      },
    });

    // Dedup: filter out items already posted in the last 48h
    const filteredItems = skipDedup
      ? items
      : await filterDuplicates(items);

    const itemsToProcess = filteredItems.slice(0, limit);

    if (itemsToProcess.length === 0) {
      return NextResponse.json({
        created: 0,
        aiEnhanced: 0,
        message: "All fetched RSS items were already posted recently (dedup)",
      });
    }

    // Load AI config
    const aiConfig = await getUserAIConfig(userId, "text");

    // Enhance items with AI (sequential to avoid LLM overload)
    const enhanced = await enhanceRSSItemsBatch(itemsToProcess, aiConfig);

    // Create draft posts
    let created = 0;
    let aiEnhancedCount = 0;

    for (const { item, content, aiEnhanced } of enhanced) {
      await prisma.post.create({
        data: {
          userId,
          content,
          contentType: "LINK",
          status: "DRAFT",
          targets: user?.socialAccounts?.length
            ? {
                create: user.socialAccounts.map((sa) => ({
                  socialAccountId: sa.id,
                  status: "DRAFT" as const,
                })),
              }
            : undefined,
        },
      });

      created++;
      if (aiEnhanced) aiEnhancedCount++;

      console.log(
        `[Crawl Enhance] Created draft: "${item.title.slice(0, 60)}…" (AI: ${aiEnhanced})`
      );
    }

    return NextResponse.json({
      created,
      aiEnhanced: aiEnhancedCount,
      rawFallback: created - aiEnhancedCount,
      model: aiConfig.model,
      provider: aiConfig.provider,
    });
  } catch (error) {
    console.error("[Crawl Enhance] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * Filters out RSS items that were already posted in the last 48 hours.
 */
async function filterDuplicates(
  items: Awaited<ReturnType<typeof fetchAllFeeds>>
) {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const filtered: typeof items = [];
  for (const item of items) {
    const titleSnippet = item.title.slice(0, 50);
    const existing = await prisma.post.findFirst({
      where: {
        content: { contains: titleSnippet },
        createdAt: { gte: since },
      },
      select: { id: true },
    });
    if (!existing) filtered.push(item);
  }
  return filtered;
}
