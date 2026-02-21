"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { COMMON_TIMEZONES } from "@/lib/constants";
import { getTranslations } from "next-intl/server";

export async function updateTimezone(timezone: string) {
  const t = await getTranslations("common");
  const tSettings = await getTranslations("settings");
  const session = await auth();
  if (!session?.user?.id) {
    return { error: t("notAuthenticated") };
  }

  const validTimezones: string[] = COMMON_TIMEZONES.map((tz) => tz.value);
  if (!validTimezones.includes(timezone)) {
    return { error: tSettings("invalidTimezone") };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { timezone },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Timezone update error:", error);
    return { error: tSettings("timezoneSaveError") };
  }
}
