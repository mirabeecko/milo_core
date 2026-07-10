/**
 * Control Center — File-based storage (no DB required).
 * Identické API jako DB verze, data v JSON.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = resolve(__dirname, "../../../data/control");
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

function load<T>(file: string): T[] {
  const path = resolve(DATA_DIR, file);
  if (!existsSync(path)) return [];
  try { return JSON.parse(readFileSync(path, "utf-8")); } catch { return []; }
}
function save(file: string, data: unknown) {
  writeFileSync(resolve(DATA_DIR, file), JSON.stringify(data, null, 2));
}

// ─── Agents ──────────────────────────────────────────────────────────

const AGENTS_FILE = "agents.json";
const VERSIONS_FILE = "agent-versions.json";

export async function getAgents(filters?: { status?: string; category?: string }) {
  let data = load<any>(AGENTS_FILE);
  if (filters?.status) data = data.filter((a: any) => a.status === filters.status);
  if (filters?.category) data = data.filter((a: any) => a.category === filters.category);
  return data;
}

export async function getAgentById(id: string) {
  const agents = load<any>(AGENTS_FILE);
  const agent = agents.find((a: any) => a.id === id);
  if (!agent) throw new Error("Not found");
  const useCases = load<any>("use-cases.json").filter((uc: any) => uc.agent_id === id);
  return { ...agent, use_cases: useCases };
}

export async function createAgent(input: any) {
  const agents = load<any>(AGENTS_FILE);
  const agent = {
    id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...input,
    status: "draft",
    lifecycle_status: "specified",
    risk_level: "medium",
    priority: "normal",
    implementation_progress: 0,
    runtime_status: "offline",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  agents.push(agent);
  save(AGENTS_FILE, agents);
  return agent;
}

export async function updateAgent(id: string, input: any) {
  const agents = load<any>(AGENTS_FILE);
  const idx = agents.findIndex((a: any) => a.id === id);
  if (idx === -1) throw new Error("Not found");
  agents[idx] = { ...agents[idx], ...input, updated_at: new Date().toISOString() };
  save(AGENTS_FILE, agents);
  return agents[idx];
}

export async function archiveAgent(id: string) {
  await updateAgent(id, { archived_at: new Date().toISOString(), status: "archived" });
}

// ─── Versions ────────────────────────────────────────────────────────

export async function getAgentVersions(agentId: string) {
  return load<any>(VERSIONS_FILE)
    .filter((v: any) => v.agent_id === agentId)
    .sort((a: any, b: any) => b.version_number - a.version_number);
}

export async function createAgentVersion(input: any) {
  const versions = load<any>(VERSIONS_FILE);
  const existing = versions.filter((v: any) => v.agent_id === input.agent_id);
  const vn = existing.length > 0 ? Math.max(...existing.map((v: any) => v.version_number)) + 1 : 1;
  const version = { id: `ver-${Date.now()}`, ...input, version_number: vn, created_at: new Date().toISOString() };
  versions.push(version);
  save(VERSIONS_FILE, versions);
  return version;
}

// ─── Use Cases ───────────────────────────────────────────────────────

export async function getUseCases(filters?: { agent_id?: string }) {
  let data = load<any>("use-cases.json");
  if (filters?.agent_id) data = data.filter((uc: any) => uc.agent_id === filters.agent_id);
  return data;
}

export async function getUseCaseById(id: string) {
  const uc = load<any>("use-cases.json").find((u: any) => u.id === id);
  if (!uc) throw new Error("Not found");
  return uc;
}

export async function createUseCase(input: any) {
  const list = load<any>("use-cases.json");
  const uc = { id: `uc-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`, ...input, status: "draft", implementation_status: "not_started", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  list.push(uc);
  save("use-cases.json", list);
  return uc;
}

export async function updateUseCase(id: string, input: any) {
  const list = load<any>("use-cases.json");
  const idx = list.findIndex((u: any) => u.id === id);
  if (idx === -1) throw new Error("Not found");
  list[idx] = { ...list[idx], ...input, updated_at: new Date().toISOString() };
  save("use-cases.json", list);
  return list[idx];
}

// ─── Capabilities ────────────────────────────────────────────────────

export async function getCapabilities() { return load<any>("capabilities.json"); }

export async function createCapability(input: any) {
  const list = load<any>("capabilities.json");
  const cap = { id: `cap-${Date.now()}`, ...input, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  list.push(cap);
  save("capabilities.json", list);
  return cap;
}

// ─── Components ──────────────────────────────────────────────────────

export async function getComponents(filters?: { agent_id?: string }) {
  let data = load<any>("components.json");
  if (filters?.agent_id) data = data.filter((c: any) => c.agent_id === filters.agent_id);
  return data;
}

export async function createComponent(input: any) {
  const list = load<any>("components.json");
  const comp = { id: `comp-${Date.now()}`, ...input, created_at: new Date().toISOString() };
  list.push(comp);
  save("components.json", list);
  return comp;
}

// ─── Tasks ───────────────────────────────────────────────────────────

export async function getTasks(filters?: { agent_id?: string; status?: string }) {
  let data = load<any>("tasks.json");
  if (filters?.agent_id) data = data.filter((t: any) => t.agent_id === filters.agent_id);
  if (filters?.status) data = data.filter((t: any) => t.status === filters.status);
  return data.sort((a: any, b: any) => b.created_at.localeCompare(a.created_at));
}

export async function createTask(input: any) {
  const list = load<any>("tasks.json");
  const task = { id: `task-${Date.now()}`, ...input, status: "planned", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  list.push(task);
  save("tasks.json", list);
  return task;
}

export async function updateTask(id: string, input: any) {
  const list = load<any>("tasks.json");
  const idx = list.findIndex((t: any) => t.id === id);
  if (idx === -1) throw new Error("Not found");
  list[idx] = { ...list[idx], ...input, updated_at: new Date().toISOString() };
  save("tasks.json", list);
  return list[idx];
}
