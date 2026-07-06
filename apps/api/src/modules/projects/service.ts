import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Project } from "../../lib/types.js";

const projectsFile = join(process.cwd(), "apps/api/data/projects.json");

export function getProjects(): Project[] {
  if (!existsSync(projectsFile)) {
    return [];
  }

  try {
    const content = readFileSync(projectsFile, "utf-8");
    const data = JSON.parse(content);
    return data.projects || [];
  } catch {
    return [];
  }
}

export async function createProject(project: Omit<Project, "id">): Promise<Project> {
  const projects = getProjects();
  const newProject: Project = {
    ...project,
    id: crypto.randomUUID(),
  };
  projects.unshift(newProject);
  
  const data = { projects };
  writeFileSync(projectsFile, JSON.stringify(data, null, 2));
  
  return newProject;
}

export async function deleteProject(id: string): Promise<void> {
  const projects = getProjects();
  const filtered = projects.filter((p) => p.id !== id);
  
  const data = { projects: filtered };
  writeFileSync(projectsFile, JSON.stringify(data, null, 2));
}
