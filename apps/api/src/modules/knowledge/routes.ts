import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import { KnowledgeService } from "./service.js";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";

const querySchema = z.object({
  q: z.string().optional(),
  maxResults: z.coerce.number().default(50),
});

const noteParamsSchema = z.object({
  id: z.string(),
});

const settingsSchema = z.object({
  vaultPath: z.string().min(1),
});

export async function knowledgeRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const knowledgeService = new KnowledgeService();

  app.get(
    "/obsidian",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const parsed = querySchema.safeParse(request.query);

      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
      }

      try {
        const { q, maxResults } = parsed.data;
        const notes = await knowledgeService.listObsidianNotes(maxResults, q);
        const demo = await knowledgeService.isDemo();
        return reply.send({ notes, demo });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch Obsidian notes" });
      }
    },
  );

  app.get(
    "/obsidian/:id",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const parsed = noteParamsSchema.safeParse(request.params);

      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
      }

      try {
        const note = await knowledgeService.getObsidianNote(parsed.data.id);
        if (!note) {
          return reply.status(404).send({ error: "Note not found" });
        }
        return reply.send({ note });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch Obsidian note" });
      }
    },
  );

  app.get(
    "/search",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const parsed = querySchema.safeParse(request.query);

      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
      }

      const { q } = parsed.data;
      if (!q) {
        return reply.status(400).send({ error: "Missing search query" });
      }

      try {
        const notes = await knowledgeService.searchObsidian(q);
        return reply.send({ notes, query: q });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Failed to search Obsidian notes" });
      }
    },
  );

  app.post(
    "/index",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      try {
        const notes = await knowledgeService.reindex();
        return reply.send({ indexed: notes.length });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Failed to index Obsidian vault" });
      }
    },
  );

  app.get(
    "/settings/obsidian",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      try {
        const status = await knowledgeService.getStatus();
        return reply.send(status);
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch Obsidian settings" });
      }
    },
  );

  app.post(
    "/settings/obsidian",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const parsed = settingsSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
      }

      try {
        const { setObsidianVaultPath } = await import("../../config/settings.js");
        await setObsidianVaultPath(parsed.data.vaultPath);
        await knowledgeService.reindex();
        const status = await knowledgeService.getStatus();
        return reply.send(status);
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Failed to save Obsidian settings" });
      }
    },
  );
}
