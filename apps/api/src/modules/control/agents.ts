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
}
