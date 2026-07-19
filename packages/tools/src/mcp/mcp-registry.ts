import { McpClient, type McpServerConfig, type McpTool } from "./mcp-client.js";

export type { McpTool };

export type ServerStatus = "disconnected" | "connecting" | "connected" | "error";

export interface ServerState {
  config: McpServerConfig;
  client: McpClient;
  status: ServerStatus;
  tools: McpTool[];
  error?: string;
}

export class McpRegistry {
  private servers = new Map<string, ServerState>();
  private toolsByServer = new Map<string, McpTool[]>();

  registerServer(config: McpServerConfig): void {
    if (this.servers.has(config.name)) {
      throw new Error(`MCP server "${config.name}" is already registered`);
    }
    const client = new McpClient(config);
    this.servers.set(config.name, {
      config,
      client,
      status: "disconnected",
      tools: [],
    });
  }

  unregisterServer(name: string): void {
    const state = this.servers.get(name);
    if (state) {
      void state.client.disconnect();
      this.servers.delete(name);
      this.toolsByServer.delete(name);
    }
  }

  async connectAll(): Promise<void> {
    const results = await Promise.allSettled(
      Array.from(this.servers.values()).map((state) => this.connect(state)),
    );

    for (const result of results) {
      if (result.status === "rejected") {
        console.error("MCP connectAll error:", result.reason);
      }
    }
  }

  async connectByName(name: string): Promise<void> {
    const state = this.servers.get(name);
    if (!state) {
      throw new Error(`MCP server "${name}" not found`);
    }
    await this.connect(state);
  }

  async disconnectByName(name: string): Promise<void> {
    const state = this.servers.get(name);
    if (!state) {
      throw new Error(`MCP server "${name}" not found`);
    }
    state.status = "disconnected";
    state.tools = [];
    this.toolsByServer.delete(name);
    await state.client.disconnect();
  }

  async discoverTools(): Promise<McpTool[]> {
    const allTools: McpTool[] = [];
    for (const [, state] of this.servers) {
      if (state.status === "connected") {
        try {
          const tools = await state.client.listTools();
          state.tools = tools;
          this.toolsByServer.set(state.config.name, tools);
          allTools.push(...tools);
        } catch (err) {
          state.error = err instanceof Error ? err.message : String(err);
        }
      }
    }
    return allTools;
  }

  async executeTool(
    serverName: string,
    toolName: string,
    input: Record<string, unknown>,
  ): Promise<unknown> {
    const state = this.servers.get(serverName);
    if (!state) {
      throw new Error(`MCP server "${serverName}" not found`);
    }
    if (state.status !== "connected") {
      throw new Error(`MCP server "${serverName}" is not connected`);
    }
    return state.client.callTool(toolName, input);
  }

  getServers(): McpServerConfig[] {
    return Array.from(this.servers.values()).map((s) => s.config);
  }

  getServerStates(): ServerState[] {
    return Array.from(this.servers.values());
  }

  getTools(): McpTool[] {
    const all: McpTool[] = [];
    for (const [, tools] of this.toolsByServer) {
      all.push(...tools);
    }
    return all;
  }

  getServerState(name: string): ServerState | undefined {
    return this.servers.get(name);
  }

  async shutdownAll(): Promise<void> {
    for (const [, state] of this.servers) {
      state.status = "disconnected";
      state.tools = [];
      await state.client.disconnect();
    }
    this.toolsByServer.clear();
  }

  private async connect(state: ServerState): Promise<void> {
    state.status = "connecting";
    state.error = undefined;
    try {
      await state.client.connect();
      state.status = "connected";
      const tools = await state.client.listTools();
      state.tools = tools;
      this.toolsByServer.set(state.config.name, tools);
    } catch (err) {
      state.status = "error";
      state.error = err instanceof Error ? err.message : String(err);
    }
  }
}
