-- 001_agents.sql — Agents & Use Cases tables
-- Fáze 1 Control Center

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  purpose TEXT,
  category TEXT,
  owner TEXT,
  status TEXT DEFAULT 'draft',
  lifecycle_status TEXT DEFAULT 'specified',
  risk_level TEXT DEFAULT 'medium',
  priority TEXT DEFAULT 'normal',
  active_version_id UUID,
  deployed_version_id UUID,
  implementation_progress INTEGER DEFAULT 0,
  runtime_status TEXT DEFAULT 'offline',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS agent_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_label TEXT,
  specification JSONB NOT NULL DEFAULT '{}',
  change_summary TEXT,
  change_reason TEXT,
  created_by TEXT DEFAULT 'owner',
  parent_version_id UUID REFERENCES agent_versions(id),
  status TEXT DEFAULT 'draft',
  approved_at TIMESTAMPTZ,
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, version_number)
);

CREATE TABLE IF NOT EXISTS use_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  risk_level TEXT DEFAULT 'medium',
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'draft',
  active_version_id UUID,
  implementation_status TEXT DEFAULT 'not_started',
  implementation_progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, slug)
);

CREATE TABLE IF NOT EXISTS use_case_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_label TEXT,
  specification JSONB NOT NULL DEFAULT '{}',
  change_summary TEXT,
  change_reason TEXT,
  created_by TEXT DEFAULT 'owner',
  parent_version_id UUID REFERENCES use_case_versions(id),
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(use_case_id, version_number)
);

CREATE TABLE IF NOT EXISTS capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT DEFAULT 'draft',
  maturity_level TEXT DEFAULT 'concept',
  owner TEXT,
  active_version INTEGER DEFAULT 1,
  implementation_progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_capabilities (
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  capability_id UUID REFERENCES capabilities(id) ON DELETE CASCADE,
  required BOOLEAN DEFAULT true,
  PRIMARY KEY (agent_id, capability_id)
);

CREATE TABLE IF NOT EXISTS implementation_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  use_case_id UUID REFERENCES use_cases(id) ON DELETE SET NULL,
  capability_id UUID REFERENCES capabilities(id) ON DELETE SET NULL,
  component_type TEXT NOT NULL,
  name TEXT NOT NULL,
  repository TEXT,
  file_path TEXT,
  module_name TEXT,
  api_endpoint TEXT,
  implementation_status TEXT DEFAULT 'not_started',
  test_status TEXT DEFAULT 'none',
  deployed_status TEXT DEFAULT 'none',
  last_verified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS development_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  use_case_id UUID REFERENCES use_cases(id) ON DELETE SET NULL,
  capability_id UUID REFERENCES capabilities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  technical_context TEXT,
  source TEXT DEFAULT 'manual',
  task_type TEXT DEFAULT 'implementation',
  priority TEXT DEFAULT 'normal',
  risk_level TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'planned',
  assigned_worker TEXT,
  assigned_model TEXT,
  reviewer TEXT,
  acceptance_criteria TEXT,
  definition_of_done TEXT,
  estimated_complexity INTEGER DEFAULT 3,
  created_from_spec_diff BOOLEAN DEFAULT false,
  blocked_reason TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexy
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_category ON agents(category);
CREATE INDEX IF NOT EXISTS idx_use_cases_agent ON use_cases(agent_id);
CREATE INDEX IF NOT EXISTS idx_components_agent ON implementation_components(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON development_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON development_tasks(agent_id);
