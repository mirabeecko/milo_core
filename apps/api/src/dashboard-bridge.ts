/**
 * MiLO Dashboard API Bridge — lightweight Fastify server
 * 
 * Poskytuje API endpointy pro MiLO dashboard na localhost:3000.
 * Data bere z reálných Hermes sessions a systémových metrik.
 * 
 * Port: DASHBOARD_PORT env var, default 4001
 *       (oddělený od hlavního API serveru na 4000, aby nedocházelo ke kolizi EADDRINUSE)
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const HERMES_HOME = join(homedir(), ".hermes");
const app = Fastify({ logger: false });

// ─── Helpers ───────────────────────────────────────────────────

function getHermesSessions() {
  try {
    const raw = execSync("hermes sessions list 2>/dev/null", {
      encoding: "utf-8",
      timeout: 5000,
      cwd: homedir(),
    });
    // Parse text output: lines with session IDs like "20260721_112011_18c349"
    const lines = raw.split("\n");
    const sessions: any[] = [];
    for (const line of lines) {
      // Match session ID pattern: YYYYMMDD_HHMMSS_hex or bg_NNNNNN_hex
      const match = line.match(/(\S+)\s{2,}(\S.*?)\s{2,}(\S+)\s+(\d{8}_\d{6}_[a-f0-9]+|bg_\d+_[a-f0-9]+)/);
      if (match) {
        sessions.push({
          title: match[1] === "—" ? "" : match[1],
          preview: match[2] === "—" ? "" : match[2],
          last_active: match[3],
          id: match[4],
        });
      }
    }
    return sessions;
  } catch {
    return [];
  }
}

function getHermesStatus() {
  try {
    const raw = execSync("hermes status --all 2>/dev/null", {
      encoding: "utf-8",
      timeout: 5000,
      cwd: homedir(),
    });
    return raw.trim();
  } catch {
    return "unavailable";
  }
}

function getGitProjects() {
  try {
    const devDir = join(homedir(), "dev");
    const result = execSync(
      `find "${devDir}" -maxdepth 3 -name ".git" -type d 2>/dev/null | head -20`,
      { encoding: "utf-8", timeout: 5000 }
    );
    return result
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((p) => p.replace("/.git", "").replace(devDir + "/", ""));
  } catch {
    return [];
  }
}

function getSystemMetrics() {
  try {
    // CPU usage as percentage
    let cpuPct = 0;
    try {
      const cpuRaw = execSync(
        "top -l 1 -n 0 2>/dev/null | grep 'CPU usage'",
        { encoding: "utf-8", timeout: 3000 }
      );
      // Parse "CPU usage: 12.5% user, 8.2% sys, 79.3% idle" → idle = free
      const idleMatch = cpuRaw.match(/([\d.]+)%\s+idle/);
      if (idleMatch) cpuPct = Math.round(100 - parseFloat(idleMatch[1]));
    } catch { cpuPct = 0; }

    // Memory usage as percentage (macOS vm_stat)
    let memPct = 0;
    try {
      const memRaw = execSync("vm_stat 2>/dev/null", {
        encoding: "utf-8", timeout: 3000,
      });
      const pageSizeMatch = memRaw.match(/page size of (\d+)/);
      const pageSize = pageSizeMatch ? parseInt(pageSizeMatch[1]) : 16384;
      const freePagesMatch = memRaw.match(/Pages free:\s+(\d+)/);
      const activePagesMatch = memRaw.match(/Pages active:\s+(\d+)/);
      const inactivePagesMatch = memRaw.match(/Pages inactive:\s+(\d+)/);
      const wiredPagesMatch = memRaw.match(/Pages wired down:\s+(\d+)/);
      const specPagesMatch = memRaw.match(/Pages speculative:\s+(\d+)/);
      const free = freePagesMatch ? parseInt(freePagesMatch[1]) : 0;
      const active = activePagesMatch ? parseInt(activePagesMatch[1]) : 0;
      const inactive = inactivePagesMatch ? parseInt(inactivePagesMatch[1]) : 0;
      const wired = wiredPagesMatch ? parseInt(wiredPagesMatch[1]) : 0;
      const spec = specPagesMatch ? parseInt(specPagesMatch[1]) : 0;
      const total = free + active + inactive + wired + spec;
      const used = active + wired + spec;
      if (total > 0) memPct = Math.round((used / total) * 100);
    } catch { memPct = 0; }

    // Disk usage as percentage
    let diskPct = 0;
    try {
      const diskRaw = execSync("df -h / 2>/dev/null | tail -1", {
        encoding: "utf-8", timeout: 3000,
      });
      const diskMatch = diskRaw.match(/(\d+)%/);
      if (diskMatch) diskPct = parseInt(diskMatch[1]);
    } catch { diskPct = 0; }

    // Uptime
    let uptime = "N/A";
    try {
      const uptimeRaw = execSync("uptime 2>/dev/null", {
        encoding: "utf-8", timeout: 3000,
      });
      const upMatch = uptimeRaw.match(/up\s+(.+?),\s+\d+ users?/);
      if (upMatch) uptime = upMatch[1].trim();
    } catch {}

    return { cpu: cpuPct, memory: memPct, disk: diskPct, uptime };
  } catch {
    return { cpu: 0, memory: 0, disk: 0, uptime: "N/A" };
  }
}

function getKanbanBoard() {
  try {
    const raw = execSync(`python3 - <<'PY'
import json, sqlite3
from pathlib import Path

db = Path.home() / ".hermes" / "kanban.db"
if not db.exists():
    print(json.dumps({"tasks": [], "stats": {}}))
    raise SystemExit

conn = sqlite3.connect(db)
conn.row_factory = sqlite3.Row
stats = {row["status"]: row["count"] for row in conn.execute("select status, count(*) as count from tasks group by status")}
tasks = []
for row in conn.execute("""
    select id, title, body, assignee, status, priority, created_at, started_at,
           completed_at, result, last_failure_error, block_kind
    from tasks
    order by
      case status
        when 'running' then 0
        when 'ready' then 1
        when 'todo' then 2
        when 'blocked' then 3
        when 'scheduled' then 4
        when 'triage' then 5
        when 'done' then 6
        else 7
      end,
      priority desc,
      created_at desc
"""):
    tasks.append(dict(row))
print(json.dumps({"tasks": tasks, "stats": stats}, ensure_ascii=False))
PY`, { encoding: "utf-8", timeout: 5000, cwd: homedir() });
    return JSON.parse(raw || '{"tasks":[],"stats":{}}');
  } catch {
    return { tasks: [], stats: {}, unavailable: true };
  }
}

// ─── Agent definitions (from MiLO documentation) ───────────────

const MOCK_AGENTS = [
  {
    id: "chief-of-staff",
    name: "Chief of Staff",
    slug: "chief-of-staff",
    category: "coordinator",
    purpose: "Digitální ředitel kanceláře — plánuje, prioritizuje, deleguje, kontroluje",
    description: "Každé ráno připraví briefing, koordinuje agenty, reportuje stav projektů.",
    priority: "critical",
    risk_level: "low",
    lifecycle_status: "running",
    implementation_progress: 78,
    status: "running",
    metrics: { totalTasks: 145, successfulTasks: 138 },
    health: { lastHeartbeat: new Date().toISOString(), status: "healthy" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "developer-agent",
    name: "Developer Agent",
    slug: "developer-agent",
    category: "engineering",
    purpose: "Senior software engineer — vývoj, code review, architektura",
    description: "Pomáhá s vývojem, refaktoringem a technickými rozhodnutími.",
    priority: "high",
    risk_level: "medium",
    lifecycle_status: "idle",
    implementation_progress: 85,
    status: "idle",
    metrics: { totalTasks: 312, successfulTasks: 289 },
    health: { lastHeartbeat: new Date().toISOString(), status: "healthy" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "calendar-agent",
    name: "Calendar Agent",
    slug: "calendar-agent",
    category: "productivity",
    purpose: "Osobní manažer času — scheduling, focus time, detekce kolizí",
    description: "Aktivně řídí čas — synchronizuje kalendáře, navrhuje focus time.",
    priority: "high",
    risk_level: "low",
    lifecycle_status: "idle",
    implementation_progress: 65,
    status: "idle",
    metrics: { totalTasks: 89, successfulTasks: 82 },
    health: { lastHeartbeat: new Date().toISOString(), status: "healthy" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "communication-agent",
    name: "Communication Agent",
    slug: "communication-agent",
    category: "communication",
    purpose: "Osobní komunikační manažer — email triage, AI shrnutí",
    description: "Řídí příchozí a odchozí komunikaci, minimalizuje čas strávený emaily.",
    priority: "high",
    risk_level: "low",
    lifecycle_status: "idle",
    implementation_progress: 60,
    status: "idle",
    metrics: { totalTasks: 56, successfulTasks: 51 },
    health: { lastHeartbeat: new Date().toISOString(), status: "healthy" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "knowledge-agent",
    name: "Knowledge Agent",
    slug: "knowledge-agent",
    category: "knowledge",
    purpose: "Správce znalostní báze — indexing, vector search",
    description: "Indexuje dokumenty a zajišťuje vyhledávání napříč zdroji.",
    priority: "medium",
    risk_level: "low",
    lifecycle_status: "idle",
    implementation_progress: 55,
    status: "idle",
    metrics: { totalTasks: 43, successfulTasks: 40 },
    health: { lastHeartbeat: new Date().toISOString(), status: "healthy" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "research-agent",
    name: "Research Agent",
    slug: "research-agent",
    category: "knowledge",
    purpose: "Research analytik — rešerše, analýza dokumentů",
    description: "Hledá informace, analyzuje dokumenty, připravuje rešerše.",
    priority: "medium",
    risk_level: "low",
    lifecycle_status: "idle",
    implementation_progress: 50,
    status: "idle",
    metrics: { totalTasks: 67, successfulTasks: 62 },
    health: { lastHeartbeat: new Date().toISOString(), status: "healthy" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "legal-agent",
    name: "Legal Agent",
    slug: "legal-agent",
    category: "legal",
    purpose: "Právní analytik — analýza smluv, compliance",
    description: "Analyzuje právní dokumenty, smlouvy a rizika.",
    priority: "medium",
    risk_level: "high",
    lifecycle_status: "idle",
    implementation_progress: 40,
    status: "idle",
    metrics: { totalTasks: 23, successfulTasks: 21 },
    health: { lastHeartbeat: new Date().toISOString(), status: "healthy" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "automation-agent",
    name: "Automation Agent",
    slug: "automation-agent",
    category: "infrastructure",
    purpose: "Automatizační inženýr — workflow, scripting, integrace",
    description: "Navrhuje a spouští opakující se workflow.",
    priority: "low",
    risk_level: "medium",
    lifecycle_status: "offline",
    implementation_progress: 30,
    status: "offline",
    metrics: { totalTasks: 12, successfulTasks: 10 },
    health: { lastHeartbeat: new Date(Date.now() - 86400000).toISOString(), status: "unknown" },
    updatedAt: new Date().toISOString(),
  },
];

// ─── Routes ────────────────────────────────────────────────────

async function start() {
  await app.register(cors, { origin: true });

  // Health
  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  // ─── Dashboard HTML (přístupný odkudkoliv přes tunnel) ──
  app.get("/dashboard", async (req, reply) => {
    const fs = await import("fs");
    const path = await import("path");
    const { homedir: hd } = await import("os");
    const htmlPath = path.join(hd(), ".hermes/profiles/operation_strategy_director/analyzy/milo-dashboard.html");
    const html = fs.readFileSync(htmlPath, "utf-8");
    reply.header("Content-Type", "text/html; charset=utf-8");
    return reply.send(html);
  });

  // ─── Kanban / Workspace — reálná Hermes SQLite data ─────
  app.get("/phone-tracker/workspace/kanban", async (_req, reply) => {
    const board = getKanbanBoard();
    return reply.send({
      ...board,
      counts: board.stats,
      updatedAt: new Date().toISOString(),
    });
  });

  // ─── Control Center (používá dashboard na :3000) ─────────

  // Helper: filter and return agents
  function getFilteredAgents(query: Record<string, string>) {
    let agents = MOCK_AGENTS.map(a => ({
      ...a,
      metrics: { ...a.metrics, updatedAt: new Date().toISOString() },
    }));
    if (query.status) agents = agents.filter(a => a.lifecycle_status === query.status || a.status === query.status);
    if (query.category) agents = agents.filter(a => a.category === query.category);
    return agents;
  }

  // ─── /control-center/agents (přímé) ──────────────────
  app.get("/control-center/agents", async (req, reply) => {
    return reply.send(getFilteredAgents(req.query as Record<string, string>));
  });

  // ─── /executive/control/agents (přes Next.js proxy) ──
  app.get("/executive/control/agents", async (req, reply) => {
    const agents = getFilteredAgents(req.query as Record<string, string>);
    return reply.send({ agents, count: agents.length });
  });

  app.get("/control-center/agents/:id", async (req, reply) => {
    const agent = MOCK_AGENTS.find(a => a.id === (req.params as any).id);
    if (!agent) return reply.status(404).send({ error: "Agent not found" });
    return reply.send(agent);
  });

  app.get("/executive/control/agents/:id", async (req, reply) => {
    const agent = MOCK_AGENTS.find(a => a.id === (req.params as any).id);
    if (!agent) return reply.status(404).send({ error: "Agent not found" });
    return reply.send(agent);
  });

  app.post("/control-center/agents", async (req, reply) => {
    const body = req.body as any;
    const agent = {
      id: body.slug || `agent-${Date.now()}`,
      name: body.name || "New Agent",
      slug: body.slug || `agent-${Date.now()}`,
      category: body.category || "engineering",
      purpose: body.purpose || "",
      description: body.description || "",
      priority: body.priority || "medium",
      risk_level: body.risk_level || "low",
      lifecycle_status: "idle",
      implementation_progress: 0,
      status: "idle",
      metrics: { totalTasks: 0, successfulTasks: 0 },
      health: { lastHeartbeat: new Date().toISOString(), status: "healthy" },
      updatedAt: new Date().toISOString(),
    };
    return reply.status(201).send(agent);
  });

  app.get("/control-center", async (req, reply) => {
    const sessions = getHermesSessions();
    const projects = getGitProjects();
    return reply.send({
      overview: {
        totalAgents: MOCK_AGENTS.length,
        activeAgents: MOCK_AGENTS.filter(a => a.lifecycle_status === "running").length,
        totalUseCases: 24,
        implementedUseCases: 8,
        inProgressUseCases: 12,
        blockedTasks: 3,
        pendingApprovals: 2,
        failedRuns: 0,
        overallReadiness: Math.round(
          MOCK_AGENTS.reduce((sum, a) => sum + a.implementation_progress, 0) / MOCK_AGENTS.length
        ),
      },
      activeMissions: [
        { id: "m1", title: "Dashboard integrace", status: "active", agentId: "chief-of-staff" },
        { id: "m2", title: "WhatsApp bridge setup", status: "running", agentId: "developer-agent" },
      ],
      recentChanges: sessions.slice(0, 5).map((s: any) => ({
        actor: "Hermes",
        action: "session.completed",
        entityType: "session",
        entityId: s.id || "unknown",
        timestamp: s.last_active || new Date().toISOString(),
        result: "success",
      })),
      quickActions: [
        { id: "run-brief", label: "Spustit ranní briefing" },
        { id: "run-audit", label: "Spustit audit projektů" },
        { id: "sync-agents", label: "Synchronizovat agenty" },
        { id: "gateway-restart", label: "Restartovat gateway" },
      ],
    });
  });

  // ─── Agent operations ─────────────────────────────────

  function updateAgentStatus(id: string, status: string) {
    const agent = MOCK_AGENTS.find(a => a.id === id);
    if (!agent) return null;
    agent.lifecycle_status = status;
    agent.status = status;
    return agent;
  }

  // Single agent actions
  for (const action of ["start", "stop", "pause", "resume", "restart"]) {
    const statusMap: Record<string, string> = {
      start: "running", stop: "offline", pause: "paused", resume: "idle", restart: "running"
    };
    app.post(`/control-center/agents/:id/${action}`, async (req, reply) => {
      const agent = updateAgentStatus((req.params as any).id, statusMap[action]);
      if (!agent) return reply.status(404).send({ error: "Not found" });
      return reply.send({ success: true, agent });
    });
    app.post(`/executive/control/agents/:id/${action}`, async (req, reply) => {
      const agent = updateAgentStatus((req.params as any).id, statusMap[action]);
      if (!agent) return reply.status(404).send({ error: "Not found" });
      return reply.send({ success: true, agent });
    });
  }

  // Bulk operations
  app.post("/control-center/agents/bulk/start", async (req, reply) => {
    const { ids } = req.body as any;
    if (!ids?.length) return reply.status(400).send({ error: "No ids" });
    ids.forEach((id: string) => updateAgentStatus(id, "running"));
    return reply.send({ success: true, started: ids.length });
  });

  app.post("/control-center/agents/bulk/stop", async (req, reply) => {
    const { ids } = req.body as any;
    if (!ids?.length) return reply.status(400).send({ error: "No ids" });
    ids.forEach((id: string) => updateAgentStatus(id, "offline"));
    return reply.send({ success: true, stopped: ids.length });
  });

  // ─── Activity SSE stream ───────────────────────────────

  app.get("/control-center/activity/stream", async (req, reply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const events = [
      { type: "agent:heartbeat", agentId: "chief-of-staff", timestamp: new Date().toISOString(), payload: { status: "running" } },
      { type: "agent:status", agentId: "developer-agent", timestamp: new Date().toISOString(), payload: { status: "idle" } },
    ];

    for (const event of events) {
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    // Keep alive
    const interval = setInterval(() => {
      reply.raw.write(`: ping ${new Date().toISOString()}\n\n`);
    }, 15000);

    req.raw.on("close", () => clearInterval(interval));
  });

  // ─── System info ───────────────────────────────────────

  app.get("/api/system", async () => {
    const sessions = getHermesSessions();
    const metrics = getSystemMetrics();
    const status = getHermesStatus();
    return {
      hermes: {
        status: status.includes("running") || status.includes("ok") ? "running" : "offline",
        sessions: sessions.length,
      },
      system: {
        cpu: metrics.cpu,
        memory: metrics.memory,
        disk: metrics.disk,
        uptime: metrics.uptime,
      },
      timestamp: new Date().toISOString(),
    };
  });

  // ─── Hermes bridge ─────────────────────────────────────

  app.get("/api/hermes/sessions", async () => {
    return getHermesSessions();
  });

  app.get("/api/hermes/status", async () => {
    return { status: getHermesStatus() };
  });

  // Gateway restart
  app.post("/api/hermes/restart", async (_req, reply) => {
    try {
      execSync("hermes gateway restart 2>/dev/null", {
        encoding: "utf-8", timeout: 10000, cwd: homedir(),
      });
      return reply.send({ success: true, message: "Gateway restart initiated" });
    } catch (e: any) {
      return reply.status(500).send({ success: false, error: e.message });
    }
  });

  // ─── Cron management ───────────────────────────────────

  app.get("/api/hermes/cron", async () => {
    try {
      const raw = execSync("hermes cron list 2>/dev/null", {
        encoding: "utf-8", timeout: 5000, cwd: homedir(),
      });
      const jobs: any[] = [];
      const lines = raw.split("\n");
      let current: any = null;
      for (const line of lines) {
        const jobMatch = line.match(/^\s+([a-f0-9]+)\s+\[(\w+)\]/);
        if (jobMatch) {
          if (current) jobs.push(current);
          current = { job_id: jobMatch[1], state: jobMatch[2], enabled: jobMatch[2] !== "paused" };
        } else if (current) {
          const nameMatch = line.match(/^\s+Name:\s+(.+)/);
          if (nameMatch) current.name = nameMatch[1].trim();
          const schedMatch = line.match(/^\s+Schedule:\s+(.+)/);
          if (schedMatch) current.schedule = schedMatch[1].trim();
          const nextMatch = line.match(/^\s+Next run:\s+(.+)/);
          if (nextMatch) current.next_run = nextMatch[1].trim();
          const lastMatch = line.match(/^\s+Last run:\s+(\S+)\s+(\w+)/);
          if (lastMatch) { current.last_run = lastMatch[1]; current.last_status = lastMatch[2]; }
        }
      }
      if (current) jobs.push(current);
      return jobs;
    } catch { return []; }
  });

  for (const op of ["run", "pause", "resume"]) {
    app.post(`/api/hermes/cron/:id/${op}`, async (req, reply) => {
      try {
        execSync(`hermes cron ${op} ${(req.params as any).id} 2>/dev/null`, {
          encoding: "utf-8", timeout: 5000, cwd: homedir(),
        });
        return reply.send({ success: true });
      } catch (e: any) {
        return reply.status(500).send({ success: false, error: e.message });
      }
    });
  }

  const PORT = parseInt(process.env.DASHBOARD_PORT || "4001", 10);
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`✅ MiLO Dashboard API running on http://localhost:${PORT}`);
    console.log(`   ${MOCK_AGENTS.length} agents, control center ready`);
  } catch (err: any) {
    if (err.code === "EADDRINUSE") {
      console.log(`⚠️  Port ${PORT} already in use — dashboard may already be running (or try DASHBOARD_PORT env var)`);
    } else {
      console.error("Failed to start:", err.message);
      process.exit(1);
    }
  }
}

start();
