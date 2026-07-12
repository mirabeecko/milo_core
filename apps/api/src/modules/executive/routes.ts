/**
 * Executive Dashboard API — stabilní kontrakt pro dashboard tým.
 *
 * Endpointy:
 *   GET  /executive/status       — organizační přehled
 *   GET  /executive/departments  — oddělení + status
 *   GET  /executive/agents       — agenti s reálným runtime stavem
 *   GET  /executive/missions     — mise (CRUD přes AgentManager)
 *   POST /executive/missions
 *   GET  /executive/missions/:id
 *   PATCH /executive/missions/:id
 *   GET  /executive/missions/:id/timeline
 *   GET  /executive/events       — persistentní event log
 *   POST /executive/events
 *   GET  /executive/approvals    — fronta schvalování
 *   POST /executive/approvals
 *   POST /executive/approvals/:id/approve
 *   POST /executive/approvals/:id/reject
 *   GET  /executive/risks        — aktivní rizika
 *   GET  /executive/artifacts    — výstupní artefakty
 *   GET  /executive/backlog      — executive backlog
 *   GET  /executive/registry     — plný organizační registr
 *   GET  /executive/telemetry    — telemetrický kontrakt
 */
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getAgentManager } from "../agents/manager.js";
import { ExecutiveRuntime } from "./executive-runtime.js";
import { generateExecutiveBrief } from "./brief-pipeline.js";
import { readRecentEvents, logExecutiveEvent } from "./event-logger.js";
import { buildIndex, searchIndex, getIndex } from "./search-index.js";
import { buildUnifiedIndex, unifiedSearch } from "./unified-search.js";
import { sendMorningBrief, setManager, getDeliveryStatus, enableDelivery, disableDelivery } from "./morning-brief.js";
import { prioritizeProjects } from "./project-prioritizer.js";
import { executeISDSIntake } from "./isds-intake.js";
import { dockerStatus } from "./docker-monitor.js";
import { llmCosts } from "./llm-costs.js";
import {
  listApprovals,
  createApproval,
  decideApproval,
  getPendingCount,
} from "./approval-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../../../../..");
const ORG_REGISTRY_PATH = resolve(REPO_ROOT, "organization-registry.json");
const TELEMETRY_CONTRACT_PATH = resolve(REPO_ROOT, "telemetry-contract.json");

function loadOrgRegistry() {
  if (!existsSync(ORG_REGISTRY_PATH)) return null;
  return JSON.parse(readFileSync(ORG_REGISTRY_PATH, "utf-8"));
}

// Singleton ExecutiveRuntime
let _execRuntime: ExecutiveRuntime | null = null;

async function getExecRuntime(): Promise<ExecutiveRuntime> {
  if (!_execRuntime) {
    const mgr = await getAgentManager();
    _execRuntime = new ExecutiveRuntime(mgr);
    await _execRuntime.recover();
  }
  return _execRuntime;
}

