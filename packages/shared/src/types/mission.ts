import type { TaskPriority, TaskResult } from "./task.js";

export type MissionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface Mission {
  id: string;
  title: string;
  description?: string;
  ownerId: "chief-of-staff";
  status: MissionStatus;
  priority: TaskPriority;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: TaskResult;
}

export interface CreateMissionInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
}
