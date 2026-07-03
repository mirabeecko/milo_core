import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { GitCommit, GitInfo, GitReader } from "./types.js";

const execAsync = promisify(exec);

export class DefaultGitReader implements GitReader {
  async getInfo(projectPath: string): Promise<GitInfo> {
    const branch = await this.exec(projectPath, "git branch --show-current");
    const commitCount = Number(await this.exec(projectPath, "git rev-list --count HEAD").catch(() => "0"));
    const recentCommits = await this.getRecentCommits(projectPath);
    const branches = await this.getBranches(projectPath);
    const lastMerge = await this.getLastMerge(projectPath);

    return {
      branch: branch || "main",
      lastCommit: recentCommits[0] ?? {
        hash: "unknown",
        message: "No commits",
        author: "unknown",
        date: new Date().toISOString(),
      },
      lastMerge,
      commitCount,
      recentCommits,
      branches,
    };
  }

  private async getRecentCommits(projectPath: string): Promise<GitCommit[]> {
    const output = await this.exec(projectPath, "git log --pretty=format:'%H|%s|%an|%aI' -n 10").catch(() => "");
    return output
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, message, author, date] = line.split("|");
        return { hash: hash ?? "", message: message ?? "", author: author ?? "", date: date ?? "" };
      });
  }

  private async getBranches(projectPath: string): Promise<string[]> {
    const output = await this.exec(projectPath, "git branch -a --format='%(refname:short)'").catch(() => "");
    return output
      .split("\n")
      .map((b) => b.trim())
      .filter((b) => b.length > 0 && !b.startsWith("origin/HEAD"));
  }

  private async getLastMerge(projectPath: string): Promise<GitCommit | undefined> {
    const output = await this.exec(projectPath, "git log --merges --pretty=format:'%H|%s|%an|%aI' -n 1").catch(() => "");
    if (!output) return undefined;
    const [hash, message, author, date] = output.split("|");
    return { hash: hash ?? "", message: message ?? "", author: author ?? "", date: date ?? "" };
  }

  private async exec(projectPath: string, command: string): Promise<string> {
    const { stdout } = await execAsync(command, { cwd: projectPath });
    return stdout.trim();
  }
}
