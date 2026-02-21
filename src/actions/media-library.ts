"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMediaAssets(options?: {
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { assets: [], total: 0 };

  const where: Record<string, unknown> = { userId: session.user.id };

  if (options?.tag) {
    where.tags = { has: options.tag };
  }

  if (options?.search) {
    where.OR = [
      { filename: { contains: options.search, mode: "insensitive" } },
      { description: { contains: options.search, mode: "insensitive" } },
      { altText: { contains: options.search, mode: "insensitive" } },
    ];
  }

  const [assets, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit || 30,
      skip: options?.offset || 0,
    }),
    prisma.mediaAsset.count({ where }),
  ]);

  return { assets, total };
}

export async function createMediaAsset(data: {
  filename: string;
  url: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  tags?: string[];
  altText?: string;
  description?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "notAuthenticated" };

  const asset = await prisma.mediaAsset.create({
    data: {
      userId: session.user.id,
      ...data,
      tags: data.tags || [],
    },
  });

  revalidatePath("/library");
  return { asset };
}

export async function updateMediaAsset(
  assetId: string,
  data: { tags?: string[]; altText?: string; description?: string }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "notAuthenticated" };

  await prisma.mediaAsset.update({
    where: { id: assetId, userId: session.user.id },
    data,
  });

  revalidatePath("/library");
  return { success: true };
}

export async function deleteMediaAsset(assetId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "notAuthenticated" };

  await prisma.mediaAsset.delete({
    where: { id: assetId, userId: session.user.id },
  });

  revalidatePath("/library");
  return { success: true };
}

export async function getAllTags() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const assets = await prisma.mediaAsset.findMany({
    where: { userId: session.user.id },
    select: { tags: true },
  });

  const tagSet = new Set<string>();
  assets.forEach((a) => a.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}
