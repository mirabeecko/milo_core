export type ComponentType = "frontend" | "backend" | "database" | "workflow" | "prompt" | "tool" | "integration" | "test" | "infrastructure" | "documentation" | "monitoring";
export type ImplStatus = "not_started" | "in_progress" | "implemented" | "verified";
export type TestStatus = "none" | "planned" | "implemented" | "passing" | "failing";
export type DeployedStatus = "none" | "staging" | "production" | "both";

export interface Capability {
  id: string;
  capability_code: string;
  name: string;
  description?: string;
  category?: string;
  status: string;
  maturity_level: string;
  owner?: string;
  active_version: number;
  implementation_progress: number;
  created_at: string;
  updated_at?: string;
}

export interface ImplementationComponent {
  id: string;
  agent_id?: string;
  use_case_id?: string;
  capability_id?: string;
  component_type: ComponentType;
  name: string;
  repository?: string;
  file_path?: string;
  module_name?: string;
  api_endpoint?: string;
  implementation_status: ImplStatus;
  test_status: TestStatus;
  deployed_status: DeployedStatus;
  last_verified_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface DevelopmentTask {
  id: string;
  agent_id?: string;
  use_case_id?: string;
  capability_id?: string;
  title: string;
  description?: string;
  technical_context?: string;
  source: string;
  task_type: string;
  priority: string;
  risk_level: string;
  status: string;
  assigned_worker?: string;
  assigned_model?: string;
  reviewer?: string;
  acceptance_criteria?: string;
  definition_of_done?: string;
  estimated_complexity: number;
  created_from_spec_diff: boolean;
  blocked_reason?: string;
  started_at?: string;
  completed_at?: string;
  verified_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface AgentProgress {
  agent_id: string;
  progress: number;
  breakdown: {
    use_cases: { total: number; done: number; percent: number };
    components: { total: number; done: number; percent: number };
    tasks: { total: number; done: number; percent: number };
  };
  missing: string[];
}
