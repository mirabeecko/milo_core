/**
 * OpenAI Provider — přímé HTTP volání OpenAI API.
 *
 * Funguje i s jakýmkoliv OpenAI-kompatibilním endpointem
 * (DeepSeek, Groq, Together.ai, lokální LM Studio...).
 */

import type { ChatCompletionRequest, ChatCompletionResponse, LLMProvider } from "./provider.js";

export interface OpenAIConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
}

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = {
      baseUrl: "https://api.openai.com/v1",
      ...config,
    };
  }

  async chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const body = {
      model: req.model ?? this.config.defaultModel,
      messages: req.messages,
      temperature: req.temperature ?? 0.3,
      max_tokens: req.maxTokens ?? 2048,
      tools: req.tools,
    };

    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as {
      choices: Array<{
        message: {
          content: string;
          tool_calls?: Array<{ function: { name: string; arguments: string } }>;
        };
      }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
      model: string;
    };

    const choice = data.choices[0];
    if (!choice) throw new Error("No response from OpenAI");

    return {
      content: choice.message.content ?? "",
      toolCalls: choice.message.tool_calls?.map((tc) => ({
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      })),
      usage: data.usage
        ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens }
        : undefined,
      model: data.model,
    };
  }

  async *stream(req: ChatCompletionRequest): AsyncIterable<string> {
    const body = {
      model: req.model ?? this.config.defaultModel,
      messages: req.messages,
      temperature: req.temperature ?? 0.3,
      max_tokens: req.maxTokens ?? 2048,
      stream: true,
    };

    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${err}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // ignore parse errors
        }
      }
    }
  }
}
