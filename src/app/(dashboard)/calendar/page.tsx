import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { startOfMonth, endOfMonth } from "date-fns";
import { DragDropCalendar } from "@/components/calendar/drag-drop-calendar";
import { getTranslations, getLocale } from "next-intl/server";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("calendar");
  const locale = await getLocale();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const posts = await prisma.post.findMany({
    where: {
      userId: session.user.id,
      scheduledAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    include: {
      targets: { include: { socialAccount: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const serializedPosts = posts.map((post) => ({
    id: post.id,
    content: post.content,
    scheduledAt: post.scheduledAt?.toISOString() || null,
    status: post.status,
    targets: post.targets.map((t) => ({
      id: t.id,
      platform: t.socialAccount.platform,
      accountName: t.socialAccount.accountName,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <DragDropCalendar posts={serializedPosts} locale={locale} />
    </div>
  );
}
