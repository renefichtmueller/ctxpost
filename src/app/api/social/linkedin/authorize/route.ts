import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLinkedInAuthUrl } from "@/lib/social/linkedin";
import { getCredentialsForPlatform } from "@/lib/api-credentials";

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  const creds = await getCredentialsForPlatform(session.user.id, "linkedin");
  const { url, state } = getLinkedInAuthUrl(creds);

  const response = NextResponse.redirect(url);

  response.cookies.set("linkedin_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return response;
}
