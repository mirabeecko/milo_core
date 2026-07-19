/**
 * LLM Provider Interface — provider-agnostic abstrakce nad LLM API.
 *
 * CONSTITUTION.md §4: Každá komponenta je nahraditelná.
 * Podpora: OpenAI, Anthropic, Ollama, jakýkoliv OpenAI-kompatibilní endpoint.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: Tool[];
}

export interface Tool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatCompletionResponse {
  content: string;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
  usage?: { promptTokens: number; completionTokens: number };
  model: string;
}

export interface LLMProvider {
  /** Jednorázové dokončení */
  chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse>;

  /** Streamované dokončení */
  stream(req: ChatCompletionRequest): AsyncIterable<string>;

  /** Jméno providera pro logging */
  readonly name: string;
}

/** Konfigurace providera — z env proměnných */
export interface LLMConfig {
  provider: "openai" | "anthropic" | "ollama";
  apiKey?: string;
  baseUrl?: string;
  defaultModel: string;
}
