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
    async (request: AuthenticatedRequest, reply) => {
      try {
        const userId = request.user?.id ?? "demo";
        const briefing = await briefingService.generateBriefing(userId);
        return reply.send({ briefing });
      } catch (error) {
        request.log.error(error);

        // Fallback demo briefing, pokud není AI nakonfigurováno
        if (error instanceof Error && error.message.includes("OPENAI_API_KEY")) {
          const demoBriefing = await briefingService.generateDemoBriefing();
          return reply.send({ briefing: demoBriefing, demo: true });
        }

        return reply.status(500).send({ error: "Failed to generate briefing" });
      }
    },
  );
}
