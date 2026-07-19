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

const searchBodySchema = z.object({
  query: z.string().min(1),
  topK: z.coerce.number().default(10),
  filters: z
    .object({
      source: z.string().optional(),
      tags: z.array(z.string()).optional(),
      modifiedAfter: z.string().optional(),
    })
    .optional(),
});

const indexDocSchema = z.object({
  docId: z.string(),
  content: z.string(),
  title: z.string(),
  source: z.string().default("manual"),
  path: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const indexDirSchema = z.object({
  path: z.string().min(1),
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
        return reply.send({
          notes,
          demo,
          ...(demo ? { message: "Obsidian vault není nakonfigurován. Nastavte OBSIDIAN_VAULT_PATH v .env." } : {}),
        });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Nepodařilo se načíst Obsidian poznámky" });
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
          return reply.status(404).send({ error: "Poznámka nenalezena" });
        }
        return reply.send({ note });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Nepodařilo se načíst Obsidian poznámku" });
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
        return reply.status(400).send({ error: "Chybí vyhledávací dotaz" });
      }

      try {
        const notes = await knowledgeService.searchObsidian(q);
        const demo = await knowledgeService.isDemo();
        return reply.send({
          notes,
          query: q,
          demo,
          ...(demo ? { message: "Obsidian vault není nakonfigurován. Nastavte OBSIDIAN_VAULT_PATH v .env." } : {}),
        });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Nepodařilo se vyhledat v Obsidianu" });
      }
    },
  );

  app.post(
    "/search",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const parsed = searchBodySchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
      }

      try {
        const { query, topK, filters } = parsed.data;
        const results = await knowledgeService.hybridSearch(query, topK, filters);
        return reply.send({ results, query });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Nepodařilo se provést sémantické vyhledávání" });
      }
    },
  );

  app.post(
    "/index",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const result = await knowledgeService.rebuildIndex();
        return reply.send({
          message: "Indexace dokončena",
          ...result,
        });
      } catch (error) {
        app.log.error(error);
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(500).send({ error: message });
      }
    },
  );

  app.post(
    "/index/document",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const parsed = indexDocSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
      }

      try {
        const { docId, content, title, source, path: docPath, tags } = parsed.data;
        const result = await knowledgeService.indexDocument(docId, content, {
          title,
          source,
          path: docPath ?? docId,
          tags,
          modifiedAt: new Date().toISOString(),
        });

        return reply.send({ message: "Dokument indexován", ...result });
      } catch (error) {
        app.log.error(error);
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(500).send({ error: message });
      }
    },
  );

  app.post(
    "/index/directory",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const parsed = indexDirSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
      }

      try {
        const result = await knowledgeService.indexDirectory(parsed.data.path);
        return reply.send({ message: "Adresář indexován", ...result });
      } catch (error) {
        app.log.error(error);
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(500).send({ error: message });
      }
    },
  );

  app.get(
    "/stats",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      try {
        const stats = await knowledgeService.getKnowledgeStats();
        return reply.send(stats);
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Nepodařilo se načíst statistiky" });
      }
    },
  );

  app.post(
    "/reindex",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      try {
        const result = await knowledgeService.rebuildIndex();
        return reply.send({ message: "Reindexace dokončena", ...result });
      } catch (error) {
        app.log.error(error);
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(500).send({ error: message });
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
        return reply.status(500).send({ error: "Nepodařilo se načíst nastavení Obsidianu" });
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
        return reply.status(500).send({ error: "Nepodařilo se uložit nastavení Obsidianu" });
      }
    },
  );
}
