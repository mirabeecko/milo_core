import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { generateWeeklySummary, getLatestSummary } from "../../services/weekly-summary.js";

export async function weeklyRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  app.get(
    "/summary",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      const summary = getLatestSummary();
      if (!summary) {
        return reply.send({ message: "No weekly summary yet" });
      }
      return reply.send(summary);
    },
  );

  app.post(
    "/summary/generate",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      try {
        const summary = await generateWeeklySummary();
        return reply.send(summary);
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Failed to generate weekly summary" });
      }
    },
  );
}
