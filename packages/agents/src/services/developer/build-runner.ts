import type { BuildResult, BuildRunner, LintResult, TestResult, ToolExecutor } from "./types.js";

export class DefaultBuildRunner implements BuildRunner {
  constructor(private executeTool: ToolExecutor) {}
  async runLint(projectPath: string): Promise<LintResult> {
    return runCommand(this.executeTool, projectPath, "pnpm -r lint", "lint");
  }

  async runBuild(projectPath: string): Promise<BuildResult> {
    return runCommand(this.executeTool, projectPath, "pnpm -r build", "build");
  }

  async runTests(projectPath: string): Promise<TestResult> {
    const start = Date.now();
    try {
      const { stdout, stderr } = await this.executeTool<{ command: string; cwd?: string; timeoutMs?: number }, { stdout: string; stderr: string; exitCode: number }>("shell:execute", { command: "pnpm -r test", cwd: projectPath, timeoutMs: 300_000 });
      const output = `${stdout}\n${stderr}`;
      const passed = (output.match(/Tests\s+(\d+)\s+passed/)?.[1] ?? "0");
      const failed = (output.match(/Tests\s+(\d+)\s+failed/)?.[1] ?? "0");
      const skipped = (output.match(/skipped\s+(\d+)/i)?.[1] ?? "0");
      return {
        status: "success",
        totalTests: Number(passed) + Number(failed) + Number(skipped),
        passedTests: Number(passed),
        failedTests: Number(failed),
        skippedTests: Number(skipped),
        failedTestNames: [],
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "failure",
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        skippedTests: 0,
        failedTestNames: [error instanceof Error ? error.message : "Test command failed"],
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

async function runCommand(
  executeTool: ToolExecutor,
  projectPath: string,
  command: string,
  type: "lint" | "build",
): Promise<LintResult | BuildResult> {
  const start = Date.now();
  try {
    const { stdout, stderr } = await executeTool<{ command: string; cwd?: string; timeoutMs?: number }, { stdout: string; stderr: string; exitCode: number }>("shell:execute", { command, cwd: projectPath, timeoutMs: 300_000 });
    const output = `${stdout}\n${stderr}`;
    const warnings: string[] = [];
    const errors: string[] = [];

    for (const line of output.split("\n")) {
      if (line.toLowerCase().includes("warning")) warnings.push(line.trim());
      if (line.toLowerCase().includes("error")) errors.push(line.trim());
    }

    const base = {
      status: errors.length > 0 ? "failure" : "success",
      warnings: warnings.slice(0, 20),
      errors: errors.slice(0, 20),
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };

    if (type === "build") {
      return { ...base, status: errors.length > 0 ? "failure" : "success" };
    }
    return { status: errors.length > 0 ? "failure" : "success", warnings: base.warnings, errors: base.errors, timestamp: base.timestamp };
  } catch (error) {
    const output = error instanceof Error ? error.message : String(error);
    return {
      status: "failure",
      warnings: [],
      errors: [output],
      timestamp: new Date().toISOString(),
    };
  }
}
