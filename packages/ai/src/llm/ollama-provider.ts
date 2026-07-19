/** Ollama Provider — lokální modely přes Ollama API */

import type { ChatCompletionRequest, ChatCompletionResponse, LLMProvider } from "./provider.js";

export class OllamaProvider implements LLMProvider {
  readonly name = "ollama";
  private baseUrl: string;
  private defaultModel: string;

  constructor(config: { baseUrl?: string; defaultModel: string }) {
    this.baseUrl = config.baseUrl ?? "http://localhost:11434/api";
    this.defaultModel = config.defaultModel;
  }

  async chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const res = await fetch(`${this.baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: req.model ?? this.defaultModel,
        messages: req.messages,
        stream: false,
      }),
    });

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
