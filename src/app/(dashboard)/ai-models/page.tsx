import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ModelManager } from "@/components/ai/model-manager";
import { getTranslations } from "next-intl/server";

export default async function AIModelsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("models");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      aiProvider: true,
      textModel: true,
      imageModel: true,
      analysisModel: true,
      ollamaUrl: true,
      imageGenUrl: true,
      imageGenProvider: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">
          {t("pageDescription")}
        </p>
      </div>

      <ModelManager
        currentProvider={user?.aiProvider ?? "ollama"}
        currentTextModel={user?.textModel ?? "qwen2.5:32b"}
        currentImageModel={user?.imageModel ?? ""}
        currentAnalysisModel={user?.analysisModel ?? "qwen2.5:32b"}
        ollamaUrl={user?.ollamaUrl ?? "http://localhost:11434"}
        imageGenUrl={user?.imageGenUrl ?? ""}
        imageGenProvider={user?.imageGenProvider ?? "sd-webui"}
      />
    </div>
  );
}
