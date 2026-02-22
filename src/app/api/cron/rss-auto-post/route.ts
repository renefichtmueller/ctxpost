import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchAllFeeds } from "@/lib/data/rss-monitor";

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

    let created = 0;

    for (const item of items.slice(0, 3)) {
      // Check if a post with this content already exists (dedup)
      const titleSnippet = item.title.slice(0, 50);
      const existing = await prisma.post.findFirst({
        where: {
          content: { contains: titleSnippet },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (existing) continue;

      const content = `${item.title}\n\n${item.snippet || ""}\n\n${item.link || ""}`.trim();

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

    console.log(`[Cron RSS Auto-Post] Created ${created} draft posts from RSS`);
    return NextResponse.json({ created });
  } catch (error) {
    console.error("[Cron RSS Auto-Post] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
