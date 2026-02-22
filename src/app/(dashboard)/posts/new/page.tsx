import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PostForm } from "@/components/posts/post-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCategories } from "@/actions/categories";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ prefill?: string; content?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const initialContent = params.prefill || params.content || "";

  const t = await getTranslations("posts");
  const tCommon = await getTranslations("common");

  const categories = await getCategories();

  const socialAccounts = await prisma.socialAccount.findMany({
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
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/posts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon("back")}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t("newPost")}</h1>
          <p className="text-muted-foreground">
            {t("createNew")}
          </p>
        </div>
      </div>

      <PostForm socialAccounts={socialAccounts} categories={categories} initialContent={initialContent} />
    </div>
  );
}
