import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeInstagramCode } from "@/lib/social/instagram";
import { getInstagramCredentials } from "@/lib/api-credentials";

function getBaseUrl(): string {
  return process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl();

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      new URL("/accounts?error=no_code", baseUrl)
    );
  }

  try {
    const creds = await getInstagramCredentials(session.user.id);
    const { userToken, tokenExpiresAt, igAccounts } =
      await exchangeInstagramCode(code, creds);

    // Save each Instagram Business Account found
    for (const igAccount of igAccounts) {
      const account = await prisma.socialAccount.upsert({
        where: {
          userId_platform_platformUserId: {
            userId: session.user.id,
            platform: "INSTAGRAM",
            platformUserId: igAccount.igUserId,
          },
        },
        update: {
          accessToken: igAccount.pageAccessToken,
          accountName: `@${igAccount.username}`,
          avatarUrl: igAccount.profilePictureUrl,
          followerCount: igAccount.followersCount,
          tokenExpiresAt,
          isActive: true,
        },
        create: {
          userId: session.user.id,
          platform: "INSTAGRAM",
          platformUserId: igAccount.igUserId,
          accountName: `@${igAccount.username}`,
          accountType: "business",
          accessToken: igAccount.pageAccessToken,
          avatarUrl: igAccount.profilePictureUrl,
          followerCount: igAccount.followersCount,
          tokenExpiresAt,
        },
      });

      console.log(
        `[Instagram OAuth] Account saved: ${account.id} (@${igAccount.username})`
      );
    }

    return NextResponse.redirect(
      new URL("/accounts?success=instagram", baseUrl)
    );
  } catch (error) {
    console.error("[Instagram OAuth] Error:", error);
    return NextResponse.redirect(
      new URL("/accounts?error=instagram_failed", baseUrl)
    );
  }
}
