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
export * from "./agent-models.js";
export * from "./task.js";
export * from "./mission.js";
export * from "./agent-event.js";
export * from "./spec-status.js";

export type {
  AgentSpec,
  AgentSpecVersion,
  UseCase,
  UseCaseVersion,
  AgentCapability,
  Tool,
  AgentTool,
  Integration,
  DevTask,
  TaskDependency,
  ChangeRequest,
  DevMission,
  DevelopmentRun,
  AuditRun,
  TestCase,
  TestRun,
  Approval,
  Deployment,
  RuntimeRun,
  ActivityLogEntry,
  ImplComponent,
  AgentWithRelations,
  UseCaseWithRelations,
  AgentReadinessMatrix,
  ImpactAnalysis,
  SpecDiff,
  DeveloperPromptContext,
} from "./control-center.js";
