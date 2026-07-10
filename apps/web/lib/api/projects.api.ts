import { apiClient } from "./client";
import type { Project, ProjectUsage } from "@/lib/types";

export async function getProjects(): Promise<Project[]> {
  return apiClient<Project[]>("/projects");
}

export async function getProject(id: string): Promise<Project> {
  return apiClient<Project>(`/projects/${encodeURIComponent(id)}`);
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  priority?: "critical" | "important" | "normal" | "low";
  status?: "active" | "on_hold" | "completed" | "archived";
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  return apiClient<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface UpdateProjectInput {
  goal?: string;
  status?: string;
  done_summary?: string;
  remaining_summary?: string;
  time_spent_hours?: number;
  time_estimate_hours?: number;
  cost_spent?: number;
  cost_estimate?: number;
  description?: string;
  priority?: string;
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  return apiClient<Project>(`/projects/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient(`/projects/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function scanProjects(): Promise<{ message: string; results: Project[] }> {
  return apiClient("/projects/scan", { method: "POST" });
}

export async function getProjectUsage(project: string): Promise<ProjectUsage> {
  return apiClient<ProjectUsage>(`/usage/project/${encodeURIComponent(project)}`);
}
