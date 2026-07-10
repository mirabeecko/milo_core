export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export * from "./agent.js";
export * from "./task.js";
export * from "./mission.js";
export * from "./agent-event.js";
export * from "./component.js";
export type { UseCase, UseCaseVersion, CreateUseCaseInput, UpdateUseCaseInput } from "./use-case.js";
export type { UseCaseStatus, UseCaseImplStatus } from "./use-case.js";
export type { CreateAgentInput, UpdateAgentInput } from "./agent.js";
