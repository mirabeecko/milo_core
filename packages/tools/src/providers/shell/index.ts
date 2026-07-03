import { exec } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import type { Tool, ToolContext } from "../../types/index.js";

const execAsync = promisify(exec);

const shellSchema = z.object({
  command: z.string(),
  cwd: z.string().optional(),
  timeoutMs: z.number().optional(),
});

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class ShellTool implements Tool<z.infer<typeof shellSchema>, ShellResult> {
  readonly id = "shell:execute";
  readonly description = "Execute a shell command";
  readonly parameters = shellSchema;

  async execute(input: z.infer<typeof shellSchema>, _context: ToolContext): Promise<ShellResult> {
    const cwd = input.cwd ?? process.cwd();
    const timeout = input.timeoutMs ?? 300_000;

    try {
      const { stdout, stderr } = await execAsync(input.command, { cwd, timeout });
      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
      };
    } catch (error) {
      const execError = error as { stdout?: string; stderr?: string; code?: number; message?: string };
      return {
        stdout: execError.stdout?.trim() ?? "",
        stderr: execError.stderr?.trim() ?? execError.message ?? "",
        exitCode: execError.code ?? 1,
      };
    }
  }
}

export function registerShellTools(registry: { register(tool: Tool): void }): void {
  registry.register(new ShellTool());
}
