/**
 * ComfyUI Client
 * Handles communication with a ComfyUI server for image generation.
 *
 * ComfyUI uses a workflow-based system where you send a JSON graph (prompt)
 * and then poll for results. The workflow defines the complete pipeline:
 * model loading, text encoding, sampling, and image decoding.
 */

interface ComfyUIQueueResponse {
  prompt_id: string;
  number: number;
  node_errors: Record<string, unknown>;
}

interface ComfyUIHistoryEntry {
  prompt: unknown;
  outputs: Record<string, { images?: Array<{ filename: string; subfolder: string; type: string }> }>;
  status: { status_str: string; completed: boolean };
}

/**
 * Build a standard txt2img workflow for ComfyUI.
 * This creates a pipeline: Checkpoint → CLIP Text → KSampler → VAE Decode → Save
 */
export function buildTxt2ImgWorkflow(params: {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  checkpoint?: string;
  seed?: number;
  samplerName?: string;
  scheduler?: string;
}): Record<string, unknown> {
  const {
    prompt,
    negativePrompt = "",
    width = 512,
    height = 512,
    steps = 30,
    cfgScale = 7,
    checkpoint = "v1-5-pruned-emaonly.safetensors",
    seed = Math.floor(Math.random() * 2 ** 32),
    samplerName = "dpmpp_2m",
    scheduler = "karras",
  } = params;

  return {
    "1": {
      class_type: "CheckpointLoaderSimple",
      inputs: {
        ckpt_name: checkpoint,
      },
    },
    "2": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: prompt,
        clip: ["1", 1],
      },
    },
    "3": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: negativePrompt,
        clip: ["1", 1],
      },
    },
    "4": {
      class_type: "EmptyLatentImage",
      inputs: {
        width,
        height,
        batch_size: 1,
      },
    },
    "5": {
      class_type: "KSampler",
      inputs: {
        seed,
        steps,
        cfg: cfgScale,
        sampler_name: samplerName,
        scheduler: scheduler,
        denoise: 1,
        model: ["1", 0],
        positive: ["2", 0],
        negative: ["3", 0],
        latent_image: ["4", 0],
      },
    },
    "6": {
      class_type: "VAEDecode",
      inputs: {
        samples: ["5", 0],
        vae: ["1", 2],
      },
    },
    "7": {
      class_type: "SaveImage",
      inputs: {
        filename_prefix: "social-scheduler",
        images: ["6", 0],
      },
    },
  };
}

/**
 * Submit a workflow to ComfyUI for processing.
 * Returns the prompt_id which can be used to poll for results.
 */
export async function submitComfyUIPrompt(
  comfyuiUrl: string,
  workflow: Record<string, unknown>
): Promise<string> {
  const response = await fetch(`${comfyuiUrl}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ComfyUI prompt submission failed (${response.status}): ${errorText}`);
  }

  const result: ComfyUIQueueResponse = await response.json();

  if (result.node_errors && Object.keys(result.node_errors).length > 0) {
    const errors = Object.entries(result.node_errors)
      .map(([node, err]) => `Node ${node}: ${JSON.stringify(err)}`)
      .join("; ");
    throw new Error(`ComfyUI workflow errors: ${errors}`);
  }

  return result.prompt_id;
}

/**
 * Poll ComfyUI for the completion of a prompt.
 * Returns when the prompt is complete or throws on timeout.
 */
export async function waitForComfyUIResult(
  comfyuiUrl: string,
  promptId: string,
  onProgress?: () => void,
  timeoutMs: number = 600000 // 10 minutes default
): Promise<{ filename: string; subfolder: string }> {
  const startTime = Date.now();
  const pollInterval = 2000; // Poll every 2 seconds

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(`${comfyuiUrl}/history/${promptId}`);

      if (response.ok) {
        const history: Record<string, ComfyUIHistoryEntry> = await response.json();
        const entry = history[promptId];

        if (entry && entry.status?.completed) {
          // Find the output image
          for (const nodeOutput of Object.values(entry.outputs)) {
            if (nodeOutput.images && nodeOutput.images.length > 0) {
              const image = nodeOutput.images[0];
              return {
                filename: image.filename,
                subfolder: image.subfolder || "",
              };
            }
          }
          throw new Error("ComfyUI completed but no images found in output");
        }
      }
    } catch (error) {
      // If it's not a polling error (e.g., timeout), throw it
      if (error instanceof Error && error.message.includes("ComfyUI completed")) {
        throw error;
      }
      // Otherwise continue polling
    }

    // Send progress notification
    if (onProgress) {
      onProgress();
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`ComfyUI generation timed out after ${timeoutMs / 1000}s`);
}

