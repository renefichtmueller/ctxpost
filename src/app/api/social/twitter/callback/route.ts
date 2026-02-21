import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeTwitterCode } from "@/lib/social/twitter";

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
  const state = request.nextUrl.searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(
      new URL("/accounts?error=no_code", baseUrl)
    );
  }

  // Read PKCE code_verifier and state from cookies
  const cookieStore = await cookies();
  const storedCodeVerifier = cookieStore.get("twitter_code_verifier")?.value;
  const storedState = cookieStore.get("twitter_oauth_state")?.value;

  if (!storedCodeVerifier) {
    console.error("[Twitter OAuth] No code_verifier found in cookies");
    return NextResponse.redirect(
      new URL("/accounts?error=twitter_no_verifier", baseUrl)
    );
  }

  // Validate state parameter to prevent CSRF attacks
  if (!state || state !== storedState) {
    console.error("[Twitter OAuth] State mismatch:", { received: state, expected: storedState });
    return NextResponse.redirect(
      new URL("/accounts?error=twitter_state_mismatch", baseUrl)
    );
  }

  try {
    const data = await exchangeTwitterCode(code, storedCodeVerifier);

    await prisma.socialAccount.upsert({
      where: {
        userId_platform_platformUserId: {
          userId: session.user.id,
          platform: "TWITTER",
          platformUserId: data.userId,
        },
      },
      update: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        accountName: `${data.name} (@${data.username})`,
        avatarUrl: data.profileImageUrl,
        tokenExpiresAt: new Date(Date.now() + data.expiresIn * 1000),
        isActive: true,
      },
      create: {
        userId: session.user.id,
        platform: "TWITTER",
        platformUserId: data.userId,
        accountName: `${data.name} (@${data.username})`,
        accountType: "profile",
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        avatarUrl: data.profileImageUrl,
        tokenExpiresAt: new Date(Date.now() + data.expiresIn * 1000),
      },
    });

    // Clear PKCE cookies
    const response = NextResponse.redirect(
      new URL("/accounts?success=twitter", baseUrl)
    );
    response.cookies.delete("twitter_code_verifier");
    response.cookies.delete("twitter_oauth_state");

    return response;
  } catch (error) {
    console.error("[Twitter OAuth] Error:", error);
    return NextResponse.redirect(
      new URL("/accounts?error=twitter_failed", baseUrl)
    );
  }
}
