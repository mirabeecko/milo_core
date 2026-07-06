import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { DefaultGitReader } from "../../../agents/src/services/developer/git-reader.js";
import { executeTool } from "../../../agents/src/services/developer/tool-executor.js";

export interface ProjectScanResult {
  name: string;
  path: string;
  github_url?: string;
  last_commit?: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
  commit_count: number;
  readme_exists: boolean;
  goal?: string;
  status?: "in_progress" | "paused" | "done";
  done_summary?: string;
  remaining_summary?: string;
  time_spent_hours?: number;
  time_estimate_hours?: number;
  cost_spent?: number;
  cost_estimate?: number;
  last_updated: string;
}

export async function scanProjects(): Promise<ProjectScanResult[]> {
  const projectsDir = join(process.cwd(), "apps/api/data");
  const projectsFile = join(projectsDir, "projects.json");
  
  // Read existing projects
  let existingProjects: Record<string, Partial<ProjectScanResult>> = {};
  if (existsSync(projectsFile)) {
    const content = readFileSync(projectsFile, "utf-8");
    try {
      const data = JSON.parse(content);
      existingProjects = data.projects || {};
    } catch {
      existingProjects = {};
    }
  }

  const results: ProjectScanResult[] = [];
  const projectsPath = join(process.cwd(), "apps/api/data");
  
  // Scan /Users/mb/dev/* and apps/api/data/*
  const scanPaths = [
    join(process.cwd(), "apps/api/data"),
    join(process.cwd(), "apps/api/data/projects"),
  ];

  for (const basePath of scanPaths) {
    if (!existsSync(basePath)) continue;

    const entries = readdirSync(basePath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const projectPath = join(basePath, entry.name);
      const projectKey = entry.name;

      // Skip if already exists
      if (existingProjects[projectKey]) continue;

      // Try to read git info
      let gitInfo: any = null;
      try {
        const gitReader = new DefaultGitReader(executeTool);
        gitInfo = await gitReader.getInfo(projectPath);
      } catch {
        // No git repo, skip
        continue;
      }

      // Check for README
      const readmePath = join(projectPath, "README.md");
      const readmeExists = existsSync(readmePath);

      const result: ProjectScanResult = {
        name: entry.name,
        path: projectPath,
        github_url: gitInfo.remoteUrl,
        last_commit: gitInfo.lastCommit,
        commit_count: gitInfo.commitCount,
        readme_exists: readmeExists,
        goal: existingProjects[projectKey]?.goal,
        status: existingProjects[projectKey]?.status,
        done_summary: existingProjects[projectKey]?.done_summary,
        remaining_summary: existingProjects[projectKey]?.remaining_summary,
        time_spent_hours: existingProjects[projectKey]?.time_spent_hours,
        time_estimate_hours: existingProjects[projectKey]?.time_estimate_hours,
        cost_spent: existingProjects[projectKey]?.cost_spent,
        cost_estimate: existingProjects[projectKey]?.cost_estimate,
        last_updated: new Date().toISOString(),
      };

      results.push(result);
    }
  }

  // Save updated projects
  const updatedProjects: Record<string, ProjectScanResult> = {};
  for (const result of results) {
    updatedProjects[result.name] = result;
  }

  const updatedData = { projects: updatedProjects };
  writeFileSync(projectsFile, JSON.stringify(updatedData, null, 2));

  return results;
}
