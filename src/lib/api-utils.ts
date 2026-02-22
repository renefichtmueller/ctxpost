import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, type RateLimitConfig, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * Wraps an API route handler with auth check + rate limiting.
 */
export async function withAuthAndRateLimit(
  request: Request,
  config: RateLimitConfig = RATE_LIMITS.ai
): Promise<{ userId: string } | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed, remaining, resetAt } = checkRateLimit(
    `${session.user.id}:${new URL(request.url).pathname}`,
    config
  );

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return { userId: session.user.id };
}
