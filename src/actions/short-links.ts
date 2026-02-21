"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

export async function createShortLink(data: {
  url: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "notAuthenticated" };

  try {
    new URL(data.url);
  } catch {
    return { error: "invalidUrl" };
  }

  const shortCode = nanoid(7);

  const link = await prisma.shortLink.create({
    data: {
      userId: session.user.id,
      originalUrl: data.url,
      shortCode,
      utmSource: data.utmSource || undefined,
      utmMedium: data.utmMedium || undefined,
      utmCampaign: data.utmCampaign || undefined,
      utmTerm: data.utmTerm || undefined,
      utmContent: data.utmContent || undefined,
    },
  });

  revalidatePath("/links");
  return { link };
}

export async function getShortLinks() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.shortLink.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function deleteShortLink(linkId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "notAuthenticated" };

  await prisma.shortLink.delete({
    where: { id: linkId, userId: session.user.id },
  });

  revalidatePath("/links");
  return { success: true };
}
