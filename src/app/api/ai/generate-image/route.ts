import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getUserAIConfig } from "@/lib/ai/ai-provider";
import { generateImageWithComfyUI, checkComfyUIHealth } from "@/lib/ai/image-generation/comfyui-client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const maxDuration = 600;

async function saveImageToDisk(imageBuffer: Buffer): Promise<string> {
  const imagesDir = path.join(process.cwd(), "public", "generated-images");
  await mkdir(imagesDir, { recursive: true });
  const filename = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`;
  const filepath = path.join(imagesDir, filename);
  await writeFile(filepath, imageBuffer);
  return `/generated-images/${filename}`;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const t = await getTranslations("image");
  const userId = session.user.id;
  let prompt: string;
  let negativePrompt: string;
  let width: number;
  let height: number;

  try {
    const body = await request.json();
    prompt = body.prompt;
    negativePrompt = body.negativePrompt || "";
    width = body.width || 512;
    height = body.height || 512;
  } catch {
    return new Response(
      JSON.stringify({ error: t("invalidRequest") }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!prompt) {
    return new Response(
      JSON.stringify({ error: t("promptRequired") }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const config = await getUserAIConfig(userId, "image");

  if (!config.imageGenUrl) {
    return new Response(
      JSON.stringify({ error: t("noImageGenUrl") }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const providerName = config.imageGenProvider === "comfyui" ? "ComfyUI" : "Stable Diffusion";
  console.log(`[Image Gen] Using ${providerName} at ${config.imageGenUrl}`);

  // SSE stream for progress
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`)
      );

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`)
          );
        } catch {
          clearInterval(keepAlive);
        }
      }, 15000);

      try {
        const startTime = Date.now();

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "progress", status: t("generatingImage") })}\n\n`
          )
        );

        let imageBuffer: Buffer;
        const modelUsed = config.imageGenProvider === "comfyui" ? "comfyui" : "stable-diffusion";

        if (config.imageGenProvider === "comfyui") {
          // ── ComfyUI path ──
          const isHealthy = await checkComfyUIHealth(config.imageGenUrl!);
          if (!isHealthy) {
            throw new Error(
              `ComfyUI server not reachable at ${config.imageGenUrl}. Please ensure ComfyUI is running.`
            );
          }

          imageBuffer = await generateImageWithComfyUI(
            config.imageGenUrl!,
            { prompt, negativePrompt, width, height },
            () => {
              try {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "progress", status: t("generatingImage") })}\n\n`
                  )
                );
              } catch {
                // Stream already closed
              }
            }
          );
        } else {
          // ── Stable Diffusion WebUI path ──
          const sdResponse = await fetch(`${config.imageGenUrl}/sdapi/v1/txt2img`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt,
              negative_prompt: negativePrompt,
              width,
              height,
              steps: 30,
              cfg_scale: 7,
              sampler_name: "DPM++ 2M Karras",
              batch_size: 1,
            }),
          });

          if (!sdResponse.ok) {
            const errorText = await sdResponse.text();
            throw new Error(t("stableDiffusionError", { error: errorText }));
          }

          const sdResult = await sdResponse.json();

          if (!sdResult.images || sdResult.images.length === 0) {
            throw new Error(t("generationFailed"));
          }

          imageBuffer = Buffer.from(sdResult.images[0], "base64");
        }

        const durationMs = Date.now() - startTime;
        clearInterval(keepAlive);

        // Save image to disk (same for both providers)
        const imageUrl = await saveImageToDisk(imageBuffer);

        // Save to DB
        try {
          await prisma.aIInsight.create({
            data: {
              userId,
              type: "IMAGE_GENERATION",
              data: JSON.parse(JSON.stringify({ prompt, negativePrompt, width, height, imageUrl })),
              durationMs,
              modelUsed,
            },
          });
        } catch (dbError) {
          console.error("[Image Gen] Failed to save insight:", dbError);
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "result",
              data: { imageUrl, prompt },
              durationMs,
              modelUsed,
            })}\n\n`
          )
        );
        controller.close();
      } catch (error) {
        clearInterval(keepAlive);
        console.error(`[Image Gen] ${providerName} error:`, error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              error: error instanceof Error ? error.message : t("generationFailed"),
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
