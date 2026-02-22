import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeLinkedInCode } from "@/lib/social/linkedin";
import { getCredentialsForPlatform } from "@/lib/api-credentials";

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
    const creds = await getCredentialsForPlatform(session.user.id, "linkedin");
    const data = await exchangeLinkedInCode(code, creds);

    await prisma.socialAccount.upsert({
      where: {
        userId_platform_platformUserId: {
          userId: session.user.id,
          platform: "LINKEDIN",
          platformUserId: data.userId,
        },
      },
      update: {
        accessToken: data.accessToken,
        accountName: data.name,
        avatarUrl: data.picture || null,
        tokenExpiresAt: new Date(Date.now() + data.expiresIn * 1000),
        isActive: true,
      },
      create: {
        userId: session.user.id,
        platform: "LINKEDIN",
        platformUserId: data.userId,
        accountName: data.name,
        accountType: "profile",
        accessToken: data.accessToken,
        avatarUrl: data.picture || null,
        tokenExpiresAt: new Date(Date.now() + data.expiresIn * 1000),
      },
    });

    return NextResponse.redirect(
      new URL("/accounts?success=linkedin", baseUrl)
    );
  } catch (error) {
    console.error("LinkedIn OAuth error:", error);
    return NextResponse.redirect(
      new URL("/accounts?error=linkedin_failed", baseUrl)
    );
  }
}
