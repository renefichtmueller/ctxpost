import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTwitterAuthUrl } from "@/lib/social/twitter";

/**
 * Twitter OAuth 2.0 PKCE authorization initiation route.
 * Sets the code_verifier and state in httpOnly cookies, then redirects
 * the user to Twitter's authorization endpoint.
 */
export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  const { url, state, codeVerifier } = getTwitterAuthUrl();

  const response = NextResponse.redirect(url);

  // Store PKCE values in httpOnly cookies for the callback to read
  response.cookies.set("twitter_code_verifier", codeVerifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  response.cookies.set("twitter_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  return response;
}
