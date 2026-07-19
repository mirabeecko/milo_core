import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { loadMcpServerConfig } from "../../config/mcp.js";
import { McpRegistry, type McpTool, type ServerState } from "@milo/tools";

let mcpRegistry: McpRegistry | null = null;

export function getMcpRegistry(): McpRegistry {
  if (!mcpRegistry) {
    mcpRegistry = new McpRegistry();
  }
  return mcpRegistry;
}

export async function initializeMcpServers(): Promise<void> {
  const registry = getMcpRegistry();
  const servers = loadMcpServerConfig();

  for (const server of servers) {
    try {
      registry.registerServer(server);
    } catch {
      // Already registered
    }
  }

  await registry.connectAll();
}

export async function shutdownMcpServers(): Promise<void> {
  if (mcpRegistry) {
    await mcpRegistry.shutdownAll();
  }
}

function mapServerState(state: ServerState): Record<string, unknown> {
  return {
    name: state.config.name,
    status: state.status,
    error: state.error,
    toolsCount: state.tools.length,
    tools: state.tools.map((t: McpTool) => ({
      name: t.toolName,
      description: t.description,
    })),
    config: {
      hasCommand: !!state.config.command,
      hasUrl: !!state.config.url,
    },
  };
}

export async function mcpRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const registry = getMcpRegistry();

  app.get("/servers", async (_request, reply) => {
    const states = registry.getServerStates();
    return reply.send({
      servers: states.map(mapServerState),
    });
  });

  app.get("/tools", async (_request, reply) => {
    const tools = registry.getTools();
    return reply.send({ tools });
  });

  app.post<{ Params: { name: string } }>(
    "/connect/:name",
    async (request, reply) => {
      const { name } = request.params;

      const existing = registry.getServerState(name);
      if (!existing) {
        const servers = loadMcpServerConfig();
        const config = servers.find((s) => s.name === name);
        if (!config) {
          return reply.status(404).send({ error: `MCP server "${name}" not found in config` });
        }
        registry.registerServer(config);
      }

      try {
        await registry.connectByName(name);
        const state = registry.getServerState(name);
        return reply.send(mapServerState(state!));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return reply.status(500).send({ error: message });
      }
    },
  );

  app.post<{ Params: { name: string } }>(
    "/disconnect/:name",
    async (request, reply) => {
      const { name } = request.params;
      try {
        await registry.disconnectByName(name);
        const state = registry.getServerState(name);
        return reply.send(mapServerState(state!));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return reply.status(404).send({ error: message });
      }
    },
  );

  app.post("/reload", async (_request, reply) => {
    await registry.shutdownAll();

    const servers = loadMcpServerConfig();
    for (const server of servers) {
      registry.registerServer(server);
    }

    await registry.connectAll();

    const states = registry.getServerStates();
    return reply.send({
      servers: states.map(mapServerState),
    });
  });
}
