import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { CalendarAgent, CommunicationAgent, DeveloperAgent } from "@milo/agents";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { getAgentManager } from "./manager.js";

export async function agentsRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const manager = await getAgentManager();

  app.get(
    "/",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      const agents = manager.listAgents().map((entity) => ({
        ...entity.agent,
        state: entity.getState(),
      }));
      return reply.send(agents);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const entity = manager.getAgent(request.params.id);
      if (!entity) {
        return reply.status(404).send({ error: "Agent not found" });
      }
      return reply.send({ ...entity.agent, state: entity.getState() });
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/start",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      await manager.start(request.params.id);
      return reply.send({ status: "started" });
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/stop",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      await manager.stop(request.params.id);
      return reply.send({ status: "stopped" });
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/pause",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      await manager.pause(request.params.id);
      return reply.send({ status: "paused" });
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/resume",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      await manager.resume(request.params.id);
      return reply.send({ status: "resumed" });
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/restart",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      await manager.restart(request.params.id);
      return reply.send({ status: "restarted" });
    },
  );

  app.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    "/:id/logs",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Querystring: { limit?: string } }>, reply) => {
      const limit = request.query.limit ? Number(request.query.limit) : undefined;
      const logs = await manager.getLogs(request.params.id, limit);
      return reply.send(logs);
    },
  );

  app.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    "/:id/metrics",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Querystring: { limit?: string } }>, reply) => {
      const limit = request.query.limit ? Number(request.query.limit) : undefined;
      const metrics = await manager.getMetrics(request.params.id, limit);
      return reply.send(metrics);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id/memory",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const memory = await manager.getMemory(request.params.id);
      return reply.send(memory);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id/explanation",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const explanation = await manager.getExplanation(request.params.id);
      return reply.send(explanation);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id/tasks/history",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const entity = manager.getAgent(request.params.id);
      if (!entity) {
        return reply.status(404).send({ error: "Agent not found" });
      }
      return reply.send(entity.getTaskHistory());
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id/tasks/queue",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const entity = manager.getAgent(request.params.id);
      if (!entity) {
        return reply.status(404).send({ error: "Agent not found" });
      }
      return reply.send(entity.getPendingQueue());
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id/calendar/state",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const entity = manager.getAgent(request.params.id);
      if (!entity) {
        return reply.status(404).send({ error: "Agent not found" });
      }
      if (!(entity instanceof CalendarAgent)) {
        return reply.status(400).send({ error: "Agent is not a calendar agent" });
      }
      return reply.send(entity.getCalendarState());
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/calendar/sync",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const entity = manager.getAgent(request.params.id);
      if (!entity) {
        return reply.status(404).send({ error: "Agent not found" });
      }
      if (!(entity instanceof CalendarAgent)) {
        return reply.status(400).send({ error: "Agent is not a calendar agent" });
      }
      await entity.syncCalendar();
      return reply.send({ status: "synced", state: entity.getCalendarState() });
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id/communication/state",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const entity = manager.getAgent(request.params.id);
      if (!entity) {
        return reply.status(404).send({ error: "Agent not found" });
      }
      if (!(entity instanceof CommunicationAgent)) {
        return reply.status(400).send({ error: "Agent is not a communication agent" });
      }
      return reply.send(entity.getCommunicationState());
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/communication/sync",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const entity = manager.getAgent(request.params.id);
      if (!entity) {
        return reply.status(404).send({ error: "Agent not found" });
      }
      if (!(entity instanceof CommunicationAgent)) {
        return reply.status(400).send({ error: "Agent is not a communication agent" });
      }
      await entity.syncCommunication();
      return reply.send({ status: "synced", state: entity.getCommunicationState() });
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id/developer/state",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const entity = manager.getAgent(request.params.id);
      if (!entity) {
        return reply.status(404).send({ error: "Agent not found" });
      }
      if (!(entity instanceof DeveloperAgent)) {
        return reply.status(400).send({ error: "Agent is not a developer agent" });
      }
      return reply.send(entity.getDeveloperState());
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/developer/sync",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const entity = manager.getAgent(request.params.id);
      if (!entity) {
        return reply.status(404).send({ error: "Agent not found" });
      }
      if (!(entity instanceof DeveloperAgent)) {
        return reply.status(400).send({ error: "Agent is not a developer agent" });
      }
      await entity.syncDeveloperState();
      return reply.send({ status: "synced", state: entity.getDeveloperState() });
    },
  );

  app.post<{ Params: { id: string }; Body: { toolId: string; input?: Record<string, unknown> } }>(
    "/:id/tools/execute",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Body: { toolId: string; input?: Record<string, unknown> } }>, reply) => {
      try {
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
