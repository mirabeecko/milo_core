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

// ─── Diff Engine ──────────────────────────────────────────────────────

type DiffChange = {
  section: string;
  change_type: "added" | "removed" | "modified";
  path: string;
  old_value: any;
  new_value: any;
};

type StructuredDiff = {
  from_version: number;
  to_version: number;
  changed_sections: DiffChange[];
  unchanged_sections: string[];
  added_sections: string[];
  removed_sections: string[];
};

function deepDiff(
  a: any, b: any, prefix = "", into: DiffChange[] = []
): DiffChange[] {
  if (a === b) return into;
  if (a == null && b != null) {
    into.push({ section: prefix, change_type: "added", path: prefix, old_value: null, new_value: b });
    return into;
  }
  if (a != null && b == null) {
    into.push({ section: prefix, change_type: "removed", path: prefix, old_value: a, new_value: null });
    return into;
  }
  const ta = typeof a, tb = typeof b;
  if (ta !== tb) {
    into.push({ section: prefix, change_type: "modified", path: prefix, old_value: a, new_value: b });
    return into;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      deepDiff(a[i], b[i], `${prefix}[${i}]`, into);
    }
    return into;
  }
  if (ta === "object") {
    const allKeys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
    for (const key of allKeys) {
      deepDiff(a?.[key], b?.[key], prefix ? `${prefix}.${key}` : key, into);
    }
    return into;
  }
  into.push({ section: prefix, change_type: "modified", path: prefix, old_value: a, new_value: b });
  return into;
}

function collectSections(obj: any, prefix = ""): string[] {
  if (obj == null || typeof obj !== "object") return [prefix];
  return Object.keys(obj).flatMap((k) =>
    collectSections(obj[k], prefix ? `${prefix}.${k}` : k)
  );
}

export async function computeDiff(agentId: string, fromVersion: number, toVersion: number): Promise<StructuredDiff> {
  const versions = load<any>(VERSIONS_FILE)
    .filter((v: any) => v.agent_id === agentId)
    .sort((a: any, b: any) => a.version_number - b.version_number);

  const from = versions.find((v: any) => v.version_number === fromVersion);
  const to = versions.find((v: any) => v.version_number === toVersion);
  if (!from || !to) throw new Error("Version not found");

  const fromSpec = from.specification || {};
  const toSpec = to.specification || {};

  const changes: DiffChange[] = [];
  deepDiff(fromSpec, toSpec, "", changes);

  const changedPaths = new Set(changes.map((c) => c.path));
  const fromSections = collectSections(fromSpec);
  const toSections = collectSections(toSpec);

  const topSections = new Set([
    ...Object.keys(fromSpec),
    ...Object.keys(toSpec),
  ]);

  const unchanged: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];

  for (const sec of topSections) {
    const inFrom = sec in fromSpec;
    const inTo = sec in toSpec;
    if (inFrom && inTo && ![...changedPaths].some((p) => p === sec || p.startsWith(`${sec}.`))) {
      unchanged.push(sec);
    } else if (!inFrom && inTo) {
      added.push(sec);
    } else if (inFrom && !inTo) {
      removed.push(sec);
    }
  }

  return {
    from_version: fromVersion,
    to_version: toVersion,
    changed_sections: changes,
    unchanged_sections: unchanged,
    added_sections: added,
    removed_sections: removed,
  };
}

// ─── Impact Analysis ──────────────────────────────────────────────────

