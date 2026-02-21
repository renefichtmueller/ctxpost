import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PostIdeas } from "@/components/posts/post-ideas";

export default async function IdeasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("ideas");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      aiProvider: true,
      brandStyleGuide: { select: { tone: true } },
    },
  });

  const socialAccounts = await prisma.socialAccount.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { id: true, platform: true, accountName: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <PostIdeas
        hasAI={!!user?.aiProvider}
        hasBrand={!!user?.brandStyleGuide}
        socialAccounts={socialAccounts}
      />
    </div>
  );
}
