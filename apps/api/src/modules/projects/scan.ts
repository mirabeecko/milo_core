import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { join, resolve } from "path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../../data");
const projectsFile = join(DATA_DIR, "projects.json");

export interface GitInfo {
  remoteUrl: string | null;
  branch: string;
  lastCommit: {
    hash: string;
    message: string;
    author: string;
    date: string;
  } | null;
  commitCount: number;
  branches: string[];
}

export interface ProjectScanResult {
  name: string;
  path: string;
  github_url: string | null;
  last_commit: {
    hash: string;
    message: string;
    author: string;
    date: string;
  } | null;
  commit_count: number;
  readme_exists: boolean;
  goal: string;
  status: "in_progress" | "paused" | "done";
  done_summary: string;
  remaining_summary: string;
  time_spent_hours: number;
  time_estimate_hours: number;
  cost_spent: number;
  cost_estimate: number;
  last_updated: string;
  description: string;
  priority: string;
}

function getGitInfo(projectPath: string): GitInfo | null {
  const gitDir = join(projectPath, ".git");
  if (!existsSync(gitDir)) return null;

  try {
    const remoteUrl = execSync("git remote get-url origin", { cwd: projectPath, encoding: "utf-8", timeout: 5000 }).trim();
    const branch = execSync("git branch --show-current", { cwd: projectPath, encoding: "utf-8", timeout: 5000 }).trim();
    const commitCount = parseInt(execSync("git rev-list --count HEAD", { cwd: projectPath, encoding: "utf-8", timeout: 10000 }).trim(), 10);

    let lastCommit = null;
    try {
      const log = execSync('git log -1 --format="%H|%s|%an|%aI"', { cwd: projectPath, encoding: "utf-8", timeout: 5000 }).trim();
      const [hash, message, author, date] = log.split("|");
      lastCommit = { hash, message, author, date };
    } catch (err) {
      console.error(`Failed to read git log for ${projectPath}:`, err);
      lastCommit = null;
    }

    return {
      remoteUrl: remoteUrl || null,
      branch,
      lastCommit,
      commitCount,
      branches: [],
    };
  } catch (err) {
    console.error(`Failed to get git info for ${projectPath}:`, err);
    return {
      remoteUrl: null,
      branch: "main",
      lastCommit: null,
      commitCount: 0,
      branches: [],
    };
  }
}

function cleanGithubUrl(url: string | null): string | null {
  if (!url) return null;
  return url
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/\.git$/, "")
    .replace(/^http:\/\//, "https://");
}

function getReadmeContent(projectPath: string): string {
  const readmePath = join(projectPath, "README.md");
  if (!existsSync(readmePath)) return "";
  try {
    const content = readFileSync(readmePath, "utf-8");
    const lines = content.split("\n").filter(l => l.trim());
    return lines.slice(0, 5).join("\n");
  } catch (err) {
    console.error(`Failed to read README from ${readmePath}:`, err);
    return "";
  }
}

function extractGoal(readmeContent: string): string {
  const firstHeading = readmeContent.match(/^#\s+(.+)$/m);
  return firstHeading ? firstHeading[1] : "";
}

function extractDescription(readmeContent: string): string {
  const match = readmeContent.match(/^[^#](.+)$/m);
  return match ? match[1].trim() : "";
}

interface ProjectData {
  projects: Record<string, Partial<ProjectScanResult>>;
}

export async function scanProjects(): Promise<ProjectScanResult[]> {
  let existingProjects: Record<string, Partial<ProjectScanResult>> = {};
  if (existsSync(projectsFile)) {
    try {
      const data = JSON.parse(readFileSync(projectsFile, "utf-8")) as ProjectData;
      if (data.projects && typeof data.projects === "object" && !Array.isArray(data.projects)) {
        existingProjects = data.projects;
      }
    } catch (err) {
      console.error(`Failed to parse ${projectsFile}:`, err);
      existingProjects = {};
    }
  }

  const results: ProjectScanResult[] = [];

  const devPath = "/Users/mb/dev";
  if (!existsSync(devPath)) return results;

  const entries = readdirSync(devPath, { withFileTypes: true });
  const skippedDirs = new Set([
    ".git", "node_modules", "dist", ".next", ".turbo", "__pycache__",
    "dashboards and assistants", "CLAUDE", "CrewAI_OS", "deepseek_env",
    "deepseek", "hermes-workspace", "LettaOS", "mac_voice_ai_agent",
    "android_mac_ai_agent", "MiLO_Agent", "design-agent", "aaa",
    "brozek24-0", "brozek24", "airbags", "webdo24.cz - staré",
  ]);

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (skippedDirs.has(entry.name)) continue;

    const projectPath = join(devPath, entry.name);
    const gitInfo = getGitInfo(projectPath);
    if (!gitInfo) continue;

    const readmeContent = getReadmeContent(projectPath);
    const existing = existingProjects[entry.name] || {};

    const result: ProjectScanResult = {
      name: entry.name,
      path: projectPath,
      github_url: cleanGithubUrl(gitInfo.remoteUrl),
      last_commit: gitInfo.lastCommit,
      commit_count: gitInfo.commitCount,
      readme_exists: existsSync(join(projectPath, "README.md")),
      goal: (existing.goal as string) || extractGoal(readmeContent) || entry.name,
      status: (existing.status as "in_progress" | "paused" | "done") || "in_progress",
      done_summary: (existing.done_summary as string) || "",
      remaining_summary: (existing.remaining_summary as string) || "",
      time_spent_hours: (existing.time_spent_hours as number) || 0,
      time_estimate_hours: (existing.time_estimate_hours as number) || 0,
      cost_spent: (existing.cost_spent as number) || 0,
      cost_estimate: (existing.cost_estimate as number) || 0,
      last_updated: new Date().toISOString(),
      description: (existing.description as string) || extractDescription(readmeContent) || "",
      priority: (existing.priority as string) || "normal",
    };

    results.push(result);
  }

  const updatedProjects: Record<string, ProjectScanResult & { id: string }> = {};
  for (const result of results) {
    const existingId = (existingProjects[result.name] as Record<string, unknown>)?.id as string | undefined;
    updatedProjects[result.name] = {
      ...result,
      id: existingId || crypto.randomUUID(),
    };
  }

  const dir = DATA_DIR;
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  try {
    writeFileSync(projectsFile, JSON.stringify({ projects: updatedProjects }, null, 2));
  } catch (error) {
    console.error(`Failed to save scan results to ${projectsFile}:`, error);
  }

  return results;
}
