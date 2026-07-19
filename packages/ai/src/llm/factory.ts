/** LLM Provider Factory — vytvoří správný provider dle konfigurace */

import type { LLMProvider } from "./provider.js";
import { OpenAIProvider } from "./openai-provider.js";
import { AnthropicProvider } from "./anthropic-provider.js";
import { OllamaProvider } from "./ollama-provider.js";

let cachedProvider: LLMProvider | null = null;

export function createLLMProvider(): LLMProvider {
  if (cachedProvider) return cachedProvider;

  const provider = process.env.LLM_PROVIDER ?? "openai";
  const model = process.env.LLM_MODEL ?? "gpt-4o";

  switch (provider) {
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY ?? "";
      const baseUrl = process.env.OPENAI_BASE_URL;
      cachedProvider = new OpenAIProvider({ apiKey, baseUrl, defaultModel: model });
      break;
    }
    case "anthropic": {
      const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
      cachedProvider = new AnthropicProvider({ apiKey, defaultModel: model });
      break;
    }
    case "ollama": {
      const baseUrl = process.env.OLLAMA_BASE_URL;
      cachedProvider = new OllamaProvider({ baseUrl, defaultModel: model });
      break;
    }
    default:
      throw new Error(`Neznámý LLM provider: ${provider}`);
  }

  return cachedProvider;
}

/** Reset cache — pro testy */
export function resetProvider(): void {
  cachedProvider = null;
}
