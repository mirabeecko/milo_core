export type AgentStatus = "draft" | "specified" | "planned" | "in_development" | "partially_operational" | "operational" | "degraded" | "blocked" | "deprecated" | "archived";
export type AgentLifecycleStatus = "specified" | "in_development" | "operational" | "offline";

export interface AgentVersion {
  id: string;
  agent_id: string;
  version_number: number;
  version_label?: string;
  specification: Record<string, unknown>;
  change_summary?: string;
  change_reason?: string;
  created_by: string;
  parent_version_id?: string;
  status: string;
  approved_at?: string;
  deployed_at?: string;
  created_at: string;
}

export interface Agent {
  id: string;
  slug: string;
  name: string;
  description?: string;
  purpose?: string;
  category?: string;
  owner?: string;
  status: AgentStatus;
  lifecycle_status: AgentLifecycleStatus;
  risk_level: string;
  priority: string;
  active_version_id?: string;
  deployed_version_id?: string;
  implementation_progress: number;
  runtime_status: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  versions?: AgentVersion[];
  use_cases?: any[];
  active_spec?: Record<string, unknown>;
}

export interface CreateAgentInput {
  slug: string;
  name: string;
  description?: string;
  purpose?: string;
  category?: string;
  owner?: string;
  risk_level?: string;
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  purpose?: string;
  category?: string;
  owner?: string;
  status?: AgentStatus;
  risk_level?: string;
  implementation_progress?: number;
}
