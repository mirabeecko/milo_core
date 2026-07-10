export interface ExecutiveOverview {
  generatedAt: string;
  bootstrap: {
    status: string;
    message: string;
  };
  backlogStats: {
    total: number;
    done: number;
    waiting: number;
    byPriority: Record<string, { total: number; done: number }>;
  };
  departments: Array<{
    id: string;
    name: string;
    shortName: string;
    status: string;
    bootstrapWave: number;
  }>;
  missionStats: {
    total: number;
    completed: number;
    failed: number;
    active: number;
  };
  decisionCount: number;
  activeRisks: number;
  activeBlockers: number;
  pendingApprovals: number;
  recentActivityCount: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  priority: "critical" | "high" | "normal" | "low";
  ownerId: string;
  ownerName: string;
  department: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: {
    output?: string;
    error?: string;
    citations?: string[];
    metadata?: Record<string, unknown>;
  };
}

export interface Department {
  id: string;
  name: string;
  shortName: string;
  domain: string;
  missionStatement: string;
  bootstrapWave: number;
  kpis: Array<{ metric: string; target: string }>;
  responsibilities: string[];
  boundaries: string[];
  requiredSpecialists: string[];
  ownedDocumentation: string[];
  status: string;
}

export interface Artifact {
  id: string;
  title: string;
  type: "document" | "adr" | "model" | "plan" | "report";
  department: string;
  status: "done" | "in_progress" | "planned";
  path: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Decision {
  id: string;
  title: string;
  status: string;
  author: string;
  date: string;
  reviewDate: string;
  context: string;
  decision: string;
  consequences: string;
  path: string;
}

export interface Risk {
  id: string;
  description: string;
  probability: "Nízká" | "Střední" | "Vysoká";
  impact: "Nízký" | "Střední" | "Vysoký" | "Kritický";
  mitigation: string;
  source: string;
}

export interface Blocker {
  id: string;
  title: string;
  description: string;
  department: string;
  severity: "blocking" | "delaying" | "warning";
  status: "active" | "resolved";
  reportedAt: string;
  source: string;
}

export interface Approval {
  id: string;
  title: string;
  description: string;
  department: string;
  type: "adr" | "rfc" | "constitutional" | "budget" | "escalation" | "other";
  urgency: "low" | "normal" | "high" | "critical";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  context: string;
}

export interface ActivityItem {
  id: string;
  type: "git" | "document" | "decision" | "mission" | "agent" | "system";
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  department?: string;
}

export interface DataSourceInfo {
  source: "file" | "git" | "supabase" | "unavailable";
  path?: string;
  freshness: string;
  note?: string;
}
