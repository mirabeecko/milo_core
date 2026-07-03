import { apiClient, useMockData } from "./client";
import type { Project } from "@/lib/types";
import { projects } from "@/lib/mocks";

export async function getProjects(): Promise<Project[]> {
  if (useMockData) {
    return projects;
  }

  return apiClient<Project[]>("/projects");
}
