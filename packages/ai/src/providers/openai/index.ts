import OpenAI from "openai";
import { AiProvider, AiMessage, AiCompletionOptions } from "../../provider/index.js";

export interface OpenAiProviderConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
}

export class OpenAiProvider implements AiProvider {
  readonly name = "openai";

  private client: OpenAI;
  private defaultModel: string;

  constructor(config: OpenAiProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    this.defaultModel = config.defaultModel ?? "gpt-4o-mini";
  }

  async complete(messages: AiMessage[], options?: AiCompletionOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options?.model ?? this.defaultModel,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
      stream: false,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    return content;
  }

  async *stream(messages: AiMessage[], options?: AiCompletionOptions): AsyncIterable<string> {
    const response = await this.client.chat.completions.create({
      model: options?.model ?? this.defaultModel,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
      stream: true,
    });

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}
