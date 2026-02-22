import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 600;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const t = await getTranslations("models");
  let modelName: string;

  try {
    const body = await request.json();
    modelName = body.modelName;
  } catch {
    return new Response(
      JSON.stringify({ error: t("invalidRequest") }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!modelName) {
    return new Response(
      JSON.stringify({ error: t("modelNameRequired") }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Get Ollama URL from user settings
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { ollamaUrl: true },
  });

  const ollamaUrl = user?.ollamaUrl || "http://localhost:11434";

  // Stream the pull progress via SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(`${ollamaUrl}/api/pull`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: modelName, stream: true }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: t("ollamaError", { error: errorText }) })}\n\n`
            )
          );
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: t("noOllamaStream") })}\n\n`
            )
          );
          controller.close();
          return;
        }

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((l) => l.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);

              if (data.status) {
                const progress: {
                  type: string;
                  status: string;
                  completed?: number;
                  total?: number;
                  percent?: number;
                } = {
                  type: "progress",
                  status: data.status,
                };

                if (data.completed && data.total) {
                  progress.completed = data.completed;
                  progress.total = data.total;
                  progress.percent = Math.round(
                    (data.completed / data.total) * 100
                  );
                }

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(progress)}\n\n`)
                );
              }

              if (data.status === "success") {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "complete", modelName })}\n\n`
                  )
                );
              }
            } catch {
              // Skip malformed lines
            }
          }
        }

        reader.releaseLock();
        controller.close();
      } catch (error) {
        console.error("Model pull error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              error: error instanceof Error ? error.message : t("pullFailed"),
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
