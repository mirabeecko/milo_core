import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { KnowledgeService } from "./service.js";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";

export async function knowledgeRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const knowledgeService = new KnowledgeService();

  app.get(
    "/obsidian",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      try {
        const notes = await knowledgeService.listObsidianNotes();
        return reply.send({ notes, demo: knowledgeService.isDemo() });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch Obsidian notes" });
      }
    },
  );
}
