import type { Tool } from "../types/index.js";
import type { ToolRegistry } from "../registry/index.js";

export interface PluginLogger {
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
  debug(message: string, data?: Record<string, unknown>): void;
}

export interface PluginContext {
  config: Record<string, unknown>;
  logger: PluginLogger;
  toolRegistry: ToolRegistry;
}

export interface AgentFrameworkEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface MiLOPlugin {
  readonly name: string;
  readonly version: string;
  readonly description: string;

  initialize(context: PluginContext): Promise<void>;
  shutdown(): Promise<void>;

  getTools(): Tool[];

  onEvent?(event: AgentFrameworkEvent): Promise<void>;
}
