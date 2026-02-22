import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const t = await getTranslations("models");
  let modelName: string;

  try {
    const body = await request.json();
    modelName = body.modelName;
  } catch {
    return NextResponse.json(
      { error: t("invalidRequest") },
      { status: 400 }
    );
  }

  if (!modelName) {
    return NextResponse.json(
      { error: t("modelNameRequired") },
      { status: 400 }
    );
  }

  // Get user's Ollama URL
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { ollamaUrl: true, textModel: true, imageModel: true, analysisModel: true },
  });

  const ollamaUrl = user?.ollamaUrl || "http://localhost:11434";

  // Prevent deleting any active model
  const activeModels = [user?.textModel, user?.imageModel, user?.analysisModel].filter(Boolean);
  if (activeModels.includes(modelName)) {
    return NextResponse.json(
      { error: t("modelAssigned") },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${ollamaUrl}/api/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: t("ollamaError", { error: errorText }) },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, modelName });
  } catch (error) {
    console.error("Model delete error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : t("modelDeleteError"),
      },
      { status: 500 }
    );
  }
}
