"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

export async function updateAISettings(formData: FormData) {
  const t = await getTranslations("common");
  const tSettings = await getTranslations("settings");
  const session = await auth();
  if (!session?.user?.id) {
    return { error: t("notAuthenticated") };
  }

  const aiProvider = formData.get("aiProvider") as string;
  const textModel = formData.get("textModel") as string;
  const imageModel = formData.get("imageModel") as string;
  const analysisModel = formData.get("analysisModel") as string;
  const ollamaUrl = formData.get("ollamaUrl") as string;
  const imageGenUrl = formData.get("imageGenUrl") as string;
  const imageGenProvider = formData.get("imageGenProvider") as string;

  if (!aiProvider || !textModel) {
    return { error: tSettings("providerModelRequired") };
  }

  if (aiProvider === "ollama" && !ollamaUrl) {
    return { error: tSettings("ollamaUrlRequired") };
  }

  if (aiProvider === "claude" && !process.env.ANTHROPIC_API_KEY) {
    return { error: tSettings("noAnthropicKey") };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        aiProvider,
        textModel,
        imageModel: imageModel || "",
        analysisModel: analysisModel || textModel,
        ollamaUrl: ollamaUrl || "http://192.168.178.169:11434",
        imageGenUrl: imageGenUrl || null,
        imageGenProvider: imageGenProvider || "sd-webui",
      },
    });

    revalidatePath("/settings");
    revalidatePath("/ai-models");
    return { success: true };
  } catch (error) {
    console.error("AI settings update error:", error);
    return { error: tSettings("settingsSaveError") };
  }
}
