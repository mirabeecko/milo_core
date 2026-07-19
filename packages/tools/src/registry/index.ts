import { Tool, ToolContext } from "../types/index.js";
import { McpRegistry, type McpTool } from "../mcp/mcp-registry.js";
import type { McpServerConfig } from "../mcp/mcp-client.js";
import { z } from "zod";

export class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.id, tool);
  }

  registerMcpTools(mcpRegistry: McpRegistry): void {
    const mcpTools = mcpRegistry.getTools();
    for (const mcpTool of mcpTools) {
      const toolId = `mcp:${mcpTool.serverName}:${mcpTool.toolName}`;
      this.tools.set(toolId, this.createMcpWrapper(mcpRegistry, mcpTool));
    }
  }

  registerMcpToolsFromServer(mcpRegistry: McpRegistry, serverName: string): void {
    const mcpTools = mcpRegistry.getTools().filter((t) => t.serverName === serverName);
    for (const mcpTool of mcpTools) {
      const toolId = `mcp:${mcpTool.serverName}:${mcpTool.toolName}`;
      this.tools.set(toolId, this.createMcpWrapper(mcpRegistry, mcpTool));
    }
  }

  unregisterMcpTools(serverName: string): void {
    const prefix = `mcp:${serverName}:`;
    for (const [id] of this.tools) {
      if (id.startsWith(prefix)) {
        this.tools.delete(id);
      }
    }
  }

  get(id: string): Tool {
    const tool = this.tools.get(id);
    if (!tool) {
      throw new Error(`Tool '${id}' not found`);
    }
    return tool;
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  async execute<TInput, TOutput>(
    id: string,
    input: TInput,
    context: ToolContext,
  ): Promise<TOutput> {
    const tool = this.get(id) as Tool<TInput, TOutput>;
    const validated = tool.parameters.parse(input);
    return tool.execute(validated, context);
  }

  private createMcpWrapper(mcpRegistry: McpRegistry, mcpTool: McpTool): Tool {
    // Build a zod schema from MCP inputSchema
    const zodSchema = this.mcpSchemaToZod(mcpTool.inputSchema);

    return {
      id: `mcp:${mcpTool.serverName}:${mcpTool.toolName}`,
      description: `[MCP:${mcpTool.serverName}] ${mcpTool.description}`,
      parameters: zodSchema,
      execute: async (input: unknown, _context: ToolContext) => {
        return mcpRegistry.executeTool(
          mcpTool.serverName,
          mcpTool.toolName,
          input as Record<string, unknown>,
        );
      },
    };
  }

  private mcpSchemaToZod(schema: Record<string, unknown>): z.ZodType<unknown> {
    if (schema.type === "object" && schema.properties) {
      const props = schema.properties as Record<string, { type?: string; description?: string; enum?: string[] }>;
      const required = (schema.required as string[]) ?? [];
      const shape: Record<string, z.ZodTypeAny> = {};

      for (const [key, prop] of Object.entries(props)) {
        let base: z.ZodTypeAny;
        switch (prop.type) {
          case "string":
            base = z.string();
            if (prop.enum && prop.enum.length > 0) {
              base = z.enum(prop.enum as [string, ...string[]]);
            }
            break;
          case "number":
          case "integer":
            base = z.number();
            break;
          case "boolean":
            base = z.boolean();
            break;
          case "array":
            base = z.array(z.unknown());
            break;
          default:
            base = z.unknown();
        }

        if (prop.description) {
          base = base.describe(prop.description);
        }

        shape[key] = required.includes(key) ? base : base.optional();
      }

      return z.object(shape);
    }

    return z.record(z.unknown());
  }
}
