import type {
  ExecutiveOverview,
  Mission,
  Department,
  Artifact,
  Decision,
  Risk,
  Blocker,
  Approval,
  ActivityItem,
} from "../types";
import type { ExecutiveDataProvider } from "../provider-interface";

interface ApiStatusResponse {
  organization: {
    totalDepartments: number;
    activeDepartments: number;
    totalAgents: number;
    activeMissions: number;
    pendingApprovals: number;
  };
  departments: Array<{
    id: string;
    name: string;
    mission: string;
    configuredStatus: string;
    leadAgent: string | null;
  }>;
  agents: Array<{
    id: string;
    name: string;
    status: string;
    state: {
      status: string;
      taskProgress: number;
      explanation: Record<string, unknown> | null;
      pendingTasks: number;
      runningTasks: number;
      completedTasks: number;
      failedTasks: number;
      runningTimeMs: number;
      lastActivityAt: string | null;
    };
  }>;
}

interface ApiEvent {
  event_id: string;
  event_type: string;
  timestamp: string;
  department?: string;
  agent_id?: string;
  mission_id?: string;
  summary: string;
  payload?: Record<string, unknown>;
}

interface ApiEventsResponse {
  count: number;
  events: ApiEvent[];
}

interface ApiApproval {
  id: string;
  mission_id: string;
  department: string;
  agent_id: string;
  what: string;
  why: string;
  risk_level: string;
  status: string;
  requested_by: string;
  requested_at: string;
  decided_by?: string;
  decided_at?: string;
  reason?: string;
  timeout_hours: number;
}

interface ApiApprovalsResponse {
  count: number;
  approvals: ApiApproval[];
}

interface ApiBacklogResponse {
  departments: Array<{
    id: string;
    name: string;
    activeMissions: Array<{ id: string; name: string; status: string; assigned: string }>;
    availableTools: string[];
  }>;
  activeMissions: Array<{ id: string; title: string; status: string; priority: string }>;
  totalActive: number;
}

export class ApiExecutiveDataProvider implements ExecutiveDataProvider {
  private baseUrl: string;
  private fetch: typeof globalThis.fetch;

