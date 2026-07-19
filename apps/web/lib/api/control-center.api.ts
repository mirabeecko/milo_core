import { apiClient } from "./client";

const BASE = "/executive/control";

// ─── Agents ───────────────────────────────────────────────────

export async function getControlAgents(filters?: { status?: string; category?: string }) {
  const q = new URLSearchParams();
  if (filters?.status) q.set("status", filters.status);
  if (filters?.category) q.set("category", filters.category);
  const qs = q.toString();
  const res = await apiClient<{ count: number; agents: any[] }>(`${BASE}/agents${qs ? `?${qs}` : ""}`);
  return res.agents;
}

export async function getControlAgent(id: string) {
  return apiClient<any>(`${BASE}/agents/${id}`);
}

export async function createControlAgent(input: any) {
  return apiClient<any>(`${BASE}/agents`, { method: "POST", body: JSON.stringify(input) });
}

export async function updateControlAgent(id: string, input: any) {
  return apiClient<any>(`${BASE}/agents/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function getAgentVersions(id: string) {
  const res = await apiClient<{ count: number; versions: any[] }>(`${BASE}/agents/${id}/versions`);
  return res.versions;
}

export async function createAgentVersion(id: string, input: any) {
  return apiClient<any>(`${BASE}/agents/${id}/versions`, { method: "POST", body: JSON.stringify(input) });
}

export async function getAgentProgress(id: string) {
  return apiClient<any>(`${BASE}/agents/${id}/progress`);
}

export async function getAgentDiff(id: string, from: number, to: number) {
  return apiClient<any>(`${BASE}/agents/${id}/diff?from=${from}&to=${to}`, { method: "POST" });
}

export async function getImpactAnalysis(id: string) {
  return apiClient<any>(`${BASE}/agents/${id}/impact-analysis`, { method: "POST" });
}

export async function getDeveloperPrompt(id: string) {
  return apiClient<any>(`${BASE}/agents/${id}/developer-prompt`, { method: "POST" });
}

// ─── Use Cases ────────────────────────────────────────────────

export async function getControlUseCases(filters?: { agent_id?: string }) {
  const q = new URLSearchParams();
  if (filters?.agent_id) q.set("agent_id", filters.agent_id);
  const qs = q.toString();
  const res = await apiClient<{ count: number; useCases: any[] }>(`${BASE}/use-cases${qs ? `?${qs}` : ""}`);
  return res.useCases;
}

export async function getControlUseCase(id: string) {
  return apiClient<any>(`${BASE}/use-cases/${id}`);
}

export async function createControlUseCase(input: any) {
  return apiClient<any>(`${BASE}/use-cases`, { method: "POST", body: JSON.stringify(input) });
}

export async function updateControlUseCase(id: string, input: any) {
  return apiClient<any>(`${BASE}/use-cases/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

// ─── Capabilities ─────────────────────────────────────────────

export async function getControlCapabilities() {
  const res = await apiClient<{ count: number; capabilities: any[] }>(`${BASE}/capabilities`);
  return res.capabilities;
}

export async function createControlCapability(input: any) {
  return apiClient<any>(`${BASE}/capabilities`, { method: "POST", body: JSON.stringify(input) });
}

// ─── Components ───────────────────────────────────────────────

export async function getControlComponents(filters?: { agent_id?: string }) {
  const q = new URLSearchParams();
  if (filters?.agent_id) q.set("agent_id", filters.agent_id);
  const qs = q.toString();
  const res = await apiClient<{ count: number; components: any[] }>(`${BASE}/components${qs ? `?${qs}` : ""}`);
  return res.components;
}

// ─── Tasks ────────────────────────────────────────────────────

export async function getControlTasks(filters?: { agent_id?: string; status?: string }) {
  const q = new URLSearchParams();
  if (filters?.agent_id) q.set("agent_id", filters.agent_id);
  if (filters?.status) q.set("status", filters.status);
  const qs = q.toString();
  const res = await apiClient<{ count: number; tasks: any[] }>(`${BASE}/tasks${qs ? `?${qs}` : ""}`);
  return res.tasks;
}

export async function createControlTask(input: any) {
  return apiClient<any>(`${BASE}/tasks`, { method: "POST", body: JSON.stringify(input) });
}

export async function updateControlTask(id: string, input: any) {
  return apiClient<any>(`${BASE}/tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

// ─── Missions ─────────────────────────────────────────────────

export async function getControlMissions(filters?: { agent_id?: string; status?: string }) {
  const q = new URLSearchParams();
  if (filters?.agent_id) q.set("agent_id", filters.agent_id);
  if (filters?.status) q.set("status", filters.status);
  const qs = q.toString();
  const res = await apiClient<{ count: number; missions: any[] }>(`${BASE}/missions${qs ? `?${qs}` : ""}`);
  return res.missions;
}

export async function createControlMission(input: any) {
  return apiClient<any>(`${BASE}/missions`, { method: "POST", body: JSON.stringify(input) });
}

export async function startMission(id: string) {
  return apiClient<any>(`${BASE}/missions/${id}/start`, { method: "POST" });
}

// ─── Audit ────────────────────────────────────────────────────

export async function startAudit(input: { agent_id: string; scope?: string }) {
  return apiClient<any>(`${BASE}/audit/start`, { method: "POST", body: JSON.stringify(input) });
}

export async function getAudits(agentId?: string) {
  const q = agentId ? `?agent_id=${agentId}` : "";
  const res = await apiClient<{ count: number; audits: any[] }>(`${BASE}/audits${q}`);
  return res.audits;
}

// ─── Deployments ──────────────────────────────────────────────

export async function getControlDeployments(agentId?: string) {
  const q = agentId ? `?agent_id=${agentId}` : "";
  const res = await apiClient<{ count: number; deployments: any[] }>(`${BASE}/deployments${q}`);
  return res.deployments;
}

export async function createDeployment(input: { agent_id: string; environment: string; version_label?: string }) {
  return apiClient<any>(`${BASE}/deployments`, { method: "POST", body: JSON.stringify(input) });
}

// ─── Live Agent Runtime ────────────────────────────────────────

export async function getLiveAgents() {
  const res = await apiClient<{ count: number; agents: any[] }>("/executive/agents/live");
  return res.agents;
}

export async function startLiveAgent(id: string | number) {
  return apiClient<any>(`/executive/agents/${id}/start`, { method: "POST" });
}

export async function stopLiveAgent(id: string | number) {
  return apiClient<any>(`/executive/agents/${id}/stop`, { method: "POST" });
}

// ─── Approvals (dashboard) ─────────────────────────────────────

export async function getExecutiveApprovals(status?: string) {
  const qs = status ? `?status=${status}` : "";
  const res = await apiClient<{ count: number; approvals: any[] }>(`/executive/approvals${qs}`);
  return res.approvals;
}

// ─── Events (activity feed) ────────────────────────────────────

export async function getExecutiveEvents(limit = 50) {
  const res = await apiClient<{ count: number; events: any[] }>(`/executive/events?limit=${limit}`);
  return res.events;
}

// ─── Agent Runtime ─────────────────────────────────────────────

export async function startAgent(id: string) {
  return apiClient<any>(`/control-center/agents/${encodeURIComponent(id)}/start`, { method: "POST" });
}

export async function stopAgent(id: string) {
  return apiClient<any>(`/control-center/agents/${encodeURIComponent(id)}/stop`, { method: "POST" });
}

export async function pauseAgent(id: string) {
  return apiClient<any>(`/control-center/agents/${encodeURIComponent(id)}/pause`, { method: "POST" });
}

export async function resumeAgent(id: string) {
  return apiClient<any>(`/control-center/agents/${encodeURIComponent(id)}/resume`, { method: "POST" });
}

export async function restartAgent(id: string) {
  return apiClient<any>(`/control-center/agents/${encodeURIComponent(id)}/restart`, { method: "POST" });
}

export async function lockAgent(id: string) {
  return apiClient<any>(`/control-center/agents/${encodeURIComponent(id)}/lock`, { method: "POST" });
}

export async function unlockAgent(id: string) {
  return apiClient<any>(`/control-center/agents/${encodeURIComponent(id)}/unlock`, { method: "POST" });
}

export async function bulkStartAgents(ids: string[]) {
  return apiClient<any>(`/control-center/agents/bulk/start`, { method: "POST", body: JSON.stringify({ ids }) });
}

export async function bulkStopAgents(ids: string[]) {
  return apiClient<any>(`/control-center/agents/bulk/stop`, { method: "POST", body: JSON.stringify({ ids }) });
}

export async function createAgentTask(agentId: string, task: { title: string; description?: string; priority?: string }) {
  return apiClient<any>(`/control-center/agents/${encodeURIComponent(agentId)}/tasks`, {
    method: "POST",
    body: JSON.stringify(task),
  });
}

export async function getAgentTasks(agentId: string) {
  const res = await apiClient<{ count: number; tasks: any[] }>(`/control-center/agents/${encodeURIComponent(agentId)}/tasks`);
  return res.tasks;
}

export async function getAgentLogs(agentId: string, limit?: number) {
  const q = limit ? `?limit=${limit}` : "";
  const res = await apiClient<{ count: number; logs: any[] }>(`/control-center/agents/${encodeURIComponent(agentId)}/logs${q}`);
  return res.logs;
}