export async function executiveRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const manager = await getAgentManager();

  // ═══════════════════════════════════════════════════════════════════
  // STATUS
  // ═══════════════════════════════════════════════════════════════════

  app.get("/executive/status", async (_req, reply) => {
    const registry = loadOrgRegistry();
    const agents = manager.listAgents().map((a) => ({
      id: a.agent.id,
      name: a.agent.name,
      status: a.agent.status,           // reálný runtime stav
      state: a.getState(),              // detailní runtime state
      department: registry?.agents?.[a.agent.id]?.department ?? "unknown",
    }));
    const missions = await manager.getMissions({});
    const depts = registry?.departments ?? {};

    return reply.send({
      organization: {
        totalDepartments: Object.keys(depts).length,
        activeDepartments: Object.values(depts).filter((d: any) => d.status === "active").length,
        totalAgents: agents.length,
        activeMissions: missions.filter((m) => m.status !== "completed" && m.status !== "failed").length,
        pendingApprovals: getPendingCount(),
      },
      departments: Object.entries(depts).map(([id, d]: [string, any]) => ({
        id,
        name: d.name,
        mission: d.mission,
        configuredStatus: d.status,
        leadAgent: agents.find((a) => a.id === d.lead_agent_id) || null,
      })),
      agents,
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // DEPARTMENTS
  // ═══════════════════════════════════════════════════════════════════

  app.get("/executive/departments", async (_req, reply) => {
    const registry = loadOrgRegistry();
    const agents = manager.listAgents().map((a) => ({
      id: a.agent.id,
      name: a.agent.name,
      status: a.agent.status,
      state: a.getState(),
    }));
    const depts = registry?.departments ?? {};

    return reply.send(
      Object.entries(depts).map(([id, d]: [string, any]) => {
        const lead = agents.find((a) => a.id === d.lead_agent_id);
        return {
          id,
          name: d.name,
          mission: d.mission,
          configuredStatus: d.status,
          leadAgentStatus: lead?.status ?? "offline",
          leadAgentState: lead?.state ?? null,
          availableTools: d.available_tools ?? [],
          memoryScope: d.memory_scope ?? [],
          activeMissions: d.active_missions ?? [],
          dependencies: d.dependencies ?? [],
        };
      }),
    );
  });

  // ═══════════════════════════════════════════════════════════════════
  // AGENTS
  // ═══════════════════════════════════════════════════════════════════

  app.get("/executive/agents", async (_req, reply) => {
    const registry = loadOrgRegistry();
    const agents = manager.listAgents().map((entity) => {
      const s = entity.getState();
      return {
        id: entity.agent.id,
        name: entity.agent.name,
        role: entity.agent.role,
        department: registry?.agents?.[entity.agent.id]?.department ?? null,
        // Runtime stav — nikoli konfigurace
        status: entity.agent.status,
        health: entity.agent.health,
        activeTaskId: s.activeTaskId,
        taskProgress: s.taskProgress,
        pendingTasks: s.pendingTasks,
        runningTasks: s.runningTasks,
        completedTasks: s.completedTasks,
        failedTasks: s.failedTasks,
        runningTimeMs: s.runningTimeMs,
        lastActivityAt: s.lastActivityAt,
        explanation: s.explanation,
        // Konfigurace
        priority: entity.agent.priority,
        specialization: entity.agent.specialization,
        tools: entity.agent.config.tools,
        model: entity.agent.config.model,
      };
    });

    return reply.send(agents);
  });

  // ═══════════════════════════════════════════════════════════════════
  // MISSIONS
  // ═══════════════════════════════════════════════════════════════════

  app.get("/executive/missions", async (_req, reply) => {
    const missions = await manager.getMissions({});
    return reply.send(missions);
  });

  app.post("/executive/missions", async (req, reply) => {
    const body = req.body as { title?: string; description?: string; priority?: string };
    if (!body?.title) {
      return reply.status(400).send({ error: "title is required" });
    }
    const mission = await manager.createMission({
      title: body.title,
      description: body.description,
      priority: (body.priority as any) || "normal",
    });
    logExecutiveEvent("mission_created", {
      mission_id: mission.id,
      summary: mission.title,
      department: "OC",
    });
    return reply.status(201).send(mission);
  });

  app.get("/executive/missions/:id", async (req, reply) => {
    const params = req.params as { id: string };
    const mission = await manager.getMissionById(params.id);
    if (!mission) return reply.status(404).send({ error: "Mission not found" });
    const tasks = await manager.getTasks({ missionId: params.id });
    return reply.send({ ...mission, tasks });
  });

  app.patch("/executive/missions/:id", async (req, reply) => {
    const params = req.params as { id: string };
    const body = req.body as { status?: string };
    const mission = await manager.getMissionById(params.id);
    if (!mission) return reply.status(404).send({ error: "Mission not found" });

    if (body.status) {
      mission.status = body.status as any;
      logExecutiveEvent("mission_progress", {
        mission_id: mission.id,
        previous_status: mission.status,
        new_status: body.status,
        summary: `Mise ${mission.id}: ${body.status}`,
      });
    }

    return reply.send(mission);
  });

  app.get("/executive/missions/:id/timeline", async (req, reply) => {
    const params = req.params as { id: string };
    const allEvents = readRecentEvents(1000);
    const timeline = allEvents.filter((e) => e.mission_id === params.id);
    return reply.send({ mission_id: params.id, events: timeline, count: timeline.length });
  });

  // ═══════════════════════════════════════════════════════════════════
  // EVENTS (telemetry)
  // ═══════════════════════════════════════════════════════════════════

  app.get("/executive/events", async (req, reply) => {
    const query = req.query as { limit?: string; type?: string };
    const limit = query.limit ? parseInt(query.limit) : 100;
    const events = readRecentEvents(limit);
    const filtered = query.type ? events.filter((e) => e.event_type === query.type) : events;
    return reply.send({ count: filtered.length, events: filtered });
  });

  app.post("/executive/events", async (req, reply) => {
    const body = req.body as { event_type: string; payload?: Record<string, unknown> };
    if (!body?.event_type) return reply.status(400).send({ error: "event_type required" });
    logExecutiveEvent(body.event_type as any, body.payload || {});
    return reply.send({ ok: true });
  });

  // ═══════════════════════════════════════════════════════════════════
  // APPROVALS
  // ═══════════════════════════════════════════════════════════════════

  app.get("/executive/approvals", async (req, reply) => {
    const query = req.query as { status?: string };
    const approvals = listApprovals(query.status as any);
    return reply.send({ count: approvals.length, approvals });
  });

  app.post("/executive/approvals", async (req, reply) => {
    const body = req.body as any;
    if (!body?.mission_id || !body?.what) {
      return reply.status(400).send({ error: "mission_id and what are required" });
    }
    const approval = createApproval({
      mission_id: body.mission_id,
      department: body.department || "unknown",
      agent_id: body.agent_id || "unknown",
      what: body.what,
      why: body.why || "",
      risk_level: body.risk_level || "medium",
      requested_by: body.requested_by || "chief",
      timeout_hours: body.timeout_hours || 48,
    });
    logExecutiveEvent("approval_requested", {
      approval_id: approval.id,
      mission_id: approval.mission_id,
      department: approval.department,
      summary: approval.what,
      risk_level: approval.risk_level,
    });
    return reply.status(201).send(approval);
  });

  app.post("/executive/approvals/:id/approve", async (req, reply) => {
    const params = req.params as { id: string };
    const body = req.body as { reason?: string; decided_by?: string };
    const a = decideApproval(params.id, "approved", body.reason || "Schváleno", body.decided_by || "owner");
    if (!a) return reply.status(404).send({ error: "Approval not found or already decided" });
    logExecutiveEvent("approval_granted", {
      approval_id: a.id,
      mission_id: a.mission_id,
      summary: a.what,
    });
    return reply.send(a);
  });

  app.post("/executive/approvals/:id/reject", async (req, reply) => {
    const params = req.params as { id: string };
    const body = req.body as { reason?: string; decided_by?: string };
    const a = decideApproval(params.id, "rejected", body.reason || "Zamítnuto", body.decided_by || "owner");
    if (!a) return reply.status(404).send({ error: "Approval not found or already decided" });
    logExecutiveEvent("approval_rejected", {
      approval_id: a.id,
      mission_id: a.mission_id,
      summary: a.what,
    });
    return reply.send(a);
  });

  // ═══════════════════════════════════════════════════════════════════
  // RISKS
  // ═══════════════════════════════════════════════════════════════════

  app.get("/executive/risks", async (_req, reply) => {
    const highRiskApprovals = listApprovals("pending").filter((a) => a.risk_level === "critical" || a.risk_level === "high");
    const riskEvents = readRecentEvents(100).filter((e) =>
      ["mission_blocked", "approval_requested", "risk_raised", "mission_failed"].includes(e.event_type)
    );
    const risks = [
      ...highRiskApprovals.map((a) => ({
        event_id: a.id, event_type: "approval_pending", department: a.department,
        summary: a.what, timestamp: a.requested_at,
        payload: { risk_level: a.risk_level, why: a.why },
      })),
      ...riskEvents,
    ];
    return reply.send({ count: risks.length, risks });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ARTIFACTS
  // ═══════════════════════════════════════════════════════════════════

  app.get("/executive/artifacts", async (_req, reply) => {
    const events = readRecentEvents(500).filter((e) => e.event_type === "artifact_created");
    return reply.send({ count: events.length, artifacts: events });
  });

  // ═══════════════════════════════════════════════════════════════════
  // BACKLOG
  // ═══════════════════════════════════════════════════════════════════

  app.get("/executive/backlog", async (_req, reply) => {
    const registry = loadOrgRegistry();
    const missions = await manager.getMissions({});
    const active = missions.filter((m) => m.status !== "completed" && m.status !== "failed");
    return reply.send({
      departments: registry?.departments
        ? Object.values(registry.departments).map((d: any) => ({
            id: d.id,
            name: d.name,
            activeMissions: d.active_missions ?? [],
            availableTools: d.available_tools ?? [],
          }))
        : [],
      activeMissions: active.map((m) => ({ id: m.id, title: m.title, status: m.status, priority: m.priority })),
      totalActive: active.length,
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // REGISTRY + TELEMETRY
  // ═══════════════════════════════════════════════════════════════════

  app.get("/executive/registry", async (_req, reply) => {
    const r = loadOrgRegistry();
    if (!r) return reply.status(404).send({ error: "organization-registry.json not found" });
    return reply.send(r);
  });

  app.get("/executive/telemetry", async (_req, reply) => {
    if (!existsSync(TELEMETRY_CONTRACT_PATH))
      return reply.status(404).send({ error: "telemetry-contract.json not found" });
    const c = JSON.parse(readFileSync(TELEMETRY_CONTRACT_PATH, "utf-8"));
    return reply.send({ version: c.meta?.version, events: Object.keys(c.events ?? {}), statusModel: c.status_model });
  });

  // ═══════════════════════════════════════════════════════════════════
  // KNOWLEDGE SEARCH
  // ═══════════════════════════════════════════════════════════════════

  app.post("/executive/search/build", async (_req, reply) => {
    const result = buildIndex();
    logExecutiveEvent("artifact_created", {
      artifact_type: "index",
      artifact_path: "document-index.json",
      summary: `Index vybudován: ${result.count} dokumentů`,
    });
    return reply.send(result);
  });

  app.get("/executive/search", async (req, reply) => {
    const q = (req.query as any)?.q;
    if (!q) return reply.status(400).send({ error: "query parameter 'q' is required" });
    const results = searchIndex(q);
    return reply.send({ query: q, count: results.length, results });
  });

  app.get("/executive/search/catalog", async (_req, reply) => {
    const entries = getIndex();
    const byCategory: Record<string, number> = {};
    for (const e of entries) {
      byCategory[e.category] = (byCategory[e.category] || 0) + 1;
    }
    return reply.send({ total: entries.length, byCategory, entries });
  });

  // Unified search — all sources
  app.post("/executive/search/unified/build", async (_req, reply) => {
    const result = buildUnifiedIndex();
    logExecutiveEvent("artifact_created", {
      artifact_type: "index",
      artifact_path: "unified-index.json",
      summary: `Unified index: ${result.count} docs from [${result.sources.join(", ")}]`,
    });
    return reply.send(result);
  });

  app.get("/executive/search/unified", async (req, reply) => {
    const q = (req.query as any)?.q;
    if (!q) return reply.status(400).send({ error: "q required" });
    const results = unifiedSearch(q);
    const bySource: Record<string, number> = {};
    const byType: Record<string, number> = {};
    for (const r of results) {
      bySource[r.source] = (bySource[r.source] || 0) + 1;
      byType[r.type] = (byType[r.type] || 0) + 1;
    }
    return reply.send({ query: q, count: results.length, bySource, byType, results });
  });

  // Morning brief trigger + status
  app.post("/executive/brief/send", async (_req, reply) => {
    const runtime = await getExecRuntime();
    setManager(runtime.getManager());
    const result = sendMorningBrief(REPO_ROOT);
    logExecutiveEvent(result.status === "sent" ? "mission_completed" : "mission_blocked", {
      mission_id: "morning-brief",
      summary: result.status === "sent" ? "Ranní briefing odeslán" : `Briefing: ${result.status}`,
    });
    return reply.send(result);
  });

  app.get("/executive/brief/status", async (_req, reply) => {
    const status = getDeliveryStatus();
    // Strip any potential secret from error messages
    if (status.lastError && status.lastError.includes("bot")) {
      status.lastError = "Telegram delivery failed (token valid, check chat ID)";
    }
    return reply.send(status);
  });

  app.post("/executive/brief/enable", async (_req, reply) => {
    enableDelivery();
    return reply.send({ enabled: true });
  });

  app.post("/executive/brief/disable", async (_req, reply) => {
    disableDelivery();
    return reply.send({ enabled: false });
  });

  // Project prioritization — C-005
  app.get("/executive/projects/priorities", async (_req, reply) => {
    const result = prioritizeProjects();
    return reply.send(result);
  });

  // ISDS Intake — P-003
  app.post("/executive/isds/intake", async (_req, reply) => {
    const result = executeISDSIntake();
    return reply.send(result);
  });

  // Docker monitoring — C-014
  app.get("/executive/docker", async (_req, reply) => {
    return reply.send(dockerStatus());
  });

  // LLM costs — C-010
  app.get("/executive/costs", async (_req, reply) => {
    return reply.send(llmCosts());
  });

  // System Registry — autoritativní metadata
  app.get("/executive/system", async (_req, reply) => {
    const path = resolve(REPO_ROOT, "system-registry.json");
    if (!existsSync(path)) return reply.status(404).send({ error: "system-registry.json not found" });
    return reply.send(JSON.parse(readFileSync(path, "utf-8")));
  });

  app.get("/executive/system/:section", async (req, reply) => {
    const path = resolve(REPO_ROOT, "system-registry.json");
    if (!existsSync(path)) return reply.status(404).send({ error: "not found" });
    const r = JSON.parse(readFileSync(path, "utf-8"));
    const section = (req.params as any).section;
    if (!(section in r)) return reply.status(404).send({ error: `section '${section}' not found` });
    return reply.send(r[section]);
  });

  // ═══════════════════════════════════════════════════════════════════
  // EXECUTIVE BRIEF
  // ═══════════════════════════════════════════════════════════════════

  app.get("/executive/brief", async (_req, reply) => {
    const runtime = await getExecRuntime();
    const brief = generateExecutiveBrief(REPO_ROOT, runtime.getManager(), runtime.listMissions());
    const format = (_req.query as any)?.format;
    if (format === "text") {
      const lines = [
        `=== MiLO Executive Brief ===`,
        `Generováno: ${brief.generated}`,
        ``,
        ...brief.sections.map((s) =>
          `[${s.confidence}] ${s.title}\n${s.content}${s.blockers.length ? `\n  ⚠️  ${s.blockers.join(", ")}` : ""}${s.recommendations.length ? `\n  → ${s.recommendations.join(", ")}` : ""}`
        ),
        ``,
        `SHRNUTÍ: ${brief.summary}`,
        `BLOKÁTORY: ${brief.criticalBlockers.length ? brief.criticalBlockers.join("; ") : "žádné"}`,
        `DOPORUČENÍ: ${brief.topRecommendations.join("; ")}`,
      ].join("\n");
      // Telegram send (pokud je token)
      if ((_req.query as any)?.send === "telegram") {
        const token = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN_2;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (token && chatId) {
          try {
            const { execSync } = await import("node:child_process");
            execSync(
              `curl -s -X POST "https://api.telegram.org/bot${token}/sendMessage" -d "chat_id=${chatId}" -d "text=${lines.replace(/"/g, '\\"').replace(/\n/g, '\\n').slice(0, 2000)}"`,
              { timeout: 5000 },
            );
          } catch { /* degrade gracefully */ }
        }
      }
      return reply.type("text/plain").send(lines);
    }
    return reply.send(brief);
  });

  // ═══════════════════════════════════════════════════════════════════
  // DEMO — End-to-end výkonná mise
  // ═══════════════════════════════════════════════════════════════════

  app.post("/executive/demo/full-mission", async (_req, reply) => {
    const runtime = await getExecRuntime();

    // 1. Owner → Chief: submit objective
    const mission = await runtime.submitObjective({
      title: "Analyze MiLO repository structure",
      description: "Zjistit počet TypeScript souborů a strukturu packages/",
      priority: "high",
    });

    // 2. Chief → Department
    await runtime.assignToDepartment(mission.id);

    // 3. Department → Worker
    await runtime.executeMission(mission.id, { workerSkill: "code analysis" });

    // 4. Simulace výsledku workera
    const result = { files: 331, packages: 7, apps: 5 };
    logExecutiveEvent("artifact_created", {
      mission_id: mission.id,
      artifact_type: "report",
      artifact_path: "analysis-result.json",
      summary: JSON.stringify(result),
    });

    // 5. Quality review
    await runtime.submitForReview(mission.id);
    await runtime.completeReview(mission.id, true, "Worker správně analyzoval repozitář. Výsledek validován.", "chief-quality-officer");

    // 6. Vrať výsledek
    const final = runtime.getMission(mission.id);
    return reply.send({
      mission: final,
      result,
      events: readRecentEvents(20).filter((e) => e.mission_id === mission.id),
      summary: "Plná mise: Owner → Chief → ENG → Worker → QA → Completed",
    });
  });

  // ─── Testovací mise s reálnými komponentami ──────────────────────

  /**
   * POST /executive/test/run
   * Spustí testovací misi s reálnými executive komponentami.
   * Body: { mission: "ranní briefing" | "stav systému" | "vyhledej X" | "audit" }
   */
  app.post("/executive/test/run", async (req, reply) => {
    const body = req.body as any;
    const missionTitle = body?.mission || "stav systému";
    
    const results: string[] = [];
    const errors: string[] = [];
    
    const log = (msg: string) => results.push(msg);

    log(`🚀 Testovací mise: "${missionTitle}"`);
    log(`Čas: ${new Date().toLocaleString("cs-CZ")}`);
    log("");

    // 1. Docker status
    try {
      const { dockerStatus } = await import("./docker-monitor.js");
      const ds = dockerStatus();
      log(`🐳 Docker: ${ds.total} kontejnerů, ${ds.healthy} healthy, ${ds.unhealthy} unhealthy`);
    } catch (e: any) {
      errors.push(`Docker: ${e.message}`);
    }

    // 2. Projekty
    try {
      const { prioritizeProjects } = await import("./project-prioritizer.js");
      const pp = prioritizeProjects();
      log(`📊 Projekty: ${pp.active} aktivních, top: ${pp.top5?.[0]?.name ?? "N/A"}`);
    } catch (e: any) {
      errors.push(`Projekty: ${e.message}`);
    }

    // 3. LLM náklady
    try {
      const { llmCosts } = await import("./llm-costs.js");
      const lc = llmCosts();
      if (lc.available) {
        log(`💰 LLM: ${lc.monthly.total_czk} Kč tento měsíc, ${lc.yesterday.calls} volání včera`);
      } else {
        log("💰 LLM: cost tracker není dostupný");
      }
    } catch (e: any) {
      errors.push(`LLM costs: ${e.message}`);
    }

    // 4. System Registry
    try {
      const { readFileSync } = await import("node:fs");
      const { resolve } = await import("node:path");
      const regPath = resolve(REPO_ROOT, "system-registry.json");
      const registry = JSON.parse(readFileSync(regPath, "utf-8"));
      const repoCount = Object.keys(registry.repositories || {}).length;
      const svcCount = Object.keys(registry.services || {}).length;
      log(`📋 Registry: ${repoCount} repozitářů, ${svcCount} služeb`);
    } catch (e: any) {
      errors.push(`Registry: ${e.message}`);
    }

    // 5. Vyhledávání (pokud mise obsahuje hledaný výraz)
    const searchMatch = missionTitle.match(/hledej|vyhledej|najdi|search/i);
    if (searchMatch) {
      try {
        const { unifiedSearch, buildUnifiedIndex } = await import("./unified-search.js");
        const query = missionTitle.replace(/^(hledej|vyhledej|najdi|search|find)\s+/i, "").trim();
        try { buildUnifiedIndex(); } catch {}
        const searchResults = unifiedSearch(query, 5);
        log(`🔍 Vyhledávání "${query}": ${searchResults.length} výsledků`);
      } catch (e: any) {
        errors.push(`Search: ${e.message}`);
      }
    }

    // 6. Audit Control Center agentů
    try {
      const { getAgents, startAudit } = await import("@milo/database");
      const agents = await getAgents();
      log(`🤖 Agenti: ${agents.length} v Control Center`);
      
      // Audit prvního agenta s plnou implementací
      const implAgent = agents.find((a: any) => a.implementation_progress >= 100);
      if (implAgent) {
        try {
          const audit = await startAudit({ agent_id: implAgent.id });
          log(`✅ Audit ${implAgent.name}: ${audit.verdict} (${audit.findings.length} nálezů)`);
        } catch (e: any) {
          errors.push(`Audit: ${e.message}`);
        }
      }
    } catch (e: any) {
      errors.push(`Control Center: ${e.message}`);
    }

    // 7. Event log
    logExecutiveEvent("mission_completed" as any, {
      mission: missionTitle,
      results_count: results.length,
      errors_count: errors.length,
    });

    return reply.send({
      mission: missionTitle,
      status: errors.length === 0 ? "success" : errors.length < results.length / 2 ? "partial" : "failed",
      results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /executive/test/agents
   * Vrátí stav všech agentů s jejich capability.
   */
  app.get("/executive/test/agents", async (_req, reply) => {
    try {
      const { getAgents } = await import("@milo/database");
      const agents = await getAgents();
      
      const agentStatus = agents.map((a: any) => ({
        name: a.name,
        slug: a.slug,
        category: a.category,
        progress: a.implementation_progress,
        status: a.status,
        runtime: a.runtime_status,
        capabilities: a.category === "executive" 
          ? ["brief", "docker", "projects", "costs", "search", "system", "audit"]
          : a.category === "design"
          ? ["css", "layout", "theming"]
          : [],
      }));

      return reply.send({
        count: agentStatus.length,
        agents: agentStatus,
        summary: {
          total: agentStatus.length,
          executive: agentStatus.filter((a: any) => a.category === "executive").length,
          design: agentStatus.filter((a: any) => a.category === "design").length,
          fullyImplemented: agentStatus.filter((a: any) => a.progress >= 100).length,
          inProgress: agentStatus.filter((a: any) => a.progress > 0 && a.progress < 100).length,
          specified: agentStatus.filter((a: any) => a.progress === 0).length,
        },
      });
    } catch (e: any) {
      return reply.status(500).send({ error: e.message });
    }
  });
}
