export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AiProvider {
  readonly name: string;
  complete(messages: AiMessage[], options?: AiCompletionOptions): Promise<string>;
  stream(messages: AiMessage[], options?: AiCompletionOptions): AsyncIterable<string>;
}

export class AiProviderRegistry {
  private providers = new Map<string, AiProvider>();

  register(provider: AiProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): AiProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`AI provider '${name}' not found`);
    }
    return provider;
  }

  list(): string[] {
    return Array.from(this.providers.keys());
  }
}
