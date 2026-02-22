import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishToFacebook, validateFacebookToken } from "@/lib/social/facebook";
import { publishToLinkedIn } from "@/lib/social/linkedin";

/**
 * Test endpoint: Immediately publishes a test message to a connected social account.
 * POST /api/social/test-publish
 * Body: { accountId: string, message?: string }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { accountId, message } = body;

  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  const account = await prisma.socialAccount.findFirst({
    where: {
      id: accountId,
      userId: session.user.id,
      isActive: true,
    },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const testMessage = message || `🧪 Test post from CtxPost - ${new Date().toLocaleString()}`;

  try {
    if (account.platform === "FACEBOOK") {
      if (account.accountType === "profile") {
        return NextResponse.json({
          error: "Cannot post to personal Facebook profiles via API. Please use a Facebook Page.",
        }, { status: 400 });
      }

      // Validate token first
      const tokenValid = await validateFacebookToken(account.accessToken);
      if (!tokenValid) {
        return NextResponse.json({
          error: "Facebook access token is invalid or expired. Please reconnect the account.",
          tokenExpired: true,
        }, { status: 401 });
      }

      const result = await publishToFacebook(
        account.platformUserId,
        account.accessToken,
        testMessage
      );

      return NextResponse.json({
        success: true,
        platform: "FACEBOOK",
        postId: result.id,
        message: testMessage,
        accountName: account.accountName,
      });
    } else if (account.platform === "LINKEDIN") {
      const result = await publishToLinkedIn(
        account.platformUserId,
        account.accessToken,
        testMessage
      );

      return NextResponse.json({
        success: true,
        platform: "LINKEDIN",
        postId: result.id,
        message: testMessage,
        accountName: account.accountName,
      });
    } else {
      return NextResponse.json({
        error: `Platform "${account.platform}" is not supported yet`,
      }, { status: 400 });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Test Publish] Failed for ${account.platform} (${account.accountName}):`, errorMsg);

    return NextResponse.json({
      success: false,
      error: errorMsg,
      platform: account.platform,
      accountName: account.accountName,
    }, { status: 500 });
  }
}
