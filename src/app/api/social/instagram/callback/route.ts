import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeInstagramCode } from "@/lib/social/instagram";
import { getInstagramCredentials } from "@/lib/api-credentials";
import { encrypt } from "@/lib/crypto";

function encryptToken(token: string): string {
  if (!process.env.ENCRYPTION_KEY) return token;
  try { return encrypt(token); } catch { return token; }
}

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

  // Validate CSRF state parameter
  const state = request.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const storedState = cookieStore.get("instagram_oauth_state")?.value;
  if (!state || state !== storedState) {
    console.error("[Instagram OAuth] State mismatch detected");
    return NextResponse.redirect(
      new URL("/accounts?error=instagram_state_mismatch", baseUrl)
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
          accessToken: encryptToken(igAccount.pageAccessToken),
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
          accessToken: encryptToken(igAccount.pageAccessToken),
          avatarUrl: igAccount.profilePictureUrl,
          followerCount: igAccount.followersCount,
          tokenExpiresAt,
        },
      });

      console.log(
        `[Instagram OAuth] Account saved: ${account.id} (@${igAccount.username})`
      );
    }

    const response = NextResponse.redirect(
      new URL("/accounts?success=instagram", baseUrl)
    );
    response.cookies.delete("instagram_oauth_state");
    return response;
  } catch (error) {
    console.error("[Instagram OAuth] Error:", error);
    return NextResponse.redirect(
      new URL("/accounts?error=instagram_failed", baseUrl)
    );
  }
}
