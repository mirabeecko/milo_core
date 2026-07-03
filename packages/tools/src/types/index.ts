import { z } from "zod";

export const toolParameterSchema = z.record(z.unknown());

export interface ToolContext {
  userId: string;
  traceId: string;
}

export interface Tool<TInput = unknown, TOutput = unknown> {
  id: string;
  description: string;
  parameters: z.ZodType<TInput>;
  execute(input: TInput, context: ToolContext): Promise<TOutput>;
}
