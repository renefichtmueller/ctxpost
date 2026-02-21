"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitForReview(postId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "notAuthenticated" };

  const post = await prisma.post.findUnique({
    where: { id: postId, userId: session.user.id },
  });
  if (!post) return { error: "postNotFound" };
  if (post.status !== "DRAFT") return { error: "onlyDraftsCanBeSubmitted" };

  await prisma.post.update({
    where: { id: postId },
    data: { status: "PENDING_REVIEW" },
  });

  revalidatePath("/posts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function approvePost(postId: string, note?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "notAuthenticated" };

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });
  if (!post) return { error: "postNotFound" };
  if (post.status !== "PENDING_REVIEW") return { error: "notPendingReview" };

  await prisma.post.update({
    where: { id: postId },
    data: {
      status: post.scheduledAt ? "SCHEDULED" : "DRAFT",
      approvedBy: session.user.id,
      approvedAt: new Date(),
      approvalNote: note || null,
    },
  });

  revalidatePath("/posts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function rejectPost(postId: string, note: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "notAuthenticated" };

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });
  if (!post) return { error: "postNotFound" };
  if (post.status !== "PENDING_REVIEW") return { error: "notPendingReview" };

  await prisma.post.update({
    where: { id: postId },
    data: {
      status: "DRAFT",
      approvalNote: note,
    },
  });

  revalidatePath("/posts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getPendingReviews() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.post.findMany({
    where: { status: "PENDING_REVIEW" },
    include: {
      user: { select: { name: true, email: true } },
      targets: {
        include: { socialAccount: { select: { platform: true, accountName: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
