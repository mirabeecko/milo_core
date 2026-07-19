import { z } from "zod";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { McpServerConfig } from "@milo/tools";

const __dirname = dirname(fileURLToPath(import.meta.url));

const mcpServerConfigSchema = z.object({
  name: z.string().min(1),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  url: z.string().url().optional(),
  env: z.record(z.string()).optional(),
});

const mcpServersFileSchema = z.object({
  servers: z.array(mcpServerConfigSchema),
});

export type McpServerConfigFile = z.infer<typeof mcpServersFileSchema>;
export type McpServerConfigEntry = McpServerConfig;

const MCP_CONFIG_PATH = resolve(__dirname, "../../../../mcp-servers.json");

export function loadMcpServerConfig(): McpServerConfigEntry[] {
  if (!existsSync(MCP_CONFIG_PATH)) {
    return [];
  }

  try {
    const raw = readFileSync(MCP_CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    const validated = mcpServersFileSchema.parse(parsed);
    return validated.servers;
  } catch (err) {
    console.error("Failed to load MCP server config:", err);
    return [];
  }
}

export function getMcpConfigPath(): string {
  return MCP_CONFIG_PATH;
}
