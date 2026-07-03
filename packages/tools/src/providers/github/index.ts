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
  readonly description = "Get information about a GitHub repository";
  readonly parameters = githubRepoSchema;

  async execute(input: z.infer<typeof githubRepoSchema>): Promise<GitHubRepoInfo> {
    return {
      owner: input.owner,
      repo: input.repo,
      stars: 0,
      forks: 0,
      openIssues: 0,
      description: "Mock GitHub repository info. Replace with real GitHub API client.",
    };
  }
}

export class GitHubIssuesTool implements Tool<z.infer<typeof githubIssuesSchema>, GitHubIssue[]> {
  readonly id = "github:issues";
  readonly description = "List issues in a GitHub repository";
  readonly parameters = githubIssuesSchema;

  async execute(input: z.infer<typeof githubIssuesSchema>): Promise<GitHubIssue[]> {
    return [
      {
        number: 1,
        title: `Mock issue in ${input.owner}/${input.repo}`,
        state: input.state ?? "open",
        url: `https://github.com/${input.owner}/${input.repo}/issues/1`,
      },
    ];
  }
}

export function registerGitHubTools(registry: { register(tool: Tool): void }): void {
  registry.register(new GitHubRepoTool());
  registry.register(new GitHubIssuesTool());
}
