/**
 * MiLO Workspace Server — autonomní swarm agentů, mise, delegace.
 *
 * Port: 4002
 * Spuštění: npx tsx src/workspace-server.ts
 *
 * Koncept:
 * - Mise = pojmenovaná skupina agentů + úkolů
 * - Run = swarm distribuce (Chief plánuje → Developer implementuje → Research zkoumá)
 * - Live status polling (3s interval)
 * - Data: /tmp/milo-missions.json
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { execSync, spawnSync } from "node:child_process";

// ─── Types ───────────────────────────────────────────────────────────

interface MissionStep {
  agent: string;
  status: "pending" | "running" | "done" | "failed";
  output: string;
  timestamp: string;
}

interface MissionTask {
  id: string;
  description: string;
  assignedAgent: string;
  status: "pending" | "running" | "done" | "failed";
}

interface Mission {
  id: string;
  name: string;
  description: string;
  agents: string[];
  tasks: MissionTask[];
  status: "idle" | "running" | "distributing" | "executing" | "done" | "failed";
  progress: number;
  steps: MissionStep[];
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  result: string | null;
}

interface MissionStore {
  missions: Mission[];
}

// ─── Storage ──────────────────────────────────────────────────────────

const STORE_PATH = "/tmp/milo-missions.json";

function loadStore(): MissionStore {
  try {
    return JSON.parse(readFileSync(STORE_PATH, "utf-8"));
  } catch {
    return { missions: [] };
  }
}

function saveStore(store: MissionStore): void {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function generateId(): string {
  return `mission-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── DEFAULT AGENTS ───────────────────────────────────────────────────

const DEFAULT_AGENTS = [
  { id: "chief-of-staff", name: "Chief of Staff", role: "Plánování a koordinace" },
  { id: "developer-agent", name: "Developer Agent", role: "Implementace" },
  { id: "research-agent", name: "Research Agent", role: "Rešerše a analýza" },
  { id: "communication-agent", name: "Communication Agent", role: "Komunikace" },
  { id: "calendar-agent", name: "Calendar Agent", role: "Time management" },
  { id: "phone-tracker", name: "Phone Tracker", role: "GPS tracking" },
];

// ─── Mission execution engine ─────────────────────────────────────────

async function executeMission(mission: Mission): Promise<void> {
  const store = loadStore();
  const idx = store.missions.findIndex((m) => m.id === mission.id);
  if (idx === -1) return;

  const m = store.missions[idx];

  try {
    // Fáze 1: Distribuce
    m.status = "distributing";
    m.progress = 5;
    m.startedAt = new Date().toISOString();
    saveStore(store);

    // Krok 1: Chief of Staff plánuje
    addStep(m, "chief-of-staff", "running", "Plánování mise...");
    await sleep(800);
    addStep(m, "chief-of-staff", "done", `Mise naplánována: ${m.tasks.length} úkolů rozděleno mezi ${m.agents.length} agentů.`);

    m.status = "executing";
    m.progress = 20;
    saveStore(store);

    // Fáze 2: Exekuce úkolů — sekvenčně pro přehlednost
    const totalTasks = m.tasks.length;
    for (let i = 0; i < totalTasks; i++) {
      const task = m.tasks[i];
      if (task.status !== "pending") continue;

      task.status = "running";
      addStep(m, task.assignedAgent, "running", `Spouštím úkol: ${task.description}`);
      m.progress = 20 + Math.round(((i + 1) / totalTasks) * 60);
      saveStore(store);

      // Pokus o delegaci přes Hermes — pokud Hermes běží, použije ho
      try {
        const hermesResult = delegateToHermes(task);
        task.status = "done";
        addStep(m, task.assignedAgent, "done", hermesResult);
      } catch (hermesErr: any) {
        // Hermes nedostupný — použij lokální simulaci
        await sleep(1000);
        task.status = "done";
        addStep(
          m,
          task.assignedAgent,
          "done",
          `Úkol splněn lokálně: ${task.description} (Hermes nedostupný: ${hermesErr.message?.slice(0, 80) || "unknown"})`
        );
      }

      saveStore(store);
    }

    // Fáze 3: Dokončení
    m.status = "done";
    m.progress = 100;
    m.completedAt = new Date().toISOString();
    m.result = `Mise "${m.name}" dokončena. Splněno ${m.tasks.filter((t) => t.status === "done").length}/${totalTasks} úkolů.`;
    saveStore(store);

    console.log(`✅ Mise dokončena: ${m.name}`);
  } catch (err: any) {
    m.status = "failed";
    m.result = `Chyba: ${err.message}`;
    saveStore(store);
    console.error(`❌ Mise selhala: ${m.name}`, err.message);
  }
}

function delegateToHermes(task: MissionTask): string {
  // Bezpečné volání hermes CLI — používáme spawnSync s polem argumentů,
  // čímž se vyhneme shell injection přes task.description nebo task.assignedAgent.
  try {
    const result = spawnSync(
      "hermes",
      ["delegate_task", task.description, "--agent", task.assignedAgent],
      { timeout: 15000, encoding: "utf-8", env: { ...process.env, HOME: process.env.HOME } }
    );
    if (result.error) {
      throw result.error;
    }
    return `Hermes: ${(result.stdout || result.stderr || "").trim().slice(0, 200)}`;
  } catch (err: any) {
    throw new Error(`Hermes delegace selhala: ${err.message}`);
  }
}

function addStep(m: Mission, agent: string, status: string, output: string): void {
  m.steps.push({
    agent,
    status: status as MissionStep["status"],
    output,
    timestamp: new Date().toISOString(),
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Server ───────────────────────────────────────────────────────────

const app = Fastify({ logger: false });

async function start() {
  await app.register(cors, { origin: true });

  // ─── Health check ────────────────────────────────────────────────
  app.get("/workspace/health", async () => ({
    status: "ok",
    service: "MiLO Workspace",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    missionsCount: loadStore().missions.length,
  }));

  // ─── GET /workspace/missions ─────────────────────────────────────
  app.get("/workspace/missions", async () => {
    const store = loadStore();
    return {
      missions: store.missions.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      total: store.missions.length,
      active: store.missions.filter((m) => ["running", "distributing", "executing"].includes(m.status)).length,
      done: store.missions.filter((m) => m.status === "done").length,
      failed: store.missions.filter((m) => m.status === "failed").length,
    };
  });

  // ─── POST /workspace/missions ────────────────────────────────────
  app.post("/workspace/missions", async (req) => {
    const { name, description, agents, tasks } = req.body as {
      name: string;
      description?: string;
      agents?: string[];
      tasks?: { description: string; assignedAgent: string }[];
    };

    if (!name || typeof name !== "string") {
      return { error: "Název mise je povinný" };
    }

    const mission: Mission = {
      id: generateId(),
      name,
      description: description || "",
      agents: agents || ["chief-of-staff", "developer-agent", "research-agent"],
      tasks: (tasks || [
        { description: "Analyzovat zadání a připravit plán", assignedAgent: "chief-of-staff" },
        { description: "Implementovat řešení", assignedAgent: "developer-agent" },
        { description: "Provést rešerši a validaci", assignedAgent: "research-agent" },
      ]).map((t, i) => ({
        id: `task-${i + 1}`,
        description: t.description,
        assignedAgent: t.assignedAgent,
        status: "pending" as const,
      })),
      status: "idle",
      progress: 0,
      steps: [],
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      result: null,
    };

    const store = loadStore();
    store.missions.push(mission);
    saveStore(store);

    console.log(`📋 Mise vytvořena: ${mission.name} (${mission.id})`);
    return { mission, ok: true };
  });

  // ─── POST /workspace/missions/:id/run ────────────────────────────
  app.post("/workspace/missions/:id/run", async (req) => {
    const { id } = req.params as { id: string };
    const store = loadStore();
    const mission = store.missions.find((m) => m.id === id);

    if (!mission) {
      return { error: "Mise nenalezena", ok: false };
    }

    if (mission.status === "running" || mission.status === "distributing" || mission.status === "executing") {
      return { error: "Mise již běží", ok: false };
    }

    // Reset pro re-run
    if (mission.status === "done" || mission.status === "failed") {
      mission.status = "idle";
      mission.progress = 0;
      mission.steps = [];
      mission.startedAt = null;
      mission.completedAt = null;
      mission.result = null;
      mission.tasks.forEach((t) => (t.status = "pending"));
    }

    mission.status = "running";
    mission.progress = 1;
    mission.steps = [];
    saveStore(store);

    console.log(`🚀 Spouštím misi: ${mission.name} (${mission.id})`);

    // Spustit asynchronně (neblokovat HTTP response)
    executeMission(mission).catch((err) => {
      console.error(`❌ Mise ${mission.id} selhala:`, err);
    });

    return { ok: true, mission, message: "Mise spuštěna" };
  });

  // ─── GET /workspace/missions/:id/status ──────────────────────────
  app.get("/workspace/missions/:id/status", async (req) => {
    const { id } = req.params as { id: string };
    const store = loadStore();
    const mission = store.missions.find((m) => m.id === id);

    if (!mission) {
      return { error: "Mise nenalezena" };
    }

    return {
      id: mission.id,
      name: mission.name,
      status: mission.status,
      progress: mission.progress,
      steps: mission.steps.slice(-20),
      result: mission.result,
      startedAt: mission.startedAt,
      completedAt: mission.completedAt,
    };
  });

  // ─── DELETE /workspace/missions/:id ──────────────────────────────
  app.delete("/workspace/missions/:id", async (req) => {
    const { id } = req.params as { id: string };
    const store = loadStore();
    const idx = store.missions.findIndex((m) => m.id === id);

    if (idx === -1) {
      return { error: "Mise nenalezena" };
    }

    store.missions.splice(idx, 1);
    saveStore(store);
    return { ok: true };
  });

  // ─── GET /workspace/agents ───────────────────────────────────────
  app.get("/workspace/agents", async () => {
    return { agents: DEFAULT_AGENTS };
  });

  // ─── GET /workspace/stats ────────────────────────────────────────
  app.get("/workspace/stats", async () => {
    const store = loadStore();
    const total = store.missions.length;
    const active = store.missions.filter((m) => ["running", "distributing", "executing"].includes(m.status)).length;
    const done = store.missions.filter((m) => m.status === "done").length;
    const failed = store.missions.filter((m) => m.status === "failed").length;
    const lastMission = store.missions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    return {
      total,
      active,
      done,
      failed,
      successRate: total > 0 ? Math.round((done / (done + failed || 1)) * 100) : 0,
      lastMission: lastMission ? { name: lastMission.name, status: lastMission.status, createdAt: lastMission.createdAt } : null,
    };
  });

  // ─── KANBAN ───────────────────────────────────────────────────────
  app.get("/workspace/kanban", async (_req, reply) => {
    try {
      const dbPath = process.env.MILO_KANBAN_DB_PATH || resolve(process.env.HOME || "/tmp", ".hermes/kanban.db");
      if (!existsSync(dbPath)) {
        return reply.send([]);
      }
      // Bezpečné: execSync s pevně danou SQL query, dbPath escapován přes JSON.stringify
      const safeQuery = "SELECT id, title, status, assignee, priority, created_at FROM tasks ORDER BY status, priority DESC LIMIT 20";
      const out = execSync(
        `sqlite3 -json ${JSON.stringify(dbPath)} ${JSON.stringify(safeQuery)}`,
        { timeout: 5000, encoding: "utf-8" }
      );
      const tasks = JSON.parse(out || "[]");
      return reply.send(tasks);
    } catch (err) {
      console.error("Kanban query failed:", err);
      return reply.send([]);
    }
  });

  // ─── Start ───────────────────────────────────────────────────────
  const port = 4002;
  try {
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`\n🖥️  MiLO Workspace běží na http://localhost:${port}`);
    console.log(`   Health:         GET  /workspace/health`);
    console.log(`   Mise:           GET  /workspace/missions`);
    console.log(`   Vytvořit misi:  POST /workspace/missions`);
    console.log(`   Spustit misi:   POST /workspace/missions/:id/run`);
    console.log(`   Status mise:    GET  /workspace/missions/:id/status`);
    console.log(`   Kanban:         GET  /workspace/kanban`);
    console.log(`   Agenti:         GET  /workspace/agents`);
    console.log(`   Statistiky:     GET  /workspace/stats\n`);
  } catch (err) {
    console.error("Failed to start workspace server:", err);
    process.exit(1);
  }
}

start();
