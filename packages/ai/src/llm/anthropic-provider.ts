/** Anthropic Provider — Messages API */

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

export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private chatTimeoutMs: number;

  constructor(config: {
    apiKey: string;
    baseUrl?: string;
    defaultModel: string;
    /** Timeout in ms for chat requests (default: 120_000 = 2min) */
    chatTimeoutMs?: number;
  }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://api.anthropic.com/v1";
    this.defaultModel = config.defaultModel;
    this.chatTimeoutMs = config.chatTimeoutMs ?? 120_000;
  }

  async chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Extract system message
    const systemMsg = req.messages.find((m) => m.role === "system");
    const messages = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const body: Record<string, unknown> = {
      model: req.model ?? this.defaultModel,
      max_tokens: req.maxTokens ?? 2048,
      messages,
    };
    if (systemMsg) body.system = systemMsg.content;

    const res = await fetchWithTimeout(
      `${this.baseUrl}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      },
      this.chatTimeoutMs,
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as {
      content: Array<{ type: string; text?: string }>;
      usage?: { input_tokens: number; output_tokens: number };
      model: string;
    };

    return {
      content: data.content.find((c) => c.type === "text")?.text ?? "",
      usage: data.usage
        ? { promptTokens: data.usage.input_tokens, completionTokens: data.usage.output_tokens }
        : undefined,
      model: data.model,
    };
  }

  async *stream(_req: ChatCompletionRequest): AsyncIterable<string> {
    yield "[Anthropic streaming not yet implemented]";
  }
}
