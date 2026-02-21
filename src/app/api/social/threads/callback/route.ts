import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeThreadsCode } from "@/lib/social/threads";

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
    const data = await exchangeThreadsCode(code);

    await prisma.socialAccount.upsert({
      where: {
        userId_platform_platformUserId: {
          userId: session.user.id,
          platform: "THREADS",
          platformUserId: data.userId,
        },
      },
      update: {
        accessToken: data.accessToken,
        accountName: `@${data.username}`,
        avatarUrl: data.profilePictureUrl,
        tokenExpiresAt: data.tokenExpiresAt,
        isActive: true,
      },
      create: {
        userId: session.user.id,
        platform: "THREADS",
        platformUserId: data.userId,
        accountName: `@${data.username}`,
        accountType: "profile",
        accessToken: data.accessToken,
        avatarUrl: data.profilePictureUrl,
        tokenExpiresAt: data.tokenExpiresAt,
      },
    });

    return NextResponse.redirect(
      new URL("/accounts?success=threads", baseUrl)
    );
  } catch (error) {
    console.error("[Threads OAuth] Error:", error);
    return NextResponse.redirect(
      new URL("/accounts?error=threads_failed", baseUrl)
    );
  }
}
