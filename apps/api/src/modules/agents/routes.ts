import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { CalendarAgent, SecretaryAgent, DeveloperAgent } from "@milo/agents";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import type { AgentManager } from "@milo/agents";
import { getAgentManager } from "./manager.js";

let _managerPromise: Promise<AgentManager> | null = null;

async function getManager(): Promise<AgentManager> {
  if (!_managerPromise) {
    _managerPromise = getAgentManager();
  }
  return _managerPromise;
}

export async function agentsRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  app.get(
    "/",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      try {
        const manager = await getManager();
        const agents = manager.listAgents().map((entity) => ({
          ...entity.agent,
          state: entity.getState(),
        }));
        return reply.send(agents);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(503).send({ error: "Agent service unavailable", message });
      }
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getManager();
        const entity = manager.getAgent(request.params.id);
        if (!entity) {
          return reply.status(404).send({ error: "Agent not found" });
        }
        return reply.send({ ...entity.agent, state: entity.getState() });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(503).send({ error: "Agent service unavailable", message });
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/start",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getManager();
        await manager.start(request.params.id);
        return reply.send({ status: "started" });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(409).send({ error: message });
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/stop",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getManager();
        await manager.stop(request.params.id);
        return reply.send({ status: "stopped" });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(409).send({ error: message });
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/pause",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getManager();
        await manager.pause(request.params.id);
        return reply.send({ status: "paused" });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(409).send({ error: message });
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/resume",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getManager();
        await manager.resume(request.params.id);
        return reply.send({ status: "resumed" });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(409).send({ error: message });
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/restart",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getManager();
        await manager.restart(request.params.id);
        return reply.send({ status: "restarted" });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(409).send({ error: message });
      }
    },
  );

  app.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    "/:id/logs",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Querystring: { limit?: string } }>, reply) => {
      try {
        const manager = await getManager();
        const limit = request.query.limit ? Number(request.query.limit) : undefined;
        const logs = await manager.getLogs(request.params.id, limit);
        return reply.send(logs);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(503).send({ error: "Agent service unavailable", message });
      }
    },
  );

  app.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    "/:id/metrics",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Querystring: { limit?: string } }>, reply) => {
      try {
        const manager = await getManager();
        const limit = request.query.limit ? Number(request.query.limit) : undefined;
        const metrics = await manager.getMetrics(request.params.id, limit);
        return reply.send(metrics);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(503).send({ error: "Agent service unavailable", message });
      }
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id/memory",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getManager();
        const memory = await manager.getMemory(request.params.id);
        return reply.send(memory);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(503).send({ error: "Agent service unavailable", message });
      }
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id/explanation",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getManager();
        const explanation = await manager.getExplanation(request.params.id);
        return reply.send(explanation);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(503).send({ error: "Agent service unavailable", message });
      }
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id/tasks/history",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getManager();
        const entity = manager.getAgent(request.params.id);
        if (!entity) {
          return reply.status(404).send({ error: "Agent not found" });
        }
        return reply.send(entity.getTaskHistory());
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(503).send({ error: "Agent service unavailable", message });
      }
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id/tasks/queue",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getManager();
        const entity = manager.getAgent(request.params.id);
        if (!entity) {
          return reply.status(404).send({ error: "Agent not found" });
        }
        return reply.send(entity.getPendingQueue());
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(503).send({ error: "Agent service unavailable", message });
      }
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id/calendar/state",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getManager();
        const entity = manager.getAgent(request.params.id);
        if (!entity) {
          return reply.status(404).send({ error: "Agent not found" });
        }
        if (!(entity instanceof CalendarAgent)) {
          return reply.status(400).send({ error: "Agent is not a calendar agent" });
        }
        return reply.send(entity.getCalendarState());
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(503).send({ error: "Agent service unavailable", message });
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/calendar/sync",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getManager();
        const entity = manager.getAgent(request.params.id);
        if (!entity) {
          return reply.status(404).send({ error: "Agent not found" });
        }
        if (!(entity instanceof CalendarAgent)) {
          return reply.status(400).send({ error: "Agent is not a calendar agent" });
        }
        await entity.syncCalendar();
        return reply.send({ status: "synced", state: entity.getCalendarState() });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(503).send({ error: "Agent service unavailable", message });
      }
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id/secretary/state",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getManager();
        const entity = manager.getAgent(request.params.id);
        if (!entity) {
          return reply.status(404).send({ error: "Agent not found" });
        }
        if (!(entity instanceof SecretaryAgent)) {
          return reply.status(400).send({ error: "Agent is not a secretary agent" });
        }
        return reply.send(entity.getSecretaryState());
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(503).send({ error: "Agent service unavailable", message });
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/secretary/sync",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getManager();
        const entity = manager.getAgent(request.params.id);
        if (!entity) {
          return reply.status(404).send({ error: "Agent not found" });
        }
        if (!(entity instanceof SecretaryAgent)) {
          return reply.status(400).send({ error: "Agent is not a secretary agent" });
        }
        await entity.syncSecretary();
        return reply.send({ status: "synced", state: entity.getSecretaryState() });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(503).send({ error: "Agent service unavailable", message });
      }
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id/developer/state",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getManager();
        const entity = manager.getAgent(request.params.id);
        if (!entity) {
          return reply.status(404).send({ error: "Agent not found" });
        }
        if (!(entity instanceof DeveloperAgent)) {
          return reply.status(400).send({ error: "Agent is not a developer agent" });
        }
        return reply.send(entity.getDeveloperState());
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(503).send({ error: "Agent service unavailable", message });
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/developer/sync",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        const manager = await getManager();
        const entity = manager.getAgent(request.params.id);
        if (!entity) {
          return reply.status(404).send({ error: "Agent not found" });
        }
        if (!(entity instanceof DeveloperAgent)) {
          return reply.status(400).send({ error: "Agent is not a developer agent" });
        }
        await entity.syncDeveloperState();
        return reply.send({ status: "synced", state: entity.getDeveloperState() });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(503).send({ error: "Agent service unavailable", message });
      }
    },
  );

  app.post<{ Params: { id: string }; Body: { toolId: string; input?: Record<string, unknown> } }>(
    "/:id/tools/execute",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Body: { toolId: string; input?: Record<string, unknown> } }>, reply) => {
      try {
        const manager = await getManager();
        const { toolId, input = {} } = request.body;
        const result = await manager.executeTool(request.params.id, toolId, input);
        return reply.send({ toolId, result });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(400).send({ error: message });
      }
    },
  );
}
