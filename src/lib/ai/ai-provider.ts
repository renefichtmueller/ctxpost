import { prisma } from "@/lib/prisma";
import { askClaude } from "./claude-client";
import { askOllama, askOllamaStreaming } from "./ollama-client";

export type AITaskType = "text" | "image" | "analysis";

export type ImageGenProvider = "sd-webui" | "comfyui";

export interface AIConfig {
  provider: "ollama" | "claude";
  model: string;
  ollamaUrl: string;
  imageGenUrl?: string;
  imageGenProvider: ImageGenProvider;
}

export async function getUserAIConfig(
  userId: string,
  taskType: AITaskType = "text"
): Promise<AIConfig> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  const provider = (user?.aiProvider as "ollama" | "claude") ?? "ollama";

  // Select model based on task type
  let model: string;
  switch (taskType) {
    case "image":
      model = user?.imageModel || user?.textModel || "qwen2.5:32b";
      break;
    case "analysis":
      model = user?.analysisModel || user?.textModel || "qwen2.5:32b";
      break;
    case "text":
    default:
      model = user?.textModel || "qwen2.5:32b";
      break;
  }

  return {
    provider,
    model,
    ollamaUrl: user?.ollamaUrl ?? "http://192.168.178.169:11434",
    imageGenUrl: user?.imageGenUrl ?? undefined,
    imageGenProvider: (user?.imageGenProvider as ImageGenProvider) ?? "sd-webui",
  };
}

/**
 * Checks if the Ollama server is reachable.
 */
async function checkOllamaHealth(ollamaUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

export async function askAI(
  config: AIConfig,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  if (config.provider === "claude") {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "No Anthropic API key configured. Please set ANTHROPIC_API_KEY in the environment variables or switch to Ollama."
      );
    }
    return askClaude(systemPrompt, userMessage);
  }

  // Default: Ollama — with health check
  const isReachable = await checkOllamaHealth(config.ollamaUrl);
  if (!isReachable) {
    throw new Error(
      `Ollama server not reachable at ${config.ollamaUrl}. Please make sure Ollama is running, or switch to a different AI provider in settings.`
    );
  }

  try {
    return await askOllama(config.ollamaUrl, config.model, systemPrompt, userMessage);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `AI request failed (${config.provider}/${config.model}): ${msg}`
    );
  }
}

/**
 * Streaming version of askAI - sends SSE keepalive pings while Ollama generates.
 * Prevents Cloudflare Tunnel 524 timeout.
 */
export async function askAIStreaming(
  config: AIConfig,
  systemPrompt: string,
  userMessage: string,
  onChunk: (text: string) => void
): Promise<string> {
  if (config.provider === "claude") {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "No Anthropic API key configured. Please set ANTHROPIC_API_KEY in the environment variables or switch to Ollama."
      );
    }
    // Claude: no streaming needed (fast enough), just call normally
    return askClaude(systemPrompt, userMessage);
  }

  // Ollama: Health check before streaming
  const isReachable = await checkOllamaHealth(config.ollamaUrl);
  if (!isReachable) {
    throw new Error(
      `Ollama server not reachable at ${config.ollamaUrl}. Please make sure Ollama is running, or switch to a different AI provider in settings.`
    );
  }

  try {
    return await askOllamaStreaming(
      config.ollamaUrl,
      config.model,
      systemPrompt,
      userMessage,
      onChunk
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `AI streaming failed (${config.provider}/${config.model}): ${msg}`
    );
  }
}