export async function computeImpact(agentId: string) {
  const agent = await getAgentById(agentId);
  const versions = await getAgentVersions(agentId);
  const useCases = await getUseCases({ agent_id: agentId });
  const components = await getComponents({ agent_id: agentId });
  const tasks = await getTasks({ agent_id: agentId });

  const latestVersion = versions[0]; // sorted desc
  const prevVersion = versions[1];

  let specDiff: StructuredDiff | null = null;
  if (latestVersion && prevVersion) {
    specDiff = await computeDiff(agentId, prevVersion.version_number, latestVersion.version_number);
  }

  const affectedComponents = components.filter((c: any) => {
    if (!specDiff) return false;
    return specDiff.changed_sections.some((ch) =>
      c.module_name && ch.path.includes(c.module_name)
    );
  });

  const newTasksRequired: string[] = [];
  if (specDiff) {
    for (const ch of specDiff.changed_sections) {
      if (ch.change_type === "added") {
        newTasksRequired.push(`Implementace: ${ch.path} — nová sekce`);
      } else if (ch.change_type === "modified") {
        newTasksRequired.push(`Aktualizace: ${ch.path} — změněno`);
      }
    }
    for (const sec of specDiff.added_sections) {
      newTasksRequired.push(`Nový modul: ${sec} — potřeba plná implementace`);
    }
  }

  const risks: string[] = [];
  const unimplementedUseCases = useCases.filter((uc: any) => uc.implementation_status !== "completed");
  if (unimplementedUseCases.length > 0) {
    risks.push(`${unimplementedUseCases.length} use case(s) nejsou dokončené`);
  }
  const unimplementedComponents = components.filter(
    (c: any) => c.implementation_status !== "implemented"
  );
  if (unimplementedComponents.length > 0) {
    risks.push(`${unimplementedComponents.length} komponenta(y) není implementována`);
  }
  if (specDiff && specDiff.changed_sections.length > 10) {
    risks.push("Vysoký počet změn (>10) — riziko regresí");
  }

  return {
    agent_id: agentId,
    agent_name: agent.name,
    spec_diff: specDiff,
    affected_components: affectedComponents,
    new_tasks_required: newTasksRequired,
    risks,
    summary: {
      total_use_cases: useCases.length,
      implemented_use_cases: useCases.filter((uc: any) => uc.implementation_status === "completed").length,
      total_components: components.length,
      implemented_components: unimplementedComponents.length === 0 ? components.length : components.filter((c: any) => c.implementation_status === "implemented").length,
      total_tasks: tasks.length,
      completed_tasks: tasks.filter((t: any) => t.status === "completed").length,
      change_count: specDiff?.changed_sections.length ?? 0,
      risk_level: risks.length > 2 ? "high" : risks.length > 0 ? "medium" : "low",
    },
  };
}

// ─── Missions ─────────────────────────────────────────────────────────

const MISSIONS_FILE = "missions.json";

export async function getMissions(filters?: { agent_id?: string; status?: string }) {
  let data = load<any>(MISSIONS_FILE);
  if (filters?.agent_id) data = data.filter((m: any) => m.agent_id === filters.agent_id);
  if (filters?.status) data = data.filter((m: any) => m.status === filters.status);
  return data.sort((a: any, b: any) => b.created_at.localeCompare(a.created_at));
}

