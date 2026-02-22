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

  // Only allow approving posts owned by the user or where user is a team admin/owner
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });
  if (!post) return { error: "postNotFound" };
  if (post.status !== "PENDING_REVIEW") return { error: "notPendingReview" };

  // Prevent self-approval: approver must not be the post author
  if (post.userId === session.user.id) return { error: "cannotSelfApprove" };

  // Verify approver is a team member with appropriate role
  const isTeammate = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
      role: { in: ["OWNER", "ADMIN", "REVIEWER"] },
      team: { members: { some: { userId: post.userId } } },
    },
  });
  if (!isTeammate) return { error: "notAuthorized" };

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

  // Verify rejector is a team member with appropriate role
  const isTeammate = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
      role: { in: ["OWNER", "ADMIN", "REVIEWER"] },
      team: { members: { some: { userId: post.userId } } },
    },
  });
  if (!isTeammate && post.userId !== session.user.id) return { error: "notAuthorized" };

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
  const userId = session.user.id;

  // Only show pending reviews for posts by team members the user can review
  const userTeams = await prisma.teamMember.findMany({
    where: {
      userId,
      role: { in: ["OWNER", "ADMIN", "REVIEWER"] },
    },
    select: { teamId: true },
  });

  if (userTeams.length === 0) return [];

  const teamMemberIds = await prisma.teamMember.findMany({
    where: { teamId: { in: userTeams.map((t) => t.teamId) } },
    select: { userId: true },
  });

  const memberUserIds = [...new Set(teamMemberIds.map((m) => m.userId))].filter(
    (id) => id !== userId
  );

  if (memberUserIds.length === 0) return [];

  return prisma.post.findMany({
    where: {
      status: "PENDING_REVIEW",
      userId: { in: memberUserIds },
    },
    include: {
      user: { select: { name: true, email: true } },
      targets: {
        include: { socialAccount: { select: { platform: true, accountName: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
