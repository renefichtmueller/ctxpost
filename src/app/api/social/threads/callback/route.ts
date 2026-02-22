import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeThreadsCode } from "@/lib/social/threads";
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
  const storedState = cookieStore.get("threads_oauth_state")?.value;
  if (!state || state !== storedState) {
    console.error("[Threads OAuth] State mismatch detected");
    return NextResponse.redirect(
      new URL("/accounts?error=threads_state_mismatch", baseUrl)
    );
  }

  try {
    const creds = await getCredentialsForPlatform(session.user.id, "threads");
    const data = await exchangeThreadsCode(code, creds);

    await prisma.socialAccount.upsert({
      where: {
        userId_platform_platformUserId: {
          userId: session.user.id,
          platform: "THREADS",
          platformUserId: data.userId,
        },
      },
      update: {
        accessToken: encryptToken(data.accessToken),
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
        accessToken: encryptToken(data.accessToken),
        avatarUrl: data.profilePictureUrl,
        tokenExpiresAt: data.tokenExpiresAt,
      },
    });

    const response = NextResponse.redirect(
      new URL("/accounts?success=threads", baseUrl)
    );
    response.cookies.delete("threads_oauth_state");
    return response;
  } catch (error) {
    console.error("[Threads OAuth] Error:", error);
    return NextResponse.redirect(
      new URL("/accounts?error=threads_failed", baseUrl)
    );
  }
}
