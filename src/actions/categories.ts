"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.contentCategory.findMany({
    where: { userId: session.user.id },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createCategory(data: {
  name: string;
  color?: string;
  icon?: string;
  description?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "notAuthenticated" };

  const existing = await prisma.contentCategory.findUnique({
    where: { userId_name: { userId: session.user.id, name: data.name } },
  });
  if (existing) return { error: "categoryExists" };

  const maxOrder = await prisma.contentCategory.aggregate({
    where: { userId: session.user.id },
    _max: { sortOrder: true },
  });

  await prisma.contentCategory.create({
    data: {
      userId: session.user.id,
      name: data.name,
      color: data.color || "#6366f1",
      icon: data.icon || undefined,
      description: data.description || undefined,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/posts");
  revalidatePath("/settings");
  return { success: true };
}

export async function updateCategory(
  categoryId: string,
  data: { name?: string; color?: string; icon?: string; description?: string }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "notAuthenticated" };

  await prisma.contentCategory.update({
    where: { id: categoryId, userId: session.user.id },
    data,
  });

  revalidatePath("/posts");
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteCategory(categoryId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "notAuthenticated" };

  await prisma.contentCategory.delete({
    where: { id: categoryId, userId: session.user.id },
  });

  revalidatePath("/posts");
  revalidatePath("/settings");
  return { success: true };
}
