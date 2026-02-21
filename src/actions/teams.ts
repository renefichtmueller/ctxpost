"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import type { TeamRole } from "@prisma/client";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createTeam(name: string) {
  const t = await getTranslations("common");
  const session = await auth();
  if (!session?.user?.id) {
    return { error: t("notAuthenticated") };
  }

  if (!name || name.trim().length < 2) {
    return { error: "Team name must be at least 2 characters" };
  }

  let slug = slugify(name);

  // Ensure unique slug
  const existing = await prisma.team.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const team = await prisma.team.create({
    data: {
      name: name.trim(),
      slug,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });

  revalidatePath("/team");
  return { team };
}

export async function getMyTeams() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const memberships = await prisma.teamMember.findMany({
    where: { userId: session.user.id },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    ...m.team,
    myRole: m.role,
  }));
}

export async function inviteMember(
  teamId: string,
  email: string,
  role: TeamRole
) {
  const t = await getTranslations("common");
  const session = await auth();
  if (!session?.user?.id) {
    return { error: t("notAuthenticated") };
  }

  // Check requester is OWNER or ADMIN
  const requester = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });

  if (!requester || (requester.role !== "OWNER" && requester.role !== "ADMIN")) {
    return { error: "Only owners and admins can invite members" };
  }

  // Prevent inviting someone as OWNER
  if (role === "OWNER") {
    return { error: "Cannot assign OWNER role through invitation" };
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    return { error: "No user found with this email address" };
  }

  // Check if already a member
  const existingMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: user.id } },
  });

  if (existingMember) {
    return { error: "User is already a member of this team" };
  }

  const member = await prisma.teamMember.create({
    data: {
      teamId,
      userId: user.id,
      role,
      invitedBy: session.user.id,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  revalidatePath("/team");
  return { member };
}

export async function removeMember(teamId: string, userId: string) {
  const t = await getTranslations("common");
  const session = await auth();
  if (!session?.user?.id) {
    return { error: t("notAuthenticated") };
  }

  // Check requester is OWNER or ADMIN
  const requester = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });

  if (!requester || (requester.role !== "OWNER" && requester.role !== "ADMIN")) {
    return { error: "Only owners and admins can remove members" };
  }

  // Cannot remove an OWNER
  const target = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  if (!target) {
    return { error: "Member not found" };
  }

  if (target.role === "OWNER") {
    return { error: "Cannot remove the team owner" };
  }

  // Admins cannot remove other admins
  if (requester.role === "ADMIN" && target.role === "ADMIN") {
    return { error: "Admins cannot remove other admins" };
  }

  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId, userId } },
  });

  revalidatePath("/team");
  return { success: true };
}

export async function updateMemberRole(
  teamId: string,
  userId: string,
  newRole: TeamRole
) {
  const t = await getTranslations("common");
  const session = await auth();
  if (!session?.user?.id) {
    return { error: t("notAuthenticated") };
  }

  // Only OWNER can change roles
  const requester = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });

  if (!requester || requester.role !== "OWNER") {
    return { error: "Only the team owner can change roles" };
  }

  // Cannot change own role
  if (userId === session.user.id) {
    return { error: "Cannot change your own role" };
  }

  // Cannot set another member to OWNER
  if (newRole === "OWNER") {
    return { error: "Cannot assign OWNER role" };
  }

  const target = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  if (!target) {
    return { error: "Member not found" };
  }

  const updated = await prisma.teamMember.update({
    where: { teamId_userId: { teamId, userId } },
    data: { role: newRole },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  revalidatePath("/team");
  return { member: updated };
}

export async function getTeamMembers(teamId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  // Check requester is a member of the team
  const requester = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });

  if (!requester) {
    return [];
  }

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: [
      { role: "asc" },
      { joinedAt: "asc" },
    ],
  });

  return members;
}
