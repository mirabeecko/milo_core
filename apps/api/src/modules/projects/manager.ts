import { writeFileSync } from "fs";
import { join, resolve } from "path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getProjects, createProject, saveProjects } from "./service.js";
import { scanProjects } from "./scan.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../../data");
import type { Project } from "./service.js";

export async function refreshProjects(): Promise<void> {
  const scanned = await scanProjects();
  const existing = getProjects();

  const merged: Project[] = [];

  for (const scannedProject of scanned) {
    const existingProject = existing.find(
      (e) => e.name === scannedProject.name || e.path === scannedProject.path,
    );

    if (existingProject) {
      merged.push({
        ...existingProject,
        github_url: scannedProject.github_url ?? existingProject.github_url,
        last_commit: scannedProject.last_commit ?? existingProject.last_commit,
        commit_count: scannedProject.commit_count,
        last_updated: new Date().toISOString(),
        goal: existingProject.goal || scannedProject.goal,
        status: existingProject.status || scannedProject.status,
        done_summary: existingProject.done_summary || scannedProject.done_summary,
        remaining_summary: existingProject.remaining_summary || scannedProject.remaining_summary,
        time_spent_hours: existingProject.time_spent_hours || scannedProject.time_spent_hours,
        time_estimate_hours: existingProject.time_estimate_hours || scannedProject.time_estimate_hours,
        cost_spent: existingProject.cost_spent || scannedProject.cost_spent,
        cost_estimate: existingProject.cost_estimate || scannedProject.cost_estimate,
      });
    } else {
      const newProject = await createProject({
        name: scannedProject.name,
        path: scannedProject.path,
        github_url: scannedProject.github_url,
        last_commit: scannedProject.last_commit,
        commit_count: scannedProject.commit_count,
        goal: scannedProject.goal,
        status: scannedProject.status,
        done_summary: scannedProject.done_summary,
        remaining_summary: scannedProject.remaining_summary,
        time_spent_hours: scannedProject.time_spent_hours,
        time_estimate_hours: scannedProject.time_estimate_hours,
        cost_spent: scannedProject.cost_spent,
        cost_estimate: scannedProject.cost_estimate,
        description: scannedProject.description,
        priority: scannedProject.priority,
        last_updated: scannedProject.last_updated,
      });
      merged.push(newProject);
    }
  }

  for (const existingProject of existing) {
    if (!merged.find((m) => m.name === existingProject.name)) {
      merged.push(existingProject);
    }
  }

  saveProjects(merged);

  const projectsFile = join(DATA_DIR, "projects.json");
  try {
    writeFileSync(projectsFile, JSON.stringify({ projects: Object.fromEntries(merged.map((p) => [p.name, p])) }, null, 2));
  } catch (error) {
    console.error(`Failed to save projects to ${projectsFile}:`, error);
  }
}
