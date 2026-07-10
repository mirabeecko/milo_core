import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../../apps/api/data");
const PROJECTS_FILE = join(DATA_DIR, "projects.json");

export interface BreadcrumbEntry {
  timestamp: string;
  agent: string;
  summary: string;
  watch_out: string;
}

export function writeBreadcrumb(
  project: string,
  agent: string,
  summary: string,
  watch_out: string,
): void {
  try {
    let data: Record<string, unknown> = {};
    if (existsSync(PROJECTS_FILE)) {
      data = JSON.parse(readFileSync(PROJECTS_FILE, "utf-8"));
    }

    const projects = (data.projects as Record<string, Record<string, unknown>>) ?? {};
    const proj = projects[project] ?? {};

    const breadcrumbs: BreadcrumbEntry[] = Array.isArray(proj.breadcrumbs)
      ? (proj.breadcrumbs as BreadcrumbEntry[])
      : [];

    breadcrumbs.push({
      timestamp: new Date().toISOString(),
      agent,
      summary,
      watch_out,
    });

    proj.breadcrumbs = breadcrumbs;
    projects[project] = proj;
    data.projects = projects;

    writeFileSync(PROJECTS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`[breadcrumbs] Failed to write breadcrumb for project ${project}:`, err);
  }
}

export function getBreadcrumbs(project?: string): BreadcrumbEntry[] {
  try {
    if (!existsSync(PROJECTS_FILE)) return [];
    const data = JSON.parse(readFileSync(PROJECTS_FILE, "utf-8"));
    const projects = (data.projects as Record<string, Record<string, unknown>>) ?? {};

    if (project) {
      const proj = projects[project];
      if (!proj) return [];
      return Array.isArray(proj.breadcrumbs) ? (proj.breadcrumbs as BreadcrumbEntry[]) : [];
    }

    const all: BreadcrumbEntry[] = [];
    for (const [, proj] of Object.entries(projects)) {
      if (Array.isArray(proj.breadcrumbs)) {
        all.push(...(proj.breadcrumbs as BreadcrumbEntry[]));
      }
    }
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return [];
  }
}