export async function createMission(input: any) {
  const list = load<any>(MISSIONS_FILE);
  const mission = {
    id: `mission-${Date.now()}`,
    ...input,
    status: "planned",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  list.push(mission);
  save(MISSIONS_FILE, list);
  return mission;
}

export async function startMission(id: string) {
  const list = load<any>(MISSIONS_FILE);
  const idx = list.findIndex((m: any) => m.id === id);
  if (idx === -1) throw new Error("Not found");
  list[idx] = { ...list[idx], status: "in_progress", started_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  save(MISSIONS_FILE, list);
  return list[idx];
}

export async function updateMission(id: string, input: any) {
  const list = load<any>(MISSIONS_FILE);
  const idx = list.findIndex((m: any) => m.id === id);
  if (idx === -1) throw new Error("Not found");
  list[idx] = { ...list[idx], ...input, updated_at: new Date().toISOString() };
  save(MISSIONS_FILE, list);
  return list[idx];
}

// ─── Developer Prompt ─────────────────────────────────────────────────

export async function generateDeveloperPrompt(agentId: string) {
  const agent = await getAgentById(agentId);
  const versions = await getAgentVersions(agentId);
  const useCases = await getUseCases({ agent_id: agentId });
  const tasks = await getTasks({ agent_id: agentId });
  const components = await getComponents({ agent_id: agentId });

  const latestVersion = versions[0];
  const prevVersion = versions[1];
  let specDiff: StructuredDiff | null = null;
  if (latestVersion && prevVersion) {
    specDiff = await computeDiff(agentId, prevVersion.version_number, latestVersion.version_number);
  }

  const prompt = [
    `# Developer Prompt — ${agent.name}`,
    ``,
    `## Identita agenta`,
    `- Jméno: ${agent.name}`,
    `- Slug: ${agent.slug}`,
    `- Účel: ${agent.purpose || agent.description}`,
    `- Kategorie: ${agent.category}`,
    `- Vlastník: ${agent.owner}`,
    ``,
    `## Specifikace`,
    latestVersion
      ? `\`\`\`json\n${JSON.stringify(latestVersion.specification, null, 2)}\n\`\`\``
      : "(žádná specifikace)",
    ``,
    ...(specDiff?.changed_sections.length
      ? [
          `## Diff oproti předchozí verzi (v${specDiff.from_version} → v${specDiff.to_version})`,
          `Změněných sekcí: ${specDiff.changed_sections.length}`,
          ...specDiff.changed_sections.map(
            (ch) => `- [${ch.change_type}] ${ch.path}`
          ),
          "",
        ]
      : []),
    `## Use Cases (${useCases.length})`,
    ...useCases.map((uc: any) => `- ${uc.name} [${uc.implementation_status}] — ${uc.description || ""}`),
    ``,
    `## Komponenty k implementaci (${components.length})`,
    ...components.map((c: any) => `- ${c.component_type}: ${c.name} [${c.implementation_status}]`),
    ``,
    `## Úkoly (${tasks.filter((t: any) => t.status !== "completed").length} otevřených)`,
    ...tasks
      .filter((t: any) => t.status !== "completed")
      .map((t: any) => `- [${t.status}] ${t.title}`),
    ``,
    `## Instrukce`,
    `1. Projdi specifikaci a pochop účel agenta`,
    `2. Implementuj chybějící komponenty`,
    `3. Dodržuj standardy z ADR a CONSTITUTION.md`,
    `4. Piš testy na každý use case`,
    `5. Po dokončení aktualizuj status na "implemented"`,
    ``,
  ].join("\n");

  return {
    agent_id: agentId,
    agent_name: agent.name,
    version: latestVersion?.version_number ?? null,
    prompt,
    metadata: {
      use_case_count: useCases.length,
      component_count: components.length,
      open_task_count: tasks.filter((t: any) => t.status !== "completed").length,
      spec_version: latestVersion?.version_number ?? null,
    },
  };
}

// ─── Audit ────────────────────────────────────────────────────────────

const AUDITS_FILE = "audits.json";

export async function startAudit(input: { agent_id: string; scope?: string }) {
  const agent = await getAgentById(input.agent_id);
  const versions = await getAgentVersions(input.agent_id);
  const useCases = await getUseCases({ agent_id: input.agent_id });
  const components = await getComponents({ agent_id: input.agent_id });
  const tasks = await getTasks({ agent_id: input.agent_id });

  const findings: Array<{
    severity: "high" | "medium" | "low" | "info";
    category: string;
    description: string;
    recommendation: string;
  }> = [];

  // Check versions/spec completeness
  const latestVersion = versions[0];
  if (!latestVersion) {
    findings.push({
      severity: "high", category: "specifikace",
      description: "Žádná verze specifikace neexistuje",
      recommendation: "Vytvoř první verzi specifikace agenta",
    });
  } else {
    const spec = latestVersion.specification || {};
    const requiredFields = ["purpose", "communication_style"];
    for (const f of requiredFields) {
      if (!spec[f]) {
        findings.push({
          severity: "medium", category: "specifikace",
          description: `Chybí pole "${f}" ve specifikaci`,
          recommendation: `Doplň pole "${f}" do specifikace`,
        });
      }
    }
  }

  // Check use cases
  if (useCases.length === 0) {
    findings.push({
      severity: "high", category: "use_cases",
      description: "Žádné use cases nejsou definované",
      recommendation: "Definuj alespoň 3 use cases pro agenta",
    });
  }
  const notStartedUC = useCases.filter((uc: any) => uc.implementation_status === "not_started");
  if (notStartedUC.length > 0) {
    findings.push({
      severity: "medium", category: "use_cases",
      description: `${notStartedUC.length} use case(s) nejsou zahájené`,
      recommendation: "Vytvoř úkoly pro nezahájené use cases",
    });
  }

  // Check components
  if (components.length === 0) {
    findings.push({
      severity: "medium", category: "komponenty",
      description: "Žádné implementační komponenty nejsou registrované",
      recommendation: "Zaregistruj existující soubory jako komponenty",
    });
  }
  const notImpl = components.filter((c: any) => c.implementation_status !== "implemented");
  if (notImpl.length > 0) {
    findings.push({
      severity: "medium", category: "komponenty",
      description: `${notImpl.length} komponent(y) nejsou implementované`,
      recommendation: `Implementuj: ${notImpl.map((c: any) => c.name).join(", ")}`,
    });
  }

  // Check tasks
  const blocked = tasks.filter((t: any) => t.status === "blocked");
  if (blocked.length > 0) {
    findings.push({
      severity: "high", category: "úkoly",
      description: `${blocked.length} úkol(y) jsou blokované`,
      recommendation: "Odstraň blokátory: " + blocked.map((t: any) => t.title).join(", "),
    });
  }

  // Check diff if multiple versions
  if (versions.length >= 2) {
    const diff = await computeDiff(input.agent_id, versions[1].version_number, versions[0].version_number);
    if (diff.changed_sections.length === 0) {
      findings.push({
        severity: "info", category: "verzování",
        description: "Poslední verze nemá žádné změny oproti předchozí",
        recommendation: "Zvaž, zda je nová verze potřebná",
      });
    }
  }

  const passedCount = findings.length;
  const verdict: "pass" | "conditional_pass" | "fail" =
    findings.filter((f) => f.severity === "high").length > 0 ? "fail" :
    findings.filter((f) => f.severity === "medium").length > 0 ? "conditional_pass" :
    "pass";

  const audit = {
    id: `audit-${Date.now()}`,
    agent_id: input.agent_id,
    agent_name: agent.name,
    scope: input.scope || "full",
    findings,
    verdict,
    verdict_reason: verdict === "pass"
      ? "Všechny kontroly prošly"
      : verdict === "conditional_pass"
      ? `${findings.filter((f) => f.severity === "medium").length} doporučení k řešení`
      : `${findings.filter((f) => f.severity === "high").length} kritických problémů`,
    created_at: new Date().toISOString(),
  };

  const audits = load<any>(AUDITS_FILE);
  audits.push(audit);
  save(AUDITS_FILE, audits);
  return audit;
}

export async function getAudits(agentId?: string) {
  let data = load<any>(AUDITS_FILE);
  if (agentId) data = data.filter((a: any) => a.agent_id === agentId);
  return data.sort((a: any, b: any) => b.created_at.localeCompare(a.created_at));
}

// ─── Deployment ───────────────────────────────────────────────────────

const DEPLOYMENTS_FILE = "deployments.json";

export async function getDeployments(agentId?: string) {
  let data = load<any>(DEPLOYMENTS_FILE);
  if (agentId) data = data.filter((d: any) => d.agent_id === agentId);
  return data.sort((a: any, b: any) => b.created_at.localeCompare(a.created_at));
}

export async function createDeployment(input: { agent_id: string; environment: string; version_label?: string }) {
  const agent = await getAgentById(input.agent_id);
  const versions = await getAgentVersions(input.agent_id);
  const latestVersion = versions[0];

  const deployment = {
    id: `deploy-${Date.now()}`,
    agent_id: input.agent_id,
    agent_name: agent.name,
    environment: input.environment,
    version_label: input.version_label || `v${latestVersion?.version_number ?? 0}`,
    version_id: latestVersion?.id ?? null,
    status: "deploying",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const list = load<any>(DEPLOYMENTS_FILE);
  list.push(deployment);
  save(DEPLOYMENTS_FILE, list);

  // Auto-complete deployment after "deploy"
  setTimeout(async () => {
    const current = load<any>(DEPLOYMENTS_FILE);
    const idx = current.findIndex((d: any) => d.id === deployment.id);
    if (idx !== -1) {
      current[idx] = {
        ...current[idx],
        status: "deployed",
        deployed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      save(DEPLOYMENTS_FILE, current);
      // Update agent deployed_version_id
      if (latestVersion) {
        await updateAgent(input.agent_id, {
          deployed_version_id: latestVersion.id,
          runtime_status: "online",
        });
      }
    }
  }, 1000);

  return deployment;
}

// ─── Progress ─────────────────────────────────────────────────────────

export async function computeProgress(agentId: string) {
  const useCases = await getUseCases({ agent_id: agentId });
  const components = await getComponents({ agent_id: agentId });
  const tasks = await getTasks({ agent_id: agentId });

  const ucTotal = useCases.length;
  const ucDone = useCases.filter((uc: any) => uc.implementation_status === "completed").length;

  const compTotal = components.length;
  const compDone = components.filter((c: any) => c.implementation_status === "implemented").length;

  const taskTotal = tasks.length;
  const taskDone = tasks.filter((t: any) => t.status === "completed" || t.status === "verified").length;

  const ucPct = ucTotal > 0 ? Math.round((ucDone / ucTotal) * 100) : 0;
  const compPct = compTotal > 0 ? Math.round((compDone / compTotal) * 100) : 0;
  const taskPct = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0;

  // Weighted: UC 40%, components 40%, tasks 20%
  const progress = Math.round(ucPct * 0.4 + compPct * 0.4 + taskPct * 0.2);

  const missing: string[] = [];
  for (const uc of useCases.filter((u: any) => u.implementation_status !== "completed")) {
    missing.push(`Use Case: ${uc.name} — ${uc.implementation_status}`);
  }
  for (const c of components.filter((c: any) => c.implementation_status !== "implemented")) {
    missing.push(`Komponenta: ${c.component_type} ${c.name} — ${c.implementation_status}`);
  }
  for (const t of tasks.filter((t: any) => t.status !== "completed" && t.status !== "verified")) {
    missing.push(`Úkol: ${t.title} — ${t.status}`);
  }

  // Auto-update agent progress
  await updateAgent(agentId, { implementation_progress: progress });

  return {
    agent_id: agentId,
    progress,
    breakdown: {
      use_cases: { total: ucTotal, done: ucDone, percent: ucPct },
      components: { total: compTotal, done: compDone, percent: compPct },
      tasks: { total: taskTotal, done: taskDone, percent: taskPct },
    },
    missing: missing.slice(0, 10), // top 10
    missing_count: missing.length,
  };
}