  constructor(baseUrl?: string, fetchImpl?: typeof globalThis.fetch) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    } else if (typeof window === "undefined") {
      this.baseUrl = "http://127.0.0.1:4000";
    } else {
      this.baseUrl = "/api";
    }
    this.fetch = fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await this.fetch(url, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      throw new Error(`API ${res.status}: ${res.statusText} at ${path}`);
    }
    return res.json() as Promise<T>;
  }

  async getOverview(): Promise<ExecutiveOverview> {
    try {
      const [status, backlog] = await Promise.all([
        this.fetchJson<ApiStatusResponse>("/executive/status"),
        this.fetchJson<ApiBacklogResponse>("/executive/backlog"),
      ]);

      const allBacklogItems = backlog.departments.flatMap((d) =>
        d.activeMissions.map((m) => ({ ...m, department: d.id }))
      );

      const byPriority: Record<string, { total: number; done: number }> = {};
      for (const item of allBacklogItems) {
        const p = item.status === "completed" ? "done" : "active";
        const key = "API";
        if (!byPriority[key]) byPriority[key] = { total: 0, done: 0 };
        byPriority[key].total++;
        if (p === "done") byPriority[key].done++;
      }

      const deptStatuses = status.departments.map((d) => ({
        id: d.id.toLowerCase(),
        name: d.name,
        shortName: d.id,
        status: d.configuredStatus,
        bootstrapWave: d.configuredStatus === "active" ? 0 : 1,
      }));

      return {
        generatedAt: new Date().toISOString(),
        bootstrap: {
          status: `${status.organization.activeDepartments}/${status.organization.totalDepartments} departments active`,
          message: `${status.organization.totalAgents} agents, ${status.organization.activeMissions} active missions, ${status.organization.pendingApprovals} pending approvals`,
        },
        backlogStats: {
          total: allBacklogItems.length,
          done: 0,
          waiting: allBacklogItems.length,
          byPriority,
        },
        departments: deptStatuses,
        missionStats: {
          total: status.organization.activeMissions,
          completed: 0,
          failed: 0,
          active: status.organization.activeMissions,
        },
        decisionCount: 6,
        activeRisks: 0,
        activeBlockers: 0,
        pendingApprovals: status.organization.pendingApprovals,
        recentActivityCount: 0,
      };
    } catch {
      return {
        generatedAt: new Date().toISOString(),
        bootstrap: { status: "API unavailable", message: "Could not reach the Executive API. Is the API server running on port 4000?" },
        backlogStats: { total: 0, done: 0, waiting: 0, byPriority: {} },
        departments: [],
        missionStats: { total: 0, completed: 0, failed: 0, active: 0 },
        decisionCount: 0,
        activeRisks: 0,
        activeBlockers: 0,
        pendingApprovals: 0,
        recentActivityCount: 0,
      };
    }
  }

  async getMissions(): Promise<Mission[]> {
    try {
      const raw = await this.fetchJson<unknown>("/executive/missions");
      return Array.isArray(raw) ? (raw as Mission[]) : [];
    } catch {
      return [];
    }
  }

  async getDepartments(): Promise<Department[]> {
    try {
      const raw = await this.fetchJson<Array<Record<string, unknown>>>("/executive/departments");
      return Array.isArray(raw) ? raw.map((d) => ({
        id: (d.id as string) ?? "",
        name: (d.name as string) ?? "",
        shortName: ((d.shortName ?? d.id) as string),
        domain: (d.mission as string) ?? "",
        missionStatement: (d.mission as string) ?? "",
        bootstrapWave: 0,
        kpis: [] as Department["kpis"],
        responsibilities: [] as string[],
        boundaries: [] as string[],
        requiredSpecialists: [] as string[],
        ownedDocumentation: [] as string[],
        status: (d.configuredStatus as string) ?? "defined",
      })) : [];
    } catch {
      return [];
    }
  }

  async getArtifacts(): Promise<Artifact[]> {
    try {
      const raw = await this.fetchJson<{ count: number; artifacts: ApiEvent[] }>("/executive/artifacts");
      return (raw.artifacts ?? []).map((a) => ({
        id: a.event_id,
        title: a.summary ?? "Untitled",
        type: "report" as const,
        department: a.department ?? "Unknown",
        status: "done" as const,
        path: a.payload?.artifact_path as string ?? "",
        description: JSON.stringify(a.payload ?? {}),
        createdAt: a.timestamp,
      }));
    } catch {
      return [];
    }
  }

  async getDecisions(): Promise<Decision[]> {
    return [];
  }

  async getRisks(): Promise<Risk[]> {
    try {
      const raw = await this.fetchJson<{ count: number; risks: ApiEvent[] }>("/executive/risks");
      return (raw.risks ?? []).map((r, i) => ({
        id: r.event_id ?? `api-risk-${i}`,
        description: r.summary ?? "Unknown risk",
        probability: "Střední" as const,
        impact: "Střední" as const,
        mitigation: "Pending mitigation plan",
        source: "executive-events.jsonl",
      }));
    } catch {
      return [];
    }
  }

  async getBlockers(): Promise<Blocker[]> {
    return [];
  }

  async getApprovals(): Promise<Approval[]> {
    try {
      const raw = await this.fetchJson<ApiApprovalsResponse>("/executive/approvals");
      return (raw.approvals ?? []).map((a) => ({
        id: a.id,
        title: a.what,
        description: a.why,
        department: a.department,
        type: "escalation" as const,
        urgency: a.risk_level === "critical" ? "critical" as const : a.risk_level === "high" ? "high" as const : "normal" as const,
        status: (a.status as Approval["status"]) ?? "pending",
        createdAt: a.requested_at,
        context: `Requested by ${a.requested_by} | Mission ${a.mission_id}`,
      }));
    } catch {
      return [];
    }
  }

  async getActivity(): Promise<ActivityItem[]> {
    try {
      const raw = await this.fetchJson<ApiEventsResponse>("/executive/events?limit=30");
      return (raw.events ?? []).map((e) => {
        const typeMap: Record<string, ActivityItem["type"]> = {
          mission_created: "mission",
          mission_completed: "mission",
          mission_progress: "mission",
          mission_blocked: "mission",
          agent_created: "agent",
          agent_started: "agent",
          agent_failed: "agent",
          artifact_created: "document",
          decision_proposed: "decision",
          decision_approved: "decision",
          risk_raised: "system",
          approval_requested: "system",
          approval_granted: "system",
        };

        return {
          id: e.event_id,
          type: typeMap[e.event_type] ?? "system",
          title: e.event_type.replace(/_/g, " "),
          description: e.summary ?? "",
          timestamp: e.timestamp,
          actor: e.agent_id ?? e.department ?? "System",
          department: e.department,
        };
      });
    } catch {
      return [];
    }
  }
}

export const createApiExecutiveDataProvider = (
  baseUrl?: string,
  fetchImpl?: typeof globalThis.fetch,
) => new ApiExecutiveDataProvider(baseUrl, fetchImpl);
