import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { BuildResult, BuildRunner, LintResult, TestResult } from "./types.js";

const execAsync = promisify(exec);

export class DefaultBuildRunner implements BuildRunner {
  async runLint(projectPath: string): Promise<LintResult> {
    return runCommand(projectPath, "pnpm -r lint", "lint");
  }

  async runBuild(projectPath: string): Promise<BuildResult> {
    return runCommand(projectPath, "pnpm -r build", "build");
  }

  async runTests(projectPath: string): Promise<TestResult> {
    const start = Date.now();
    try {
      const { stdout, stderr } = await execAsync("pnpm -r test", { cwd: projectPath, timeout: 300_000 });
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
  projectPath: string,
  command: string,
  type: "lint" | "build",
): Promise<LintResult | BuildResult> {
  const start = Date.now();
  try {
    const { stdout, stderr } = await execAsync(command, { cwd: projectPath, timeout: 300_000 });
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
