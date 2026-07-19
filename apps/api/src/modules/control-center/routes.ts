import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { controlCenterStore } from "./store.js";
import { seedControlCenter } from "./seed.js";
import { agentActionRoutes } from "./agent-actions.js";
import { getAgentManager } from "../agents/manager.js";
import { readFileSync, existsSync } from "node:fs";

let seeded = false;

function ensureSeeded(): void {
  if (!seeded) {
    seedControlCenter();
    seeded = true;
  }
}

export async function controlCenterRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  ensureSeeded();

  await app.register(agentActionRoutes);

  // ─── HOME DASHBOARD ─────────────────────────────────────────

  app.get(
    "/",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      const agents = controlCenterStore.getAgents();
      const useCases = controlCenterStore.getUseCases();
      const devTasks = controlCenterStore.getDevTasks();
      const missions = controlCenterStore.getMissions();
      const blockedTasks = devTasks.filter((t) => t.status === "blocked").length;
      const completedUc = useCases.filter((u) => u.implementationStatus === "deployed" || u.implementationStatus === "operational");
      const inProgressUc = useCases.filter((u) => u.implementationStatus === "partial" || u.implementationStatus === "implemented");

      return reply.send({
        overview: {
          totalAgents: agents.length,
          activeAgents: agents.filter((a) => a.status !== "draft" && a.status !== "archived").length,
          totalUseCases: useCases.length,
          implementedUseCases: completedUc.length,
          inProgressUseCases: inProgressUc.length,
          blockedTasks,
          pendingApprovals: 0,
          failedRuns: 0,
          overallReadiness: Math.round(
            agents.reduce((sum, a) => sum + a.progressPercent, 0) / Math.max(1, agents.length),
          ),
        },
        activeMissions: missions.filter((m) => m.status === "active" || m.status === "running").slice(0, 5),
        recentChanges: controlCenterStore.getActivityLog({ limit: 10 }),
        quickActions: [
          { id: "create-agent", label: "Vytvořit agenta" },
          { id: "add-use-case", label: "Přidat use case" },
          { id: "run-analysis", label: "Spustit dopadovou analýzu" },
          { id: "run-tests", label: "Spustit testy" },
          { id: "run-audit", label: "Spustit audit" },
        ],
      });
    },
  );

  // ─── AGENTS (Spec) ──────────────────────────────────────────

  app.get(
    "/agents",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const { status, category, priority } = request.query as Record<string, string>;
      let agents = controlCenterStore.getAgents();
      if (status) agents = agents.filter((a) => a.lifecycleStatus === status || a.status === status);
      if (category) agents = agents.filter((a) => a.category === category);
      if (priority) agents = agents.filter((a) => a.priority === priority);
      return reply.send(agents);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/agents/live",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const manager = await getAgentManager();
      const specs = controlCenterStore.getAgents();
      const live = specs.map((spec) => {
        const runtime = manager.getAgent(spec.id);
        return {
          id: spec.id,
          name: spec.name,
          category: spec.category,
          status: runtime?.status ?? "offline",
          currentTask: runtime?.currentTask ?? null,
          pendingTasks: runtime?.pendingQueue?.length ?? 0,
          completedTasks: runtime?.completedTasks ?? 0,
          failedTasks: runtime?.failedTasks ?? 0,
          progress: spec.progressPercent,
          implementationStatus: spec.implementationStatus,
        };
      });
      return reply.send({ agents: live, total: live.length, updatedAt: new Date().toISOString() });
    },
  );

  app.get<{ Params: { id: string } }>(
    "/agents/:id",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const agent = controlCenterStore.getAgentWithRelations(request.params.id);
      if (!agent) return reply.status(404).send({ error: "Agent not found" });
      return reply.send(agent);
    },
  );

  app.post<{ Body: Record<string, unknown> }>(
    "/agents",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Body: Record<string, unknown> }>, reply) => {
      const agent = controlCenterStore.upsertAgent(request.body as any);
      controlCenterStore.logActivity({
        actor: request.user?.email ?? "system",
        action: "agent.created",
        entityType: "agent",
        entityId: agent.id,
        oldValue: null,
        newValue: agent,
        missionId: null,
        ipAddress: request.ip,
        result: "success",
      });
      return reply.status(201).send(agent);
    },
  );

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/agents/:id",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Body: Record<string, unknown> }>, reply) => {
      const existing = controlCenterStore.getAgent(request.params.id);
      if (!existing) return reply.status(404).send({ error: "Agent not found" });
      const agent = controlCenterStore.upsertAgent({ ...existing, ...request.body as any, id: existing.id });
      controlCenterStore.logActivity({
        actor: request.user?.email ?? "system",
        action: "agent.updated",
        entityType: "agent",
        entityId: agent.id,
        oldValue: existing,
        newValue: agent,
        missionId: null,
        ipAddress: request.ip,
        result: "success",
      });
      return reply.send(agent);
    },
  );

  // ─── AGENT VERSIONS ─────────────────────────────────────────

  app.get<{ Params: { id: string } }>(
    "/agents/:id/versions",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      return reply.send(controlCenterStore.getAgentVersions(request.params.id));
    },
  );

  app.post<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/agents/:id/versions",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Body: Record<string, unknown> }>, reply) => {
      const existing = controlCenterStore.getAgentVersions(request.params.id);
      const versionNumber = (existing[0]?.versionNumber ?? 0) + 1;
      const version = controlCenterStore.createAgentVersion({
        agentId: request.params.id,
        versionNumber,
        versionLabel: (request.body as any).versionLabel ?? `v${versionNumber}`,
        specification: (request.body as any).specification ?? {},
        changeSummary: (request.body as any).changeSummary ?? null,
        changeReason: (request.body as any).changeReason ?? null,
        createdBy: request.user?.email ?? "system",
        parentVersionId: (request.body as any).parentVersionId ?? null,
        status: "draft",
        approvedAt: null,
        deployedAt: null,
      });
      return reply.status(201).send(version);
    },
  );

  // ─── USE CASES ──────────────────────────────────────────────

  app.get<{ Params: { id: string } }>(
    "/agents/:id/use-cases",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      return reply.send(controlCenterStore.getUseCases(request.params.id));
    },
  );

  app.post<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/agents/:id/use-cases",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Body: Record<string, unknown> }>, reply) => {
      const uc = controlCenterStore.upsertUseCase({
        ...(request.body as any),
        agentId: request.params.id,
        id: (request.body as any).id ?? `uc-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return reply.status(201).send(uc);
    },
  );

  // ─── READINESS ──────────────────────────────────────────────

  app.get<{ Params: { id: string } }>(
    "/agents/:id/readiness",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const matrix = controlCenterStore.calculateAgentReadiness(request.params.id);
      const tasks = controlCenterStore.getDevTasks({ agentId: request.params.id });
      const blockedTasks = tasks.filter((t) => t.status === "blocked");
      const openTasks = tasks.filter(
        (t) => t.status !== "completed" && t.status !== "verified" && t.status !== "obsolete" && t.status !== "cancelled",
      );

      return reply.send({
        matrix,
        openTasks: openTasks.length,
        blockedTasks: blockedTasks.length,
        totalTasks: tasks.length,
        reasons: blockedTasks.map((t) => t.blockedReason).filter(Boolean),
      });
    },
  );

  // ─── USE CASES (global) ─────────────────────────────────────

  app.get(
    "/use-cases",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const { agent_id, status } = request.query as Record<string, string>;
      let useCases = controlCenterStore.getUseCases();
      if (agent_id) useCases = useCases.filter((u) => u.agentId === agent_id);
      if (status) useCases = useCases.filter((u) => u.status === status);
      return reply.send(useCases);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/use-cases/:id",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const uc = controlCenterStore.getUseCaseWithRelations(request.params.id);
      if (!uc) return reply.status(404).send({ error: "Use case not found" });
      return reply.send(uc);
    },
  );

  app.post<{ Body: Record<string, unknown> }>(
    "/use-cases",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Body: Record<string, unknown> }>, reply) => {
      const uc = controlCenterStore.upsertUseCase({
        ...(request.body as any),
        id: (request.body as any).id ?? `uc-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return reply.status(201).send(uc);
    },
  );

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/use-cases/:id",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Body: Record<string, unknown> }>, reply) => {
      const existing = controlCenterStore.getUseCase(request.params.id);
      if (!existing) return reply.status(404).send({ error: "Use case not found" });
      const uc = controlCenterStore.upsertUseCase({ ...existing, ...request.body as any, id: existing.id });
      return reply.send(uc);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/use-cases/:id/versions",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      return reply.send(controlCenterStore.getUseCaseVersions(request.params.id));
    },
  );

  app.post<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/use-cases/:id/versions",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Body: Record<string, unknown> }>, reply) => {
      const existing = controlCenterStore.getUseCaseVersions(request.params.id);
      const versionNumber = (existing[0]?.versionNumber ?? 0) + 1;
      const version = controlCenterStore.createUseCaseVersion({
        useCaseId: request.params.id,
        versionNumber,
        versionLabel: (request.body as any).versionLabel ?? `v${versionNumber}`,
        purpose: (request.body as any).purpose ?? null,
        triggerDescription: (request.body as any).triggerDescription ?? null,
        inputs: (request.body as any).inputs ?? [],
        preconditions: (request.body as any).preconditions ?? [],
        workflowSteps: (request.body as any).workflowSteps ?? [],
        decisionRules: (request.body as any).decisionRules ?? [],
        tools: (request.body as any).tools ?? [],
        integrations: (request.body as any).integrations ?? [],
        outputs: (request.body as any).outputs ?? [],
        persistenceRules: (request.body as any).persistenceRules ?? null,
        approvalRules: (request.body as any).approvalRules ?? {},
        securityRules: (request.body as any).securityRules ?? {},
        failureStates: (request.body as any).failureStates ?? [],
        fallbackBehavior: (request.body as any).fallbackBehavior ?? null,
        testScenarios: (request.body as any).testScenarios ?? [],
        definitionOfDone: (request.body as any).definitionOfDone ?? [],
        observabilityRequirements: (request.body as any).observabilityRequirements ?? {},
        specification: (request.body as any).specification ?? {},
        changeSummary: (request.body as any).changeSummary ?? null,
        createdBy: request.user?.email ?? "system",
        status: "draft",
      });
      return reply.status(201).send(version);
    },
  );

  // ─── CAPABILITIES ──────────────────────────────────────────

  app.get(
    "/capabilities",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      return reply.send(controlCenterStore.getCapabilities());
    },
  );

  app.get<{ Params: { id: string } }>(
    "/capabilities/:id",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const cap = controlCenterStore.getCapability(request.params.id);
      if (!cap) return reply.status(404).send({ error: "Capability not found" });
      return reply.send(cap);
    },
  );

  // ─── TOOLS ──────────────────────────────────────────────────

  app.get(
    "/tools",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      return reply.send(controlCenterStore.getTools());
    },
  );

  // ─── INTEGRATIONS ──────────────────────────────────────────

  app.get(
    "/integrations",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      return reply.send(controlCenterStore.getIntegrations());
    },
  );

  // ─── DEVELOPMENT TASKS ─────────────────────────────────────

  app.get(
    "/development-tasks",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const { agent_id, use_case_id, status } = request.query as Record<string, string>;
      return reply.send(
        controlCenterStore.getDevTasks({ agentId: agent_id, useCaseId: use_case_id, status }),
      );
    },
  );

  app.get<{ Params: { id: string } }>(
    "/development-tasks/:id",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const task = controlCenterStore.getDevTask(request.params.id);
      if (!task) return reply.status(404).send({ error: "Development task not found" });
      return reply.send(task);
    },
  );

  app.post<{ Body: Record<string, unknown> }>(
    "/development-tasks",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Body: Record<string, unknown> }>, reply) => {
      const task = controlCenterStore.createDevTask(request.body as any);
      return reply.status(201).send(task);
    },
  );

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/development-tasks/:id",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Body: Record<string, unknown> }>, reply) => {
      const task = controlCenterStore.updateDevTask(request.params.id, request.body as any);
      return reply.send(task);
    },
  );

  // ─── MISSIONS ──────────────────────────────────────────────

  app.get(
    "/missions",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const { agent_id, status } = request.query as Record<string, string>;
      return reply.send(controlCenterStore.getMissions({ agentId: agent_id, status }));
    },
  );

  app.get<{ Params: { id: string } }>(
    "/missions/:id",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const mission = controlCenterStore.getMission(request.params.id);
      if (!mission) return reply.status(404).send({ error: "Mission not found" });
      return reply.send(mission);
    },
  );

  app.post<{ Body: Record<string, unknown> }>(
    "/missions",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Body: Record<string, unknown> }>, reply) => {
      const mission = controlCenterStore.createMission(request.body as any);
      return reply.status(201).send(mission);
    },
  );

  // ─── ACTIVITY LOG ──────────────────────────────────────────

  app.get(
    "/activity-log",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const { entity_type, entity_id, limit } = request.query as Record<string, string>;
      return reply.send(
        controlCenterStore.getActivityLog({
          entityType: entity_type,
          entityId: entity_id,
          limit: limit ? Number(limit) : 50,
        }),
      );
    },
  );

  // ─── SPEC DIFF ─────────────────────────────────────────────

  app.post<{ Body: { old: Record<string, unknown>; new: Record<string, unknown> } }>(
    "/spec/diff",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Body: { old: Record<string, unknown>; new: Record<string, unknown> } }>, reply) => {
      const { old: oldSpec, new: newSpec } = request.body;
      return reply.send(controlCenterStore.computeSpecDiff(oldSpec, newSpec));
    },
  );

  // ─── IMPACT ANALYSIS ───────────────────────────────────────

  app.post<{ Params: { id: string }; Body: { diff: any } }>(
    "/agents/:id/impact-analysis",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Body: { diff: any } }>, reply) => {
      const result = controlCenterStore.computeImpactAnalysis(request.params.id, request.body.diff);
      return reply.send(result);
    },
  );

  // ─── COMPLETE BY SPECIFICATION ─────────────────────────────

  app.post<{ Params: { id: string }; Body: { scope?: string; useCaseIds?: string[]; autoDeploy?: boolean } }>(
    "/agents/:id/complete",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Body: { scope?: string; useCaseIds?: string[]; autoDeploy?: boolean } }>, reply) => {
      const agent = controlCenterStore.getAgent(request.params.id);
      if (!agent) return reply.status(404).send({ error: "Agent not found" });

      const { scope = "full", useCaseIds, autoDeploy = false } = request.body;

      const tasks = controlCenterStore.getDevTasks({ agentId: request.params.id });
      const openTasks = tasks.filter(
        (t) => t.status !== "completed" && t.status !== "verified" && t.status !== "obsolete" && t.status !== "cancelled",
      );

      const mission = controlCenterStore.createMission({
        title: `Dokončení: ${agent.name}`,
        description: scope === "full"
          ? `Kompletní dokončení agenta podle aktuální specifikace. ${openTasks.length} otevřených úkolů.`
          : `Dokončení vybraných use cases.`,
        missionType: "specification_alignment",
        agentId: agent.id,
        specificationVersionId: agent.activeVersionId,
        status: "queued",
        priority: agent.priority,
        worker: "developer-agent",
        reviewer: "auditor-agent",
        approvalMode: autoDeploy ? "auto" : "high_risk_only",
      });

      controlCenterStore.logActivity({
        actor: request.user?.email ?? "system",
        action: "mission.created",
        entityType: "mission",
        entityId: mission.id,
        oldValue: null,
        newValue: { scope, openTasks: openTasks.length },
        missionId: mission.id,
        ipAddress: request.ip,
        result: "success",
      });

      return reply.status(201).send({
        mission,
        summary: {
          agent: agent.name,
          scope,
          openTasks: openTasks.length,
          readiness: controlCenterStore.calculateAgentReadiness(request.params.id),
          nextSteps: [
            "Mission created in queue",
            "Developer will inspect current implementation",
            "Developer will implement changes",
            "Auditor will verify",
            "Tests will run",
            "Ready for deployment review",
          ],
        },
      });
    },
    );

    // ─── TESTER BOSS REPORT ──────────────────────────────────

    app.get(
    "/reports/tester-boss",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
    const path = "/tmp/tester-boss-report.json";
    if (!existsSync(path)) {
    return reply.status(404).send({ error: "Report not found. Run tester first." });
    }
    const data = JSON.parse(readFileSync(path, "utf-8"));
    return reply.send(data);
    },
    );

    // ─── AGENT TAGS ──────────────────────────────────────────

    app.patch<{ Params: { id: string }; Body: { tags: string[] } }>(
    "/agents/:id/tags",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Body: { tags: string[] } }>, reply) => {
    const { tags } = request.body;
    if (!Array.isArray(tags)) {
    return reply.status(400).send({ error: "tags must be an array of strings" });
    }
    const updated = controlCenterStore.updateAgentTags(request.params.id, tags);
    if (!updated) return reply.status(404).send({ error: "Agent not found" });
    return reply.send(updated);
    },
    );
  }
