import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BulkImport } from "@/components/posts/bulk-import";

export default async function ImportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("posts");
  const socialAccounts = await prisma.socialAccount.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { id: true, platform: true, accountName: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("importTitle")}</h1>
        <p className="text-muted-foreground">{t("importDesc")}</p>
      </div>
      <BulkImport socialAccounts={socialAccounts} />
    </div>
  );
}
