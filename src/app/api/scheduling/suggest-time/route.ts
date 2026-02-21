import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getNextBestTime } from "@/lib/best-times-defaults";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const platforms: string[] = body.platforms || [];

    if (platforms.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one platform is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const suggestion = getNextBestTime(platforms);

    return new Response(
      JSON.stringify({
        suggestedTime: suggestion.date.toISOString(),
        score: suggestion.score,
        reason: suggestion.reason,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
