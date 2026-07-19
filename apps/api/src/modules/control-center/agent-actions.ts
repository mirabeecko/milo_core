import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { getAgentManager } from "../agents/manager.js";

/** Mapping Control Center ID → AgentManager ID */
const ID_MAP: Record<string, string> = {
  "chief-orchestrator": "chief-of-staff",
  "chief-engineer": "developer",
  "chief-architect": "developer",
  "chief-knowledge-officer": "knowledge",
  "chief-communications-officer": "communication",
  "chief-operations-officer": "automation",
  "chief-quality-officer": "automation",
  "graphics-agent": "automation",
};

function resolveAgentId(id: string): string {
  return ID_MAP[id] ?? id;
}

export async function agentActionRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  app.post<{ Params: { id: string } }>(
    "/agents/:id/start",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const { id } = request.params;
      const agentId = resolveAgentId(id);
      try {
        const manager = await getAgentManager();
        await manager.start(agentId);
        const agent = manager.getAgent(agentId);
        return reply.send({ status: "started", agentId: id, innerId: agentId, agentStatus: agent?.agent.status });
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/agents/:id/stop",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getAgentManager();
        await manager.stop(resolveAgentId(request.params.id));
        return reply.send({ status: "stopped", agentId: request.params.id });
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/agents/:id/pause",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getAgentManager();
        await manager.pause(resolveAgentId(request.params.id));
        return reply.send({ status: "paused", agentId: request.params.id });
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/agents/:id/resume",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getAgentManager();
        await manager.resume(resolveAgentId(request.params.id));
        return reply.send({ status: "resumed", agentId: request.params.id });
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/agents/:id/restart",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getAgentManager();
        await manager.restart(resolveAgentId(request.params.id));
        return reply.send({ status: "restarted", agentId: request.params.id });
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/agents/:id/lock",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      return reply.send({ status: "locked", agentId: request.params.id });
    },
  );

  app.post<{ Params: { id: string } }>(
    "/agents/:id/unlock",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      return reply.send({ status: "unlocked", agentId: request.params.id });
    },
  );

  app.post<{ Params: { id: string }; Body: { title: string; description?: string; priority?: string } }>(
    "/agents/:id/tasks",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Body: { title: string; description?: string; priority?: string } }>, reply) => {
      const { id } = request.params;
      const { title, description, priority } = request.body;
      try {
        const manager = await getAgentManager();
        const agent = manager.getAgent(resolveAgentId(id));
        if (!agent) return reply.status(404).send({ error: "Agent nenalezen" });
        const task = await manager.delegate({ title, description, priority: priority || "normal", ownerId: agent.agent.id });
        return reply.send({ task, agentId: id });
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );

  app.get<{ Params: { id: string } }>(
    "/agents/:id/tasks",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const { id } = request.params;
      try {
        const manager = await getAgentManager();
        const tasks = await manager.getTasks({ ownerId: resolveAgentId(id) });
        return reply.send({ tasks, agentId: id });
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );

  app.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    "/agents/:id/logs",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Querystring: { limit?: string } }>, reply) => {
      const { id } = request.params;
      try {
        const manager = await getAgentManager();
        const agent = manager.getAgent(resolveAgentId(id));
        if (!agent) return reply.status(404).send({ error: "Agent nenalezen" });
        const logs = await manager.getAgentLogs(agent.agent.id, { limit: request.query.limit ? Number(request.query.limit) : 20 });
        return reply.send({ logs, agentId: id });
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    },
  );
}
