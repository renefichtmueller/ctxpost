import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchAllFeeds } from "@/lib/data/rss-monitor";
import { getUserAIConfig } from "@/lib/ai/ai-provider";
import { enhanceRSSItemWithAI } from "@/lib/ai/rss-enhancer";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await fetchAllFeeds(undefined, 5);

    if (items.length === 0) {
      return NextResponse.json({ created: 0, message: "No new RSS items" });
    }

    // Only create RSS drafts for the first admin user (oldest account)
    // to prevent spamming all users with unsolicited draft posts
    const adminUser = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        socialAccounts: {
          where: { isActive: true },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!adminUser || adminUser.socialAccounts.length === 0) {
      return NextResponse.json({ created: 0, message: "No admin user with active accounts" });
    }

    // Load AI config for the admin user (graceful: falls back to raw content if unavailable)
    let aiConfig;
    try {
      aiConfig = await getUserAIConfig(adminUser.id, "text");
    } catch (err) {
      console.warn("[Cron RSS Auto-Post] Could not load AI config:", err);
    }

    let created = 0;
    let aiEnhancedCount = 0;

    for (const item of items.slice(0, 3)) {
      // Check if a post with this content already exists (dedup by title prefix within 24h)
      const titleSnippet = item.title.slice(0, 50);
      const existing = await prisma.post.findFirst({
        where: {
          content: { contains: titleSnippet },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (existing) continue;

      // Enhance with AI if available, fall back to raw content
      let content: string;
      let aiEnhanced = false;

      if (aiConfig) {
        const result = await enhanceRSSItemWithAI(item, aiConfig);
        content = result.content;
        aiEnhanced = result.aiEnhanced;
      } else {
        content = `${item.title}\n\n${item.snippet || ""}\n\n${item.link || ""}`.trim();
      }

      if (aiEnhanced) aiEnhancedCount++;

      await prisma.post.create({
        data: {
          userId: adminUser.id,
          content,
          contentType: "LINK",
          status: "DRAFT",
          targets: {
            create: adminUser.socialAccounts.map((sa) => ({
              socialAccountId: sa.id,
              status: "DRAFT" as const,
            })),
          },
        },
      });
      created++;
    }

    console.log(
      `[Cron RSS Auto-Post] Created ${created} draft posts (${aiEnhancedCount} AI-enhanced, ${created - aiEnhancedCount} raw)`
    );
    return NextResponse.json({ created, aiEnhanced: aiEnhancedCount });
  } catch (error) {
    console.error("[Cron RSS Auto-Post] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
