/** Ollama Provider — lokální modely přes Ollama API */

import type { ChatCompletionRequest, ChatCompletionResponse, LLMProvider } from "./provider.js";

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export class OllamaProvider implements LLMProvider {
  readonly name = "ollama";
  private baseUrl: string;
  private defaultModel: string;
  private chatTimeoutMs: number;

  constructor(config: {
    baseUrl?: string;
    defaultModel: string;
    /** Timeout in ms for chat requests (default: 60_000 = 1min for local models) */
    chatTimeoutMs?: number;
  }) {
    this.baseUrl = config.baseUrl ?? "http://localhost:11434/api";
    this.defaultModel = config.defaultModel;
    this.chatTimeoutMs = config.chatTimeoutMs ?? 60_000;
  }

  async chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const res = await fetchWithTimeout(
      `${this.baseUrl}/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: req.model ?? this.defaultModel,
          messages: req.messages,
          stream: false,
        }),
      },
      this.chatTimeoutMs,
    );

    if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { message: { content: string }; model: string };

    return {
      content: data.message.content,
      model: data.model,
    };
  }

  async *stream(_req: ChatCompletionRequest): AsyncIterable<string> {
    yield "[Ollama streaming not yet implemented]";
  }
}
