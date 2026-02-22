import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { PostForm } from "@/components/posts/post-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCategories } from "@/actions/categories";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const t = await getTranslations("posts");
  const tCommon = await getTranslations("common");

  const [post, socialAccounts, categories] = await Promise.all([
    prisma.post.findUnique({
      where: { id, userId: session.user.id },
      include: {
        targets: {
          select: { socialAccountId: true },
        },
      },
    }),
    prisma.socialAccount.findMany({
      where: { userId: session.user.id, isActive: true },
      select: {
        id: true,
        platform: true,
        accountName: true,
        accountType: true,
      },
      orderBy: [
        { platform: "asc" },
        { accountType: "asc" },
        { accountName: "asc" },
      ],
    }),
    getCategories(),
  ]);

  if (!post) notFound();

  // Only allow editing of DRAFT or SCHEDULED posts
  if (post.status !== "DRAFT" && post.status !== "SCHEDULED") {
    redirect(`/posts/${id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/posts/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon("back")}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t("editPost")}</h1>
          <p className="text-muted-foreground">
            {t("editPostDesc")}
          </p>
        </div>
      </div>

      <PostForm
        socialAccounts={socialAccounts}
        categories={categories}
        post={{
          id: post.id,
          content: post.content,
          imageUrl: post.imageUrl,
          imageDescription: post.imageDescription,
          mediaUrls: post.mediaUrls,
          scheduledAt: post.scheduledAt,
          status: post.status,
          targets: post.targets,
          categoryId: post.categoryId,
          isEvergreen: post.isEvergreen,
          firstComment: post.firstComment,
        }}
      />
    </div>
  );
}
