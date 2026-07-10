-- MiLO_Core Control Center — Specification & Planning layer
-- Extends the AOS schema with agent specification management,
-- use case definitions, capabilities, versioning, and development tracking.

-- ============================================================
-- Extend existing agents table with spec management fields
-- ============================================================
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS purpose TEXT,
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS implementation_status TEXT NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS progress_percent INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_version_id UUID,
  ADD COLUMN IF NOT EXISTS deployed_version_id UUID,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_slug ON agents(slug) WHERE slug IS NOT NULL;

-- ============================================================
-- Agent specification versions
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_label TEXT,
  specification JSONB NOT NULL DEFAULT '{}'::jsonb,
  change_summary TEXT,
  change_reason TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  parent_version_id UUID REFERENCES agent_versions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  approved_at TIMESTAMPTZ,
  deployed_at TIMESTAMPTZ,
  UNIQUE(agent_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_agent_versions_agent ON agent_versions(agent_id, version_number DESC);

-- ============================================================
-- Use cases (linked to agents)
-- ============================================================
CREATE TABLE IF NOT EXISTS use_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  purpose TEXT,
  trigger_description TEXT,
  category TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  risk_level TEXT NOT NULL DEFAULT 'low',
  status TEXT NOT NULL DEFAULT 'draft',
  implementation_status TEXT NOT NULL DEFAULT 'not_started',
  progress_percent INTEGER NOT NULL DEFAULT 0,
  active_version_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agent_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_use_cases_agent ON use_cases(agent_id, status);

-- ============================================================
-- Use case specification versions
-- ============================================================
CREATE TABLE IF NOT EXISTS use_case_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  use_case_id UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_label TEXT,
  purpose TEXT,
  trigger_description TEXT,
  inputs JSONB NOT NULL DEFAULT '[]'::jsonb,
  preconditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  workflow_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  decision_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  integrations JSONB NOT NULL DEFAULT '[]'::jsonb,
  outputs JSONB NOT NULL DEFAULT '[]'::jsonb,
  persistence_rules TEXT,
  approval_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  security_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  failure_states JSONB NOT NULL DEFAULT '[]'::jsonb,
  fallback_behavior TEXT,
  test_scenarios JSONB NOT NULL DEFAULT '[]'::jsonb,
  definition_of_done JSONB NOT NULL DEFAULT '[]'::jsonb,
  observability_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  specification JSONB NOT NULL DEFAULT '{}'::jsonb,
  change_summary TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'draft',
  UNIQUE(use_case_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_use_case_versions_uc ON use_case_versions(use_case_id, version_number DESC);

-- ============================================================
-- Capabilities (shared across agents)
-- ============================================================
CREATE TABLE IF NOT EXISTS capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  capability_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  inputs JSONB NOT NULL DEFAULT '[]'::jsonb,
  outputs JSONB NOT NULL DEFAULT '[]'::jsonb,
  api_interface TEXT,
  dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'planned',
  maturity_level TEXT NOT NULL DEFAULT 'concept',
  owner TEXT,
  active_version TEXT,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Agent to capabilities mapping
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_capabilities (
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  capability_id UUID NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
  PRIMARY KEY (agent_id, capability_id)
);

-- ============================================================
-- Tools registry
-- ============================================================
CREATE TABLE IF NOT EXISTS tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'external',
  provider TEXT,
  description TEXT,
  configuration_schema JSONB,
  secret_reference TEXT,
  availability_status TEXT NOT NULL DEFAULT 'unknown',
  health_status TEXT NOT NULL DEFAULT 'unknown',
  risk_level TEXT NOT NULL DEFAULT 'low',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Agent to tools mapping
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_tools (
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  allowed_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  approval_required_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (agent_id, tool_id)
);

-- ============================================================
-- Integrations registry
-- ============================================================
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'external',
  provider TEXT,
  description TEXT,
  config_schema JSONB,
  status TEXT NOT NULL DEFAULT 'planned',
  health_status TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Development tasks (human/AI development work)
-- ============================================================
CREATE TABLE IF NOT EXISTS development_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  use_case_id UUID REFERENCES use_cases(id) ON DELETE SET NULL,
  capability_id UUID REFERENCES capabilities(id) ON DELETE SET NULL,
  change_request_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  technical_context TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  task_type TEXT NOT NULL DEFAULT 'implementation',
  priority TEXT NOT NULL DEFAULT 'normal',
  risk_level TEXT NOT NULL DEFAULT 'low',
  status TEXT NOT NULL DEFAULT 'planned',
  assigned_worker TEXT,
  assigned_model TEXT,
  reviewer TEXT,
  acceptance_criteria JSONB,
  definition_of_done JSONB,
  estimated_complexity TEXT,
  created_from_spec_diff BOOLEAN NOT NULL DEFAULT false,
  blocked_reason TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_tasks_agent ON development_tasks(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_dev_tasks_uc ON development_tasks(use_case_id, status);

-- ============================================================
-- Task dependencies
-- ============================================================
CREATE TABLE IF NOT EXISTS task_dependencies (
  task_id UUID NOT NULL REFERENCES development_tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES development_tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'blocks',
  PRIMARY KEY (task_id, depends_on_task_id)
);

-- ============================================================
-- Change requests (captures spec changes and their impact)
-- ============================================================
CREATE TABLE IF NOT EXISTS change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  from_version_id UUID,
  to_version_id UUID,
  requested_by TEXT,
  change_summary TEXT,
  specification_diff JSONB,
  impact_analysis JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ
);

-- ============================================================
-- Missions (higher-level work packages)
-- ============================================================
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  mission_type TEXT NOT NULL DEFAULT 'implementation',
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  specification_version_id UUID,
  status TEXT NOT NULL DEFAULT 'draft',
  priority TEXT NOT NULL DEFAULT 'normal',
  worker TEXT,
  reviewer TEXT,
  approval_mode TEXT NOT NULL DEFAULT 'auto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_missions_agent ON missions(agent_id, status);

-- ============================================================
-- Development runs (each execution of a developer)
-- ============================================================
CREATE TABLE IF NOT EXISTS development_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  task_id UUID REFERENCES development_tasks(id) ON DELETE SET NULL,
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
  worker TEXT,
  model TEXT,
  prompt_snapshot TEXT,
  specification_version_id UUID,
  repository_commit_before TEXT,
  repository_commit_after TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  token_usage INTEGER,
  cost DOUBLE PRECISION
);

-- ============================================================
-- Audit runs (independent verification of development)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  development_run_id UUID REFERENCES development_runs(id) ON DELETE SET NULL,
  auditor TEXT,
  model TEXT,
  audit_type TEXT NOT NULL DEFAULT 'code_review',
  status TEXT NOT NULL DEFAULT 'pending',
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  severity TEXT,
  verdict TEXT,
  required_fixes JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- Test cases linked to use cases
-- ============================================================
CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  use_case_id UUID REFERENCES use_cases(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  test_type TEXT NOT NULL DEFAULT 'unit',
  input_fixture JSONB,
  expected_output JSONB,
  approval_requirement BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'defined',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Test runs
-- ============================================================
CREATE TABLE IF NOT EXISTS test_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  implementation_version TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  actual_output JSONB,
  error TEXT,
  duration_ms INTEGER,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Approvals
-- ============================================================
CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  action TEXT NOT NULL,
  requested_by TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approver TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  decision_reason TEXT,
  decided_at TIMESTAMPTZ
);

-- ============================================================
-- Deployments
-- ============================================================
CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  version_id UUID,
  environment TEXT NOT NULL DEFAULT 'production',
  commit_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  deployed_by TEXT,
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rollback_reference UUID REFERENCES deployments(id) ON DELETE SET NULL
);

-- ============================================================
-- Runtime runs (production agent executions)
-- ============================================================
CREATE TABLE IF NOT EXISTS runtime_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  use_case_id UUID REFERENCES use_cases(id) ON DELETE SET NULL,
  trigger_type TEXT,
  input JSONB,
  output JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  tools_used JSONB,
  cost DOUBLE PRECISION,
  approval_state TEXT
);

-- ============================================================
-- Activity log (unified audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
  ip_address TEXT,
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
