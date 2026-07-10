import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { BriefingService } from "./service.js";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";

export async function briefingRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const briefingService = new BriefingService();

  app.get(
    "/",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      try {
        const { briefing, demo } = await briefingService.generateBriefing();
        return reply.send({ briefing, demo });
      } catch (error) {
        _request.log.error(error);
        return reply.status(500).send({ error: "Failed to generate briefing" });
      }
    },
  );
}
