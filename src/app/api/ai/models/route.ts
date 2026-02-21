import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { listOllamaModels } from "@/lib/ai/ollama-client";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const t = await getTranslations("models");

  try {
    const body = await request.json();
    const { ollamaUrl } = body;

    if (!ollamaUrl) {
      return NextResponse.json(
        { error: t("ollamaUrlRequired") },
        { status: 400 }
      );
    }

    const models = await listOllamaModels(ollamaUrl);
    return NextResponse.json({ models });
  } catch (error) {
    console.error("Ollama models error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : t("modelsLoadError"),
      },
      { status: 500 }
    );
  }
}
