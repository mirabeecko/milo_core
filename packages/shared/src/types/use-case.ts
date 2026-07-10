export type UseCaseStatus = "draft" | "ready_for_planning" | "planned" | "in_development" | "in_review" | "implemented" | "tested" | "deployed" | "operational" | "blocked" | "obsolete";
export type UseCaseImplStatus = "not_started" | "partial" | "implemented" | "verified" | "blocked";

export interface UseCaseVersion {
  id: string;
  use_case_id: string;
  version_number: number;
  version_label?: string;
  specification: Record<string, unknown>;
  change_summary?: string;
  change_reason?: string;
  created_by: string;
  parent_version_id?: string;
  status: string;
  created_at: string;
}

export interface UseCase {
  id: string;
  agent_id: string;
  slug: string;
  name: string;
  description?: string;
  category?: string;
  risk_level: string;
  priority: string;
  status: UseCaseStatus;
  active_version_id?: string;
  implementation_status: UseCaseImplStatus;
  implementation_progress: number;
  created_at: string;
  updated_at: string;
  versions?: UseCaseVersion[];
  active_spec?: Record<string, unknown>;
}

export interface CreateUseCaseInput {
  agent_id: string;
  slug: string;
  name: string;
  description?: string;
  category?: string;
  risk_level?: string;
  priority?: string;
}

export interface UpdateUseCaseInput {
  name?: string;
  description?: string;
  category?: string;
  status?: UseCaseStatus;
  implementation_status?: UseCaseImplStatus;
  implementation_progress?: number;
}
