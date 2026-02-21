import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { InsightsPanel } from "@/components/ai/insights-panel";
import { Sparkles } from "lucide-react";
import { Prisma } from "@prisma/client";
import { getTranslations } from "next-intl/server";

interface DurationStat {
  type: string;
  modelUsed: string | null;
  avgMs: number;
  count: number;
}

export default async function AiInsightsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [latestBestTimes, latestSuggestions, user, durationStats] = await Promise.all([
    prisma.aIInsight.findFirst({
      where: { userId: session.user.id, type: "BEST_TIMES" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.aIInsight.findFirst({
      where: { userId: session.user.id, type: "CONTENT_SUGGESTIONS" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        aiProvider: true,
        textModel: true,
        imageModel: true,
        analysisModel: true,
        ollamaUrl: true,
      },
    }),
    prisma.$queryRaw<DurationStat[]>(
      Prisma.sql`
        SELECT type, "modelUsed",
          ROUND(AVG("durationMs"))::int as "avgMs",
          COUNT(*)::int as count
        FROM "AIInsight"
        WHERE "userId" = ${session.user.id} AND "durationMs" IS NOT NULL
        GROUP BY type, "modelUsed"
      `
    ),
  ]);

  const estimatedDurations: Record<string, { avgMs: number; count: number; model: string | null }> = {};
  for (const stat of durationStats) {
    estimatedDurations[stat.type] = {
      avgMs: stat.avgMs,
      count: stat.count,
      model: stat.modelUsed,
    };
  }

  const t = await getTranslations("insights");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t("title")}</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          {t("subtitle")}
        </p>
      </div>

      <InsightsPanel
        initialBestTimes={latestBestTimes?.data as Record<string, unknown> | null}
        initialBestTimesDate={latestBestTimes?.createdAt.toISOString() || null}
        initialBestTimesDuration={latestBestTimes?.durationMs || null}
        initialBestTimesModel={latestBestTimes?.modelUsed || null}
        initialSuggestions={latestSuggestions?.data as Record<string, unknown> | null}
        initialSuggestionsDate={latestSuggestions?.createdAt.toISOString() || null}
        initialSuggestionsDuration={latestSuggestions?.durationMs || null}
        initialSuggestionsModel={latestSuggestions?.modelUsed || null}
        currentTextModel={user?.textModel ?? ""}
        currentAnalysisModel={user?.analysisModel ?? ""}
        currentImageModel={user?.imageModel ?? ""}
        currentProvider={user?.aiProvider ?? "ollama"}
        ollamaUrl={user?.ollamaUrl ?? ""}
        estimatedDurations={estimatedDurations}
      />
    </div>
  );
}
