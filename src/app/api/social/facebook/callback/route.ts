import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeFacebookCode } from "@/lib/social/facebook";

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
    const { profile, userToken, tokenExpiresAt, pages } = await exchangeFacebookCode(code);

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
        accessToken: userToken,
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
        accessToken: userToken,
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
          accessToken: page.accessToken,
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
          accessToken: page.accessToken,
          avatarUrl: page.avatarUrl,
          followerCount: page.followerCount,
          parentAccountId: profileAccount.id,
        },
      });
      console.log(`[Facebook OAuth] Page account saved: ${pageAccount.id} (${page.name})`);
    }

    return NextResponse.redirect(
      new URL("/accounts?success=facebook", baseUrl)
    );
  } catch (error) {
    console.error("[Facebook OAuth] Error:", error);
    return NextResponse.redirect(
      new URL("/accounts?error=facebook_failed", baseUrl)
    );
  }
}
