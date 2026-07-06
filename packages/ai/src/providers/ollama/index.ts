import { AiProvider, AiMessage, AiCompletionOptions } from "../../provider/index.js";

export interface OllamaProviderConfig {
  host: string;
  defaultModel?: string;
}

export class OllamaProvider implements AiProvider {
  readonly name = "ollama";

  private host: string;
  private defaultModel: string;

  constructor(config: OllamaProviderConfig) {
    this.host = config.host ?? "http://localhost:11434";
    this.defaultModel = config.defaultModel ?? "llama3";
  }

  async complete(messages: AiMessage[], options?: AiCompletionOptions): Promise<string> {
    const response = await fetch(`${this.host}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options?.model ?? this.defaultModel,
        prompt: messages[messages.length - 1].content,
        context: [],
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 512,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.response ?? "";

    if (!content) {
      throw new Error("Empty response from Ollama");
    }

    return content;
  }

  async *stream(messages: AiMessage[], options?: AiCompletionOptions): AsyncIterable<string> {
    const response = await fetch(`${this.host}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options?.model ?? this.defaultModel,
        prompt: messages[messages.length - 1].content,
        context: [],
        stream: true,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 512,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    for await (const chunk of response.body as any) {
      const content = chunk.response ?? "";
      if (content) {
        yield content;
      }
    }
  }
}
