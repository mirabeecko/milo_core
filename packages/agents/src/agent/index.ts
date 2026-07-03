import { AiProvider, PromptTemplate } from "@milo/ai";
import { ToolRegistry } from "@milo/tools";

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: PromptTemplate;
  provider: AiProvider;
  tools: ToolRegistry;
}

export interface AgentMemory {
  shortTerm: string[];
  longTerm: string[];
}

export interface AgentLogEntry {
  timestamp: Date;
  level: "info" | "warn" | "error";
  message: string;
  metadata?: Record<string, unknown>;
}

export class Agent {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly systemPrompt: PromptTemplate;
  readonly provider: AiProvider;
  readonly tools: ToolRegistry;
  readonly memory: AgentMemory = { shortTerm: [], longTerm: [] };
  readonly logs: AgentLogEntry[] = [];

  constructor(config: AgentConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.systemPrompt = config.systemPrompt;
    this.provider = config.provider;
    this.tools = config.tools;
  }

  log(level: AgentLogEntry["level"], message: string, metadata?: Record<string, unknown>): void {
    this.logs.push({ timestamp: new Date(), level, message, metadata });
  }
}
