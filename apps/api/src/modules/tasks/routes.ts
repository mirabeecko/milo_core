import { FastifyInstance, FastifyPluginOptions } from "fastify";
import type { AgentTask } from "@milo/shared";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { getAgentManager } from "../agents/manager.js";

export async function tasksRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const manager = await getAgentManager();

  app.get<{ Querystring: { status?: string; ownerId?: string; limit?: string } }>(
    "/",
    { preHandler: authMiddleware },
    async (
      request: AuthenticatedRequest<{ Querystring: { status?: string; ownerId?: string; limit?: string } }>,
      reply,
    ) => {
      const tasks = await manager.getTasks({
        status: request.query.status,
        ownerId: request.query.ownerId,
        limit: request.query.limit ? Number(request.query.limit) : undefined,
      });
      return reply.send(tasks);
    },
  );

  app.post<{ Body: Omit<AgentTask, "id" | "createdAt"> }>(
    "/",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Body: Omit<AgentTask, "id" | "createdAt"> }>, reply) => {
      try {
        process.stderr.write(`[TASKS] delegate CALLED: ${JSON.stringify(request.body)}\n`);
        const task = await manager.delegate(request.body);
        return reply.status(201).send(task);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(409).send({ error: message });
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/cancel",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      await manager.cancelTask(request.params.id);
      return reply.send({ status: "cancelled" });
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/retry",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      await manager.retry(request.params.id);
      return reply.send({ status: "retried" });
    },
  );

  app.patch<{ Params: { id: string }; Body: Partial<AgentTask> }>(
    "/:id",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Body: Partial<AgentTask> }>, reply) => {
      try {
        const task = await manager.updateTask(request.params.id, request.body);
        return reply.send(task);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(404).send({ error: message });
      }
    },
  );

  app.post<{ Params: { id: string }; Body: { result?: string } }>(
    "/:id/complete",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Body: { result?: string } }>, reply) => {
      try {
        const task = await manager.completeTask(request.params.id, request.body?.result);
        return reply.send(task);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(404).send({ error: message });
      }
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      try {
        await manager.deleteTask(request.params.id);
        return reply.send({ status: "deleted" });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(404).send({ error: message });
      }
    },
  );
}
