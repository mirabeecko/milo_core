/**
 * Control Center — Agents API
 */
import type { FastifyInstance } from "fastify";

export async function controlAgentsRoutes(app: FastifyInstance) {

  app.get("/executive/control/agents", async (req, reply) => {
    const { getAgents } = await import("@milo/database");
    const q = req.query as any;
    const agents = await getAgents(q);
    return reply.send({ count: agents.length, agents });
  });

  app.post("/executive/control/agents", async (req, reply) => {
    const { createAgent } = await import("@milo/database");
    const input = req.body as any;
    if (!input.slug || !input.name) return reply.status(400).send({ error: "slug and name required" });
    const agent = await createAgent(input);
    return reply.status(201).send(agent);
  });

  app.get("/executive/control/agents/:id", async (req, reply) => {
    const { getAgentById } = await import("@milo/database");
    try {
      const agent = await getAgentById((req.params as any).id);
      return reply.send(agent);
    } catch { return reply.status(404).send({ error: "Not found" }); }
  });

  app.patch("/executive/control/agents/:id", async (req, reply) => {
    const { updateAgent } = await import("@milo/database");
    try {
      const agent = await updateAgent((req.params as any).id, req.body as any);
      return reply.send(agent);
    } catch { return reply.status(404).send({ error: "Update failed" }); }
  });

  app.put("/executive/control/agents/:id", async (req, reply) => {
    const { updateAgent } = await import("@milo/database");
    try {
      const agent = await updateAgent((req.params as any).id, req.body as any);
      return reply.send(agent);
    } catch { return reply.status(404).send({ error: "Not found" }); }
  });

  app.delete("/executive/control/agents/:id", async (req, reply) => {
    const { archiveAgent } = await import("@milo/database");
    await archiveAgent((req.params as any).id);
    return reply.send({ archived: true });
  });

  app.get("/executive/control/agents/:id/versions", async (req, reply) => {
    const { getAgentVersions } = await import("@milo/database");
    const versions = await getAgentVersions((req.params as any).id);
    return reply.send({ count: versions.length, versions });
  });

  app.post("/executive/control/agents/:id/versions", async (req, reply) => {
    const { createAgentVersion, updateAgent } = await import("@milo/database");
    const body = req.body as any;
    if (!body.specification) return reply.status(400).send({ error: "specification required" });
    const version = await createAgentVersion({ agent_id: (req.params as any).id, ...body });
    if (body.status === "ready") await updateAgent((req.params as any).id, { active_version_id: version.id });
    return reply.status(201).send(version);
  });

  // ─── Phase 4: Diff ──────────────────────────────────────────────────

  app.post("/executive/control/agents/:id/diff", async (req, reply) => {
    const { computeDiff } = await import("@milo/database");
    const q = req.query as any;
    const from = parseInt(q.from, 10);
    const to = parseInt(q.to, 10);
    if (!from || !to) return reply.status(400).send({ error: "from and to query params required" });
    try {
      const diff = await computeDiff((req.params as any).id, from, to);
      return reply.send(diff);
    } catch (e: any) {
      return reply.status(404).send({ error: e.message });
    }
  });

  // ─── Phase 4: Impact analysis ──────────────────────────────────────

  app.post("/executive/control/agents/:id/impact-analysis", async (req, reply) => {
    const { computeImpact } = await import("@milo/database");
    try {
      const impact = await computeImpact((req.params as any).id);
      return reply.send(impact);
    } catch (e: any) {
      return reply.status(404).send({ error: e.message });
    }
  });

  // ─── Phase 5: Developer prompt ──────────────────────────────────────

  app.post("/executive/control/agents/:id/developer-prompt", async (req, reply) => {
    const { generateDeveloperPrompt } = await import("@milo/database");
    try {
      const prompt = await generateDeveloperPrompt((req.params as any).id);
      return reply.send(prompt);
    } catch (e: any) {
      return reply.status(404).send({ error: e.message });
    }
  });

  // ─── Phase 3: Progress ──────────────────────────────────────────────

  app.get("/executive/control/agents/:id/progress", async (req, reply) => {
    const { computeProgress } = await import("@milo/database");
    try {
      const progress = await computeProgress((req.params as any).id);
      return reply.send(progress);
    } catch (e: any) {
      return reply.status(404).send({ error: e.message });
    }
  });

  // ─── Phase 6: Audit ─────────────────────────────────────────────────

  app.post("/executive/control/audit/start", async (req, reply) => {
    const { startAudit } = await import("@milo/database");
    const body = req.body as any;
    if (!body.agent_id) return reply.status(400).send({ error: "agent_id required" });
    try {
      const audit = await startAudit(body);
      return reply.status(201).send(audit);
    } catch (e: any) {
      return reply.status(404).send({ error: e.message });
    }
  });

  app.get("/executive/control/audits", async (req, reply) => {
    const { getAudits } = await import("@milo/database");
    const q = req.query as any;
    const audits = await getAudits(q.agent_id);
    return reply.send({ count: audits.length, audits });
  });

  // ─── Phase 5: Missions ──────────────────────────────────────────────

  app.get("/executive/control/missions", async (req, reply) => {
    const { getMissions } = await import("@milo/database");
    const q = req.query as any;
    const missions = await getMissions(q);
    return reply.send({ count: missions.length, missions });
  });

  app.post("/executive/control/missions", async (req, reply) => {
    const { createMission } = await import("@milo/database");
    const input = req.body as any;
    if (!input.title || !input.agent_id) return reply.status(400).send({ error: "title and agent_id required" });
    const mission = await createMission(input);
    return reply.status(201).send(mission);
  });

  app.post("/executive/control/missions/:id/start", async (req, reply) => {
    const { startMission } = await import("@milo/database");
    try {
      const mission = await startMission((req.params as any).id);
      return reply.send(mission);
    } catch (e: any) {
      return reply.status(404).send({ error: e.message });
    }
  });

  app.patch("/executive/control/missions/:id", async (req, reply) => {
    const { updateMission } = await import("@milo/database");
    try {
      const mission = await updateMission((req.params as any).id, req.body as any);
      return reply.send(mission);
    } catch (e: any) {
      return reply.status(404).send({ error: e.message });
    }
  });

  // ─── Phase 6: Deployments ───────────────────────────────────────────

  app.get("/executive/control/deployments", async (req, reply) => {
    const { getDeployments } = await import("@milo/database");
    const q = req.query as any;
    const deployments = await getDeployments(q.agent_id);
    return reply.send({ count: deployments.length, deployments });
  });

  app.post("/executive/control/deployments", async (req, reply) => {
    const { createDeployment } = await import("@milo/database");
    const input = req.body as any;
    if (!input.agent_id || !input.environment) return reply.status(400).send({ error: "agent_id and environment required" });
    const deployment = await createDeployment(input);
    return reply.status(201).send(deployment);
  });
}
