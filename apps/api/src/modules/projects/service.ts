import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export interface Project {
  id: string;
  name: string;
  description: string;
  priority: string;
  status: string;
  goal: string;
  done_summary: string;
  remaining_summary: string;
  time_spent_hours: number;
  time_estimate_hours: number;
  cost_spent: number;
  cost_estimate: number;
  last_updated: string;
  github_url: string | null;
  last_commit: { hash: string; message: string; author: string; date: string } | null;
  commit_count: number;
  path: string;
  openTasks?: number;
  documents?: number;
  lastActivity?: string;
  color?: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../../data");
const projectsFile = join(DATA_DIR, "projects.json");

type ProjectRecord = Record<string, unknown>;

function normalizeProject(p: ProjectRecord): Project {
  const id = String(p.id || p._id || "");
  return {
    id: id || crypto.randomUUID(),
    name: String(p.name || ""),
    description: String(p.description || ""),
    priority: String(p.priority || "normal"),
    status: String(p.status || "active"),
    goal: String(p.goal || ""),
    done_summary: String(p.done_summary || ""),
    remaining_summary: String(p.remaining_summary || ""),
    time_spent_hours: Number(p.time_spent_hours) || 0,
    time_estimate_hours: Number(p.time_estimate_hours) || 0,
    cost_spent: Number(p.cost_spent) || 0,
    cost_estimate: Number(p.cost_estimate) || 0,
    last_updated: String(p.last_updated || new Date().toISOString()),
    github_url: typeof p.github_url === "string" ? p.github_url : null,
    last_commit: p.last_commit as Project["last_commit"] || null,
    commit_count: Number(p.commit_count) || 0,
    path: String(p.path || ""),
    openTasks: Number(p.openTasks) || 0,
    documents: Number(p.documents) || 0,
    lastActivity: String(p.lastActivity || p.last_updated || new Date().toISOString()),
    color: String(p.color || "bg-primary"),
  };
}

export function getProjects(): Project[] {
  if (!existsSync(projectsFile)) return [];
  try {
    const content = readFileSync(projectsFile, "utf-8");
    const data = JSON.parse(content) as { projects?: Record<string, ProjectRecord> };
    const projectsMap = data.projects || {};
    return Object.values(projectsMap).map(normalizeProject);
  } catch {
    return [];
  }
}

export function getProject(idOrName: string): Project | null {
  const projects = getProjects();
  return projects.find((p) => p.id === idOrName || p.name === idOrName) || null;
}

export async function createProject(project: Omit<Project, "id">): Promise<Project> {
  const projects = getProjects();
  const id = crypto.randomUUID();
  const newProject: Project = normalizeProject({ ...project, id } as ProjectRecord);
  projects.unshift(newProject);
  saveProjectsFromArray(projects);
  return newProject;
}

export async function updateProject(name: string, updates: Partial<Project>): Promise<Project | null> {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.name === name || p.id === name);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...updates, last_updated: new Date().toISOString() };
  saveProjectsFromArray(projects);
  return projects[idx];
}

export async function deleteProject(id: string): Promise<void> {
  const projects = getProjects();
  saveProjectsFromArray(projects.filter((p) => p.id !== id && p.name !== id));
}

export function saveProjects(projects: Project[]): void {
  saveProjectsFromArray(projects);
}

function saveProjectsFromArray(projects: Project[]): void {
  const projectsMap: Record<string, Project> = {};
  for (const p of projects) projectsMap[p.name] = p;
  try {
    writeFileSync(projectsFile, JSON.stringify({ projects: projectsMap }, null, 2));
  } catch (error) {
    console.error(`Failed to save projects to ${projectsFile}:`, error);
  }
}
