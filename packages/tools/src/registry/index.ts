import { Tool, ToolContext } from "../types/index.js";

export class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.id, tool);
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
}
