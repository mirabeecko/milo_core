import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import type { CreateMissionInput } from "@milo/shared";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { getAgentManager } from "../agents/manager.js";

const createMissionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["critical", "high", "normal", "low"]).optional(),
});

export async function missionsRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const manager = await getAgentManager();

  app.get<{ Querystring: { status?: string; limit?: string } }>(
    "/",
    { preHandler: authMiddleware },
    async (
      request: AuthenticatedRequest<{ Querystring: { status?: string; limit?: string } }>,
      reply,
    ) => {
      const limit = request.query.limit ? Number(request.query.limit) : undefined;
      const missions = await manager.getMissions({ status: request.query.status, limit });
      return reply.send(missions);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const mission = await manager.getMissionById(request.params.id);
      if (!mission) {
        return reply.status(404).send({ error: "Mission not found" });
      }
      return reply.send(mission);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/:id/tasks",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const tasks = await manager.getTasks({ missionId: request.params.id });
      return reply.send(tasks);
    },
  );

  app.post(
    "/",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const parsed = createMissionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
      }

      try {
        const input: CreateMissionInput = parsed.data;
        const mission = await manager.createMission(input);
        return reply.status(201).send(mission);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(409).send({ error: message });
      }
    },
  );
}
