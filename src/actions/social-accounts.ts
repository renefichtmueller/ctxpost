"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

export async function disconnectSocialAccount(accountId: string) {
  const t = await getTranslations("common");
  const session = await auth();
  if (!session?.user?.id) {
    return { error: t("notLoggedIn") };
  }

  await prisma.socialAccount.update({
    where: { id: accountId, userId: session.user.id },
    data: { isActive: false },
  });

  revalidatePath("/accounts");
  revalidatePath("/posts/new");
}
