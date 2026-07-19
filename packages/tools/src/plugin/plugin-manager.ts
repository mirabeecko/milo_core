import type { MiLOPlugin, PluginContext, PluginLogger } from "./plugin-api.js";
import type { ToolRegistry } from "../registry/index.js";
import type { Tool } from "../types/index.js";

interface PluginState {
  plugin: MiLOPlugin;
  status: "registered" | "initialized" | "error";
  error?: string;
}

function createPluginLogger(name: string): PluginLogger {
  return {
    info: (message, data) => {
      console.log(`[Plugin:${name}] ${message}`, data ? JSON.stringify(data) : "");
    },
    warn: (message, data) => {
      console.warn(`[Plugin:${name}] ${message}`, data ? JSON.stringify(data) : "");
    },
    error: (message, data) => {
      console.error(`[Plugin:${name}] ${message}`, data ? JSON.stringify(data) : "");
    },
    debug: (message, data) => {
      console.debug(`[Plugin:${name}] ${message}`, data ? JSON.stringify(data) : "");
    },
  };
}

export class PluginManager {
  private plugins = new Map<string, PluginState>();
  private toolRegistry: ToolRegistry | null = null;

  constructor(toolRegistry?: ToolRegistry) {
    this.toolRegistry = toolRegistry ?? null;
  }

  setToolRegistry(registry: ToolRegistry): void {
    this.toolRegistry = registry;
  }

  async registerPlugin(plugin: MiLOPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`);
    }

    this.plugins.set(plugin.name, {
      plugin,
      status: "registered",
    });
  }

  async unregisterPlugin(name: string): Promise<void> {
    const state = this.plugins.get(name);
    if (!state) return;

    if (state.status === "initialized") {
      try {
        await state.plugin.shutdown();
      } catch (err) {
        console.error(`[PluginManager] Shutdown error for "${name}":`, err);
      }
    }

    this.plugins.delete(name);
  }

  getPlugin(name: string): MiLOPlugin | undefined {
    return this.plugins.get(name)?.plugin;
  }

  listPlugins(): MiLOPlugin[] {
    return Array.from(this.plugins.values()).map((s) => s.plugin);
  }

  async initializeAll(): Promise<void> {
    if (!this.toolRegistry) {
      throw new Error("ToolRegistry not set on PluginManager");
    }

    for (const [, state] of this.plugins) {
      await this.initializePlugin(state);
    }
  }

  async shutdownAll(): Promise<void> {
    for (const [, state] of this.plugins) {
      if (state.status === "initialized") {
        try {
          await state.plugin.shutdown();
          state.status = "registered";
        } catch (err) {
          console.error(`[PluginManager] Shutdown error for "${state.plugin.name}":`, err);
        }
      }
    }
  }

  getTools(): Tool[] {
    const tools: Tool[] = [];
    for (const [, state] of this.plugins) {
      if (state.status === "initialized") {
        tools.push(...state.plugin.getTools());
      }
    }
    return tools;
  }

  async handleEvent(event: { type: string; payload: Record<string, unknown> }): Promise<void> {
    const frameworkEvent = {
      ...event,
      timestamp: Date.now(),
    };

    for (const [, state] of this.plugins) {
      if (state.status === "initialized" && state.plugin.onEvent) {
        try {
          await state.plugin.onEvent(frameworkEvent);
        } catch (err) {
          console.error(
            `[PluginManager] Event handler error in "${state.plugin.name}":`,
            err,
          );
        }
      }
    }
  }

  getStatus(): Array<{ name: string; status: string; error?: string }> {
    return Array.from(this.plugins.values()).map((s) => ({
      name: s.plugin.name,
      status: s.status,
      error: s.error,
    }));
  }

  private async initializePlugin(state: PluginState): Promise<void> {
    if (!this.toolRegistry) {
      throw new Error("ToolRegistry not set on PluginManager");
    }

    const plugin = state.plugin;
    const context: PluginContext = {
      config: {},
      logger: createPluginLogger(plugin.name),
      toolRegistry: this.toolRegistry,
    };

    try {
      await plugin.initialize(context);
      state.status = "initialized";
      state.error = undefined;

      const tools = plugin.getTools();
      for (const tool of tools) {
        this.toolRegistry!.register(tool);
      }
    } catch (err) {
      state.status = "error";
      state.error = err instanceof Error ? err.message : String(err);
    }
  }
}
