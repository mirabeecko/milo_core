import { z } from "zod";
import type { Tool } from "../../types/index.js";

const githubRepoSchema = z.object({
  owner: z.string(),
  repo: z.string(),
});

const githubIssuesSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  state: z.enum(["open", "closed", "all"]).optional(),
});

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  stars: number;
  forks: number;
  openIssues: number;
  description: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  url: string;
}

export class GitHubRepoTool implements Tool<z.infer<typeof githubRepoSchema>, GitHubRepoInfo> {
  readonly id = "github:repo";
  readonly description = "GitHub provider není nakonfigurován";
  readonly parameters = githubRepoSchema;

  async execute(input: z.infer<typeof githubRepoSchema>): Promise<GitHubRepoInfo> {
    throw new Error("GitHub provider není nakonfigurován. Nastavte GitHub token pro reálná data.");
  }
}

export class GitHubIssuesTool implements Tool<z.infer<typeof githubIssuesSchema>, GitHubIssue[]> {
  readonly id = "github:issues";
  readonly description = "GitHub provider není nakonfigurován";
  readonly parameters = githubIssuesSchema;

  async execute(input: z.infer<typeof githubIssuesSchema>): Promise<GitHubIssue[]> {
    throw new Error("GitHub provider není nakonfigurován. Nastavte GitHub token pro reálná data.");
  }
}

export function registerGitHubTools(registry: { register(tool: Tool): void }): void {
  registry.register(new GitHubRepoTool());
  registry.register(new GitHubIssuesTool());
}
