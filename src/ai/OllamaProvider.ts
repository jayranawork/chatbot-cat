import type { AiProvider } from "./AiProvider";
import type { AiRequest, AiResponse } from "./AiTypes";

const DEFAULT_BASE_URL = "http://localhost:11434";
export const OLLAMA_DEFAULT_MODEL = "llama3.2:3b";

export class OllamaProvider implements AiProvider {
  readonly id = "ollama";
  readonly displayName = "Ollama (local)";

  constructor(
    private readonly baseUrl = DEFAULT_BASE_URL,
    private readonly defaultModel = OLLAMA_DEFAULT_MODEL,
  ) {}

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(1500),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async complete(request: AiRequest, signal?: AbortSignal): Promise<AiResponse> {
    const start = Date.now();
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: request.model ?? this.defaultModel,
        messages: request.messages,
        stream: false,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Ollama responded with status ${response.status}`);
    }

    const data = (await response.json()) as {
      message?: { content?: unknown };
    };

    return {
      text: typeof data.message?.content === "string" ? data.message.content : "",
      providerId: this.id,
      durationMs: Date.now() - start,
    };
  }
}
