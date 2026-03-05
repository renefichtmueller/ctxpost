import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishPost } from "@/lib/social/publisher";
import { detectContentType } from "@/lib/utils/content-type-detector";

/**
 * POST /api/posts/publish-now
 * Immediately publishes a post to the specified social accounts.
 * Body: { content: string; accountIds: string[] }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { content?: string; accountIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { content, accountIds } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }
  if (!accountIds || accountIds.length === 0) {
    return NextResponse.json({ error: "At least one accountId is required" }, { status: 400 });
  }

  // Verify all accounts belong to the authenticated user
  const ownedCount = await prisma.socialAccount.count({
    where: { id: { in: accountIds }, userId: session.user.id, isActive: true },
  });
  if (ownedCount !== accountIds.length) {
    return NextResponse.json({ error: "One or more accounts not found or not active" }, { status: 403 });
  }

  const contentType = detectContentType(content);

  // Create the post record
  const post = await prisma.post.create({
    data: {
      userId: session.user.id,
      content: content.trim(),
      contentType,
      status: "SCHEDULED",
      scheduledAt: new Date(), // Immediately due
      targets: {
        create: accountIds.map((accountId) => ({
          socialAccountId: accountId,
          status: "SCHEDULED" as const,
        })),
      },
    },
  });

  // Publish immediately
  try {
    await publishPost(post.id);

    // Fetch the updated post to return results
    const updatedPost = await prisma.post.findUnique({
      where: { id: post.id },
      include: {
        targets: {
          include: { socialAccount: { select: { platform: true, accountName: true } } },
        },
      },
    });

    const results = updatedPost?.targets.map((t) => ({
      platform: t.socialAccount.platform,
      accountName: t.socialAccount.accountName,
      status: t.status,
      error: t.errorMsg ?? null,
    })) ?? [];

    const anySuccess = results.some((r) => r.status === "PUBLISHED");
    const allFailed = results.every((r) => r.status === "FAILED");

    return NextResponse.json({
      success: anySuccess,
      postId: post.id,
      results,
      ...(allFailed ? { error: "All platforms failed to publish" } : {}),
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown publish error";
    console.error("[publish-now] Publish error:", errorMsg);

    return NextResponse.json({
      success: false,
      postId: post.id,
      error: errorMsg,
      results: [],
    }, { status: 500 });
  }
}