/**
 * Download a generated image from ComfyUI.
 * Returns the image as a Buffer.
 */
export async function downloadComfyUIImage(
  comfyuiUrl: string,
  filename: string,
  subfolder: string = ""
): Promise<Buffer> {
  const params = new URLSearchParams({ filename });
  if (subfolder) {
    params.append("subfolder", subfolder);
  }
  params.append("type", "output");

  const response = await fetch(`${comfyuiUrl}/view?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to download image from ComfyUI (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Check if ComfyUI server is reachable and get system info.
 */
export async function checkComfyUIHealth(comfyuiUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${comfyuiUrl}/system_stats`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get available checkpoints from ComfyUI.
 */
export async function getComfyUICheckpoints(comfyuiUrl: string): Promise<string[]> {
  try {
    const response = await fetch(`${comfyuiUrl}/object_info/CheckpointLoaderSimple`);
    if (!response.ok) return [];

    const data = await response.json();
    const checkpoints: string[] =
      data?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || [];
    return checkpoints;
  } catch {
    return [];
  }
}

/**
 * Auto-detect the best settings for a given checkpoint.
 * SD Turbo / SDXL Turbo need very few steps, cfg=1, and euler_ancestral sampler.
 */
function getCheckpointDefaults(checkpoint: string): {
  steps: number;
  cfgScale: number;
  samplerName: string;
  scheduler: string;
} {
  const name = checkpoint.toLowerCase();
  if (name.includes("turbo") || name.includes("lightning") || name.includes("hyper")) {
    return { steps: 4, cfgScale: 1, samplerName: "euler_ancestral", scheduler: "normal" };
  }
  if (name.includes("lcm")) {
    return { steps: 8, cfgScale: 2, samplerName: "lcm", scheduler: "lcm" };
  }
  return { steps: 30, cfgScale: 7, samplerName: "dpmpp_2m", scheduler: "karras" };
}

/**
 * Complete txt2img generation with ComfyUI.
 * Handles the full flow: build workflow → submit → poll → download.
 * Auto-selects the first available checkpoint if none is specified.
 */
export async function generateImageWithComfyUI(
  comfyuiUrl: string,
  params: {
    prompt: string;
    negativePrompt?: string;
    width?: number;
    height?: number;
    steps?: number;
    cfgScale?: number;
    checkpoint?: string;
    samplerName?: string;
    scheduler?: string;
  },
  onProgress?: () => void
): Promise<Buffer> {
  console.log(`[ComfyUI] Starting image generation: ${params.prompt.slice(0, 50)}...`);

  // Auto-detect checkpoint if not specified
  if (!params.checkpoint) {
    const available = await getComfyUICheckpoints(comfyuiUrl);
    if (available.length > 0) {
      params.checkpoint = available[0];
      console.log(`[ComfyUI] Auto-selected checkpoint: ${params.checkpoint}`);
    }
  }

  // Auto-apply optimal settings for turbo/fast models (steps, cfg, sampler)
  if (params.checkpoint && !params.steps && !params.cfgScale) {
    const defaults = getCheckpointDefaults(params.checkpoint);
    params.steps = defaults.steps;
    params.cfgScale = defaults.cfgScale;
    params.samplerName = params.samplerName ?? defaults.samplerName;
    params.scheduler = params.scheduler ?? defaults.scheduler;
    console.log(
      `[ComfyUI] Auto-settings for ${params.checkpoint}: steps=${params.steps}, cfg=${params.cfgScale}, sampler=${params.samplerName}`
    );
  }

  // Build workflow
  const workflow = buildTxt2ImgWorkflow(params);

  // Submit to ComfyUI
  const promptId = await submitComfyUIPrompt(comfyuiUrl, workflow);
  console.log(`[ComfyUI] Prompt submitted: ${promptId}`);

  // Wait for completion
  const result = await waitForComfyUIResult(comfyuiUrl, promptId, onProgress);
  console.log(`[ComfyUI] Generation complete: ${result.filename}`);

  // Download the image
  const imageBuffer = await downloadComfyUIImage(comfyuiUrl, result.filename, result.subfolder);
  console.log(`[ComfyUI] Image downloaded: ${imageBuffer.length} bytes`);

  return imageBuffer;
}
