"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { postSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { detectContentType } from "@/lib/utils/content-type-detector";
import { getTranslations } from "next-intl/server";

/** Verify all target account IDs belong to the authenticated user */
async function verifyAccountOwnership(userId: string, accountIds: string[]): Promise<boolean> {
  if (accountIds.length === 0) return true;
  const count = await prisma.socialAccount.count({
    where: { id: { in: accountIds }, userId },
  });
  return count === accountIds.length;
}

export async function createPost(formData: FormData) {
  const t = await getTranslations("common");
  const session = await auth();
  if (!session?.user?.id) {
    return { error: t("notLoggedIn") };
  }

  const rawData = {
    content: formData.get("content") as string,
    scheduledAt: (formData.get("scheduledAt") as string) || null,
    targetAccountIds: formData.getAll("targetAccountIds") as string[],
    status: (formData.get("status") as string) || "DRAFT",
  };

  const parsed = postSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Verify all target accounts belong to this user
  if (!await verifyAccountOwnership(session.user.id, parsed.data.targetAccountIds)) {
    return { error: "Invalid target accounts" };
  }

  const contentType = detectContentType(parsed.data.content);
  const imageUrl = (formData.get("imageUrl") as string) || null;
  const imageDescription = (formData.get("imageDescription") as string) || null;
  const mediaUrls = formData.getAll("mediaUrls") as string[];
  const categoryId = (formData.get("categoryId") as string) || null;
  const isEvergreen = formData.get("isEvergreen") === "true";
  const firstComment = (formData.get("firstComment") as string) || null;

  const post = await prisma.post.create({
    data: {
      userId: session.user.id,
      content: parsed.data.content,
      contentType,
      imageUrl: imageUrl || undefined,
      imageDescription: imageDescription || undefined,
      mediaUrls: mediaUrls.filter(Boolean),
      categoryId: categoryId || undefined,
      isEvergreen,
      firstComment,
      scheduledAt: parsed.data.scheduledAt
        ? new Date(parsed.data.scheduledAt)
        : null,
      status: parsed.data.status as "DRAFT" | "SCHEDULED",
      targets: {
        create: parsed.data.targetAccountIds.map((accountId) => ({
          socialAccountId: accountId,
          status: parsed.data.status as "DRAFT" | "SCHEDULED",
        })),
      },
    },
  });

  revalidatePath("/posts");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  redirect(`/posts`);
}

export async function updatePost(postId: string, formData: FormData) {
  const t = await getTranslations("common");
  const tPosts = await getTranslations("posts");
  const session = await auth();
  if (!session?.user?.id) {
    return { error: t("notLoggedIn") };
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId, userId: session.user.id },
  });

  if (!existingPost) {
    return { error: tPosts("postNotFound") };
  }

  const rawData = {
    content: formData.get("content") as string,
    scheduledAt: (formData.get("scheduledAt") as string) || null,
    targetAccountIds: formData.getAll("targetAccountIds") as string[],
    status: (formData.get("status") as string) || "DRAFT",
  };

  const parsed = postSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Verify all target accounts belong to this user
  if (!await verifyAccountOwnership(session.user.id, parsed.data.targetAccountIds)) {
    return { error: "Invalid target accounts" };
  }

  const contentType = detectContentType(parsed.data.content);
  const imageUrl = (formData.get("imageUrl") as string) || null;
  const imageDescription = (formData.get("imageDescription") as string) || null;
  const mediaUrls = formData.getAll("mediaUrls") as string[];
  const categoryId = (formData.get("categoryId") as string) || null;
  const isEvergreen = formData.get("isEvergreen") === "true";
  const firstComment = (formData.get("firstComment") as string) || null;

  // Delete existing targets and recreate
  await prisma.postTarget.deleteMany({ where: { postId } });

  await prisma.post.update({
    where: { id: postId },
    data: {
      content: parsed.data.content,
      contentType,
      imageUrl: imageUrl || null,
      imageDescription: imageDescription || null,
      mediaUrls: mediaUrls.filter(Boolean),
      categoryId: categoryId || null,
      isEvergreen,
      firstComment,
      scheduledAt: parsed.data.scheduledAt
        ? new Date(parsed.data.scheduledAt)
        : null,
      status: parsed.data.status as "DRAFT" | "SCHEDULED",
      targets: {
        create: parsed.data.targetAccountIds.map((accountId) => ({
          socialAccountId: accountId,
          status: parsed.data.status as "DRAFT" | "SCHEDULED",
        })),
      },
    },
  });

  revalidatePath("/posts");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  redirect("/posts");
}

export async function deletePost(postId: string) {
  const t = await getTranslations("common");
  const session = await auth();
  if (!session?.user?.id) {
    return { error: t("notLoggedIn") };
  }

  await prisma.post.delete({
    where: { id: postId, userId: session.user.id },
  });

  revalidatePath("/posts");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

export async function retryPost(postId: string) {
  const t = await getTranslations("common");
  const session = await auth();
  if (!session?.user?.id) {
    return { error: t("notLoggedIn") };
  }

  await prisma.post.update({
    where: { id: postId, userId: session.user.id },
    data: {
      status: "SCHEDULED",
      scheduledAt: new Date(),
      errorMsg: null,
      targets: {
        updateMany: {
          where: { status: "FAILED" },
          data: { status: "SCHEDULED", errorMsg: null },
        },
      },
    },
  });

  revalidatePath("/posts");
  revalidatePath("/dashboard");
}

export async function bulkCreatePosts(
  posts: Array<{
    content: string;
    scheduledAt: string | null;
    status: "DRAFT" | "SCHEDULED";
    targetAccountIds: string[];
  }>
) {
  const session = await auth();
  if (!session?.user?.id) return { created: 0, errors: posts.length };

  // Collect all unique account IDs and verify ownership in one query
  const allAccountIds = [...new Set(posts.flatMap((p) => p.targetAccountIds))];
  if (!await verifyAccountOwnership(session.user.id, allAccountIds)) {
    return { created: 0, errors: posts.length };
  }

  let created = 0;
  let errors = 0;

  for (const post of posts) {
    try {
      const contentType = detectContentType(post.content);
      await prisma.post.create({
        data: {
          userId: session.user.id,
          content: post.content,
          contentType,
          scheduledAt: post.scheduledAt ? new Date(post.scheduledAt) : null,
          status: post.status,
          targets: {
            create: post.targetAccountIds.map((accountId) => ({
              socialAccountId: accountId,
              status: post.status,
            })),
          },
        },
      });
      created++;
    } catch {
      errors++;
    }
  }

  revalidatePath("/posts");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  return { created, errors };
}
