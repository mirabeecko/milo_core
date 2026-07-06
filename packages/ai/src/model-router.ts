import { AiProvider } from "./provider/index.js";
import { OpenAiProvider } from "./providers/openai/index.js";
import { OllamaProvider } from "./providers/ollama/index.js";

export interface ModelRouterConfig {
  openai: {
    apiKey: string;
    baseURL?: string;
    defaultModel?: string;
  };
  ollama: {
    host: string;
    defaultModel?: string;
  };
  defaultProvider: "openai" | "ollama";
  taskPreferences: Record<string, "openai" | "ollama">;
}

export class ModelRouter {
  private config: ModelRouterConfig;
  private providers: Map<string, AiProvider>;

  constructor(config: ModelRouterConfig) {
    this.config = config;
    this.providers = new Map();
    
    if (config.openai.apiKey) {
      const openai = new OpenAiProvider({
        apiKey: config.openai.apiKey,
        baseURL: config.openai.baseURL,
        defaultModel: config.openai.defaultModel,
      });
      this.providers.set("openai", openai);
    }

    if (config.ollama.host) {
      const ollama = new OllamaProvider({
        host: config.ollama.host,
        defaultModel: config.ollama.defaultModel,
      });
      this.providers.set("ollama", ollama);
    }
  }

  getProvider(taskType?: string): AiProvider {
    const preferred = this.config.taskPreferences[taskType ?? "default"] ?? this.config.defaultProvider;
    const provider = this.providers.get(preferred);
    
    if (!provider) {
      throw new Error(`No provider available for task type: ${taskType}`);
    }

    return provider;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
