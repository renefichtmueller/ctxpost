import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find evergreen posts that were published >7 days ago and haven't been recycled in 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const evergreenPosts = await prisma.post.findMany({
      where: {
        isEvergreen: true,
        status: "PUBLISHED",
        publishedAt: { lte: sevenDaysAgo },
        OR: [
          { lastRecycledAt: null },
          { lastRecycledAt: { lte: sevenDaysAgo } },
        ],
      },
      include: {
        targets: {
          select: { socialAccountId: true },
        },
      },
      take: 3, // Max 3 per run to avoid spam
      orderBy: { lastRecycledAt: { sort: "asc", nulls: "first" } },
    });

    if (evergreenPosts.length === 0) {
      return NextResponse.json({ recycled: 0, message: "No evergreen posts due for recycling" });
    }

    let recycled = 0;
    for (const post of evergreenPosts) {
      // Create a new post with the same content
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      // Add some randomness to avoid all recycled posts going at the same time
      tomorrow.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));

      await prisma.post.create({
        data: {
          userId: post.userId,
          content: post.content,
          contentType: post.contentType,
          imageUrl: post.imageUrl,
          imageDescription: post.imageDescription,
          mediaUrls: post.mediaUrls,
          categoryId: post.categoryId,
          isEvergreen: false, // The recycled copy is not evergreen itself
          scheduledAt: tomorrow,
          status: "SCHEDULED",
          targets: {
            create: post.targets.map((t) => ({
              socialAccountId: t.socialAccountId,
              status: "SCHEDULED" as const,
            })),
          },
        },
      });

      // Update the original post's lastRecycledAt
      await prisma.post.update({
        where: { id: post.id },
        data: { lastRecycledAt: new Date() },
      });

      recycled++;
    }

    console.log(`[Cron Recycle] Recycled ${recycled} evergreen posts`);
    return NextResponse.json({ recycled });
  } catch (error) {
    console.error("[Cron Recycle] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
