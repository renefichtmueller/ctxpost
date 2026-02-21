import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text, postId } = await request.json();
  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { aiProvider: true, textModel: true, ollamaUrl: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const prompt = `Analyze the sentiment of the following social media content. Return a JSON object with these fields:
- "score": a number from -1.0 (very negative) to 1.0 (very positive), 0 is neutral
- "label": one of "positive", "neutral", "negative"
- "confidence": a number from 0 to 1
- "emotions": array of detected emotions (e.g., "joy", "excitement", "frustration")
- "suggestion": a brief suggestion to improve the tone if needed

Text: "${text.slice(0, 2000)}"

Respond with ONLY the JSON object, no markdown.`;

  try {
    let result: string;

    if (user.aiProvider === "ollama") {
      const res = await fetch(`${user.ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: user.textModel,
          prompt,
          stream: false,
        }),
      });
      const data = await res.json();
      result = data.response;
    } else {
      // Claude API
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      result = data.content?.[0]?.text || "{}";
    }

    // Parse the JSON response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    const sentiment = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 0, label: "neutral", confidence: 0, emotions: [], suggestion: "" };

    return NextResponse.json({ sentiment });
  } catch (error) {
    console.error("[Sentiment Analysis] Error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
