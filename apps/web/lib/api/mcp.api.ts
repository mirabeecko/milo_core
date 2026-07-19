import { apiClient } from "./client";

export interface McpServerState {
  name: string;
  status: "disconnected" | "connecting" | "connected" | "error";
  error?: string;
  toolsCount: number;
  tools: Array<{ name: string; description: string }>;
  config: {
    hasCommand: boolean;
    hasUrl: boolean;
  };
}

export interface McpServersResponse {
  servers: McpServerState[];
}

export interface McpToolsResponse {
  tools: Array<{
    serverName: string;
    toolName: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }>;
}

export async function getMcpServers(): Promise<McpServersResponse> {
  return apiClient<McpServersResponse>("/mcp/servers");
}

export async function getMcpTools(): Promise<McpToolsResponse> {
  return apiClient<McpToolsResponse>("/mcp/tools");
}

export async function connectMcpServer(name: string): Promise<McpServerState> {
  return apiClient<McpServerState>(`/mcp/connect/${encodeURIComponent(name)}`, {
    method: "POST",
  });
}

export async function disconnectMcpServer(name: string): Promise<McpServerState> {
  return apiClient<McpServerState>(`/mcp/disconnect/${encodeURIComponent(name)}`, {
    method: "POST",
  });
}

export async function reloadMcpServers(): Promise<McpServersResponse> {
  return apiClient<McpServersResponse>("/mcp/reload", {
    method: "POST",
  });
}
