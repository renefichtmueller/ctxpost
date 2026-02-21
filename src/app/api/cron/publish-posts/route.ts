import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishPost } from "@/lib/social/publisher";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds for publishing

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("[Cron Publish] Unauthorized request. Check CRON_SECRET environment variable.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find posts due for publishing
    const duePosts = await prisma.post.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: new Date() },
      },
      include: {
        targets: {
          include: { socialAccount: { select: { platform: true, accountName: true } } },
        },
      },
      take: 10,
      orderBy: { scheduledAt: "asc" },
    });

    if (duePosts.length === 0) {
      return NextResponse.json({ processed: 0, message: "No posts due" });
    }

    console.log(`[Cron Publish] Found ${duePosts.length} post(s) due for publishing`);
    for (const post of duePosts) {
      const targets = post.targets.map(t => `${t.socialAccount.platform}:${t.socialAccount.accountName}`);
      console.log(`[Cron Publish] Post ${post.id}: scheduled for ${post.scheduledAt?.toISOString()}, targets: ${targets.join(", ")}`);
    }

    // Publish each post sequentially to avoid rate limits
    const summary = [];
    for (const post of duePosts) {
      const targetDesc = post.targets
        .map(t => `${t.socialAccount.platform}:${t.socialAccount.accountName}`)
        .join(", ");
      try {
        console.log(`[Cron Publish] Publishing post ${post.id} to: ${targetDesc}`);
        await publishPost(post.id);
        console.log(`[Cron Publish] Post ${post.id} published successfully to: ${targetDesc}`);
        summary.push({ postId: post.id, status: "fulfilled" as const });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`[Cron Publish] Post ${post.id} failed for targets [${targetDesc}]:`, errorMsg);
        summary.push({ postId: post.id, status: "rejected" as const, error: errorMsg });
      }
    }

    const succeeded = summary.filter(s => s.status === "fulfilled").length;
    const failed = summary.filter(s => s.status === "rejected").length;
    console.log(`[Cron Publish] Finished: ${succeeded} succeeded, ${failed} failed`);

    return NextResponse.json({
      processed: duePosts.length,
      succeeded,
      failed,
      results: summary,
    });
  } catch (error) {
    console.error("[Cron Publish] Fatal error:", error);
    return NextResponse.json(
      { error: "Internal error during post publishing" },
      { status: 500 }
    );
  }
}
