import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getFeedbackStats } from "@/lib/feedback";
import { LearningDashboard } from "@/components/ai/learning-dashboard";
import { getTranslations } from "next-intl/server";

export default async function LLMLearningPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("learning");

  // Get feedback stats
  const stats = await getFeedbackStats(session.user.id);

  // Get feedback grouped by type
  const feedbackByTypeRaw = await prisma.aIFeedback.groupBy({
    by: ["insightType"],
    where: { userId: session.user.id },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  const feedbackByType = feedbackByTypeRaw.map((item) => ({
    insightType: item.insightType,
    count: item._count.id,
  }));

  // Get recent feedback
  const recentFeedbackRaw = await prisma.aIFeedback.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      insightType: true,
      rating: true,
      originalOutput: true,
      editedOutput: true,
      modelUsed: true,
      createdAt: true,
    },
  });

  const recentFeedback = recentFeedbackRaw.map((item) => ({
    id: item.id,
    insightType: item.insightType,
    rating: item.rating,
    originalOutput: item.originalOutput.substring(0, 300),
    editedOutput: item.editedOutput?.substring(0, 300) || null,
    modelUsed: item.modelUsed,
    createdAt: item.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">
          {t("pageDescription")}
        </p>
      </div>

      <LearningDashboard
        stats={stats}
        feedbackByType={feedbackByType}
        recentFeedback={recentFeedback}
      />
    </div>
  );
}
