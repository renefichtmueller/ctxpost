"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

export async function reschedulePost(postId: string, newDate: string) {
  const t = await getTranslations("common");
  const tCal = await getTranslations("calendar");
  const session = await auth();

  if (!session?.user?.id) {
    return { error: t("notLoggedIn") };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId, userId: session.user.id },
  });

  if (!post) {
    return { error: tCal("postNotFound") };
  }

  // Only allow rescheduling for DRAFT, SCHEDULED, or PENDING_REVIEW posts
  if (!["DRAFT", "SCHEDULED", "PENDING_REVIEW"].includes(post.status)) {
    return { error: tCal("cannotReschedule") };
  }

  const scheduledAt = new Date(newDate);

  if (isNaN(scheduledAt.getTime())) {
    return { error: tCal("invalidDate") };
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      scheduledAt,
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/posts");
  revalidatePath("/dashboard");
  revalidatePath("/queue");

  return { success: true };
}
