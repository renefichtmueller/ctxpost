import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeFacebookCode } from "@/lib/social/facebook";
import { getCredentialsForPlatform } from "@/lib/api-credentials";
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
  const storedState = cookieStore.get("facebook_oauth_state")?.value;
  if (!state || state !== storedState) {
    console.error("[Facebook OAuth] State mismatch detected");
    return NextResponse.redirect(
      new URL("/accounts?error=facebook_state_mismatch", baseUrl)
    );
  }

  try {
    const creds = await getCredentialsForPlatform(session.user.id, "facebook");
    const { profile, userToken, tokenExpiresAt, pages } = await exchangeFacebookCode(code, creds);

    // Always save the user profile account
    const profileAccount = await prisma.socialAccount.upsert({
      where: {
        userId_platform_platformUserId: {
          userId: session.user.id,
          platform: "FACEBOOK",
          platformUserId: profile.id,
        },
      },
      update: {
        accessToken: encryptToken(userToken),
        tokenExpiresAt,
        accountName: profile.name,
        avatarUrl: profile.picture,
        isActive: true,
      },
      create: {
        userId: session.user.id,
        platform: "FACEBOOK",
        platformUserId: profile.id,
        accountName: profile.name,
        accountType: "profile",
        accessToken: encryptToken(userToken),
        tokenExpiresAt,
        avatarUrl: profile.picture,
      },
    });

    console.log(`[Facebook OAuth] Profile account saved: ${profileAccount.id} (${profile.name})`);

    // Also save any Facebook Pages the user manages
    for (const page of pages) {
      // Page tokens derived from long-lived user tokens don't expire
      const pageAccount = await prisma.socialAccount.upsert({
        where: {
          userId_platform_platformUserId: {
            userId: session.user.id,
            platform: "FACEBOOK",
            platformUserId: page.id,
          },
        },
        update: {
          accessToken: encryptToken(page.accessToken),
          accountName: `📄 ${page.name}`,
          avatarUrl: page.avatarUrl,
          followerCount: page.followerCount,
          parentAccountId: profileAccount.id,
          isActive: true,
        },
        create: {
          userId: session.user.id,
          platform: "FACEBOOK",
          platformUserId: page.id,
          accountName: `📄 ${page.name}`,
          accountType: "page",
          accessToken: encryptToken(page.accessToken),
          avatarUrl: page.avatarUrl,
          followerCount: page.followerCount,
          parentAccountId: profileAccount.id,
        },
      });
      console.log(`[Facebook OAuth] Page account saved: ${pageAccount.id} (${page.name})`);
    }

    const response = NextResponse.redirect(
      new URL("/accounts?success=facebook", baseUrl)
    );
    response.cookies.delete("facebook_oauth_state");
    return response;
  } catch (error) {
    console.error("[Facebook OAuth] Error:", error);
    return NextResponse.redirect(
      new URL("/accounts?error=facebook_failed", baseUrl)
    );
  }
}
