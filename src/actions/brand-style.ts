"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

export async function saveBrandStyle(formData: FormData) {
  const t = await getTranslations("common");
  const tSettings = await getTranslations("settings");
  const session = await auth();
  if (!session?.user?.id) {
    return { error: t("notAuthenticated") };
  }

  const userId = session.user.id;

  const name = (formData.get("name") as string) || "Standard";
  const tone = (formData.get("tone") as string) || "professional";
  const formality = (formData.get("formality") as string) || "formal";
  const emojiUsage = (formData.get("emojiUsage") as string) || "moderate";
  const targetAudience = (formData.get("targetAudience") as string) || null;
  const brandVoice = (formData.get("brandVoice") as string) || null;
  const avoidTopics = (formData.get("avoidTopics") as string) || null;
  const preferredTopics = (formData.get("preferredTopics") as string) || null;
  const hashtagStrategy = (formData.get("hashtagStrategy") as string) || "moderate";
  const preferredHashtags = (formData.get("preferredHashtags") as string) || null;
  const languages = (formData.get("languages") as string) || "de";
  const customInstructions = (formData.get("customInstructions") as string) || null;

  // Validate required fields
  if (!tone || !formality || !emojiUsage) {
    return { error: tSettings("brandStyleRequired") };
  }

  try {
    await prisma.brandStyleGuide.upsert({
      where: { userId },
      create: {
        userId,
        name,
        tone,
        formality,
        emojiUsage,
        targetAudience,
        brandVoice,
        avoidTopics,
        preferredTopics,
        hashtagStrategy,
        preferredHashtags,
        languages,
        customInstructions,
      },
      update: {
        name,
        tone,
        formality,
        emojiUsage,
        targetAudience,
        brandVoice,
        avoidTopics,
        preferredTopics,
        hashtagStrategy,
        preferredHashtags,
        languages,
        customInstructions,
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Brand style save error:", error);
    return { error: tSettings("brandStyleSaveError") };
  }
}

export async function deleteBrandStyle() {
  const t = await getTranslations("common");
  const tSettings = await getTranslations("settings");
  const session = await auth();
  if (!session?.user?.id) {
    return { error: t("notAuthenticated") };
  }

  try {
    await prisma.brandStyleGuide.deleteMany({
      where: { userId: session.user.id },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Brand style delete error:", error);
    return { error: tSettings("brandStyleDeleteError") };
  }
}
