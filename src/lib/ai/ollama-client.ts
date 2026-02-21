interface OllamaResponse {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

interface OllamaModel {
  name: string;
  model: string;
  size: number;
  details: {
    parameter_size: string;
    quantization_level: string;
    family: string;
  };
}

interface OllamaTagsResponse {
  models: OllamaModel[];
}

export async function askOllama(
  ollamaUrl: string,
  model: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as OllamaResponse;
  return data.message?.content ?? "";
}

/**
 * Streams Ollama response and calls onKeepAlive callback for every chunk.
 * This prevents Cloudflare Tunnel timeout (100s limit) by keeping the
 * connection alive with SSE pings while Ollama generates.
 */
export async function askOllamaStreaming(
  ollamaUrl: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  onChunk: (text: string) => void
): Promise<string> {
  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      stream: true,
      options: {
        temperature: 0.7,
        num_predict: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama error (${response.status}): ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No streaming response from Ollama");
  }

  const decoder = new TextDecoder();
  let fullContent = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((l) => l.trim());
      for (const line of lines) {
        try {
          const data = JSON.parse(line) as OllamaResponse;
          if (data.message?.content) {
            fullContent += data.message.content;
            onChunk(data.message.content);
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullContent;
}

export async function listOllamaModels(
  ollamaUrl: string
): Promise<OllamaModel[]> {
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Ollama not reachable (${response.status})`);
    }

    const data = (await response.json()) as OllamaTagsResponse;
    // Filter out embedding models
    return data.models.filter(
      (m) => !m.name.includes("embed") && m.details.family !== "bert"
    );
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("Ollama server not reachable (Timeout)");
    }
    throw error;
  }
}

export function formatModelSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(gb * 1024).toFixed(0)} MB`;
}
