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
    const events = readRecentEvents(500).filter((e) => e.event_type === "risk_raised");
    return reply.send({ count: events.length, risks: events });
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
  // EXECUTIVE BRIEF
  // ═══════════════════════════════════════════════════════════════════

  app.get("/executive/brief", async (_req, reply) => {
    const runtime = await getExecRuntime();
    const brief = generateExecutiveBrief(REPO_ROOT, runtime.getManager(), runtime.listMissions());
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
}
