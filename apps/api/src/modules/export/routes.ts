import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import { ExportService, type ExportFormat } from "../../services/export.js";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { getAgentManager } from "../agents/manager.js";

const exportQuerySchema = z.object({
  format: z.enum(["json", "markdown"]).default("json"),
});

export async function exportRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  app.get(
    "/",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      return reply.send({
        endpoints: {
          all: { path: "/export/all", formats: ["json", "markdown"], description: "Kompletní export MiLO" },
          agents: { path: "/export/agents", formats: ["json", "markdown"], description: "Export agentů – stavy, logy, paměť, metriky" },
          missions: { path: "/export/missions", formats: ["json", "markdown"], description: "Export misí a úkolů" },
          knowledge: { path: "/export/knowledge", formats: ["json", "markdown"], description: "Export znalostí – Obsidian index, metadata dokumentů" },
        },
        constitutionalRight: "Ústava MiLO, kapitola 4.4: Znalosti patří vlastníkovi",
      });
    },
  );

  app.get<{ Querystring: { format?: string } }>(
    "/agents",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Querystring: { format?: string } }>, reply) => {
      const parsed = exportQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid format", details: parsed.error.format() });
      }

      const format = parsed.data.format as ExportFormat;
      const manager = await getAgentManager();
      const service = new ExportService(manager);
      const result = await service.exportAgentData(format);

      return reply
        .header("Content-Type", format === "json" ? "application/json" : "text/markdown; charset=utf-8")
        .header("Content-Disposition", `attachment; filename="milo-agents-export.${format === "json" ? "json" : "md"}"`)
        .send(result);
    },
  );

  app.get<{ Querystring: { format?: string } }>(
    "/missions",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Querystring: { format?: string } }>, reply) => {
      const parsed = exportQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid format", details: parsed.error.format() });
      }

      const format = parsed.data.format as ExportFormat;
      const manager = await getAgentManager();
      const service = new ExportService(manager);
      const result = await service.exportMissions(format);

      return reply
        .header("Content-Type", format === "json" ? "application/json" : "text/markdown; charset=utf-8")
        .header("Content-Disposition", `attachment; filename="milo-missions-export.${format === "json" ? "json" : "md"}"`)
        .send(result);
    },
  );

  app.get<{ Querystring: { format?: string } }>(
    "/knowledge",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Querystring: { format?: string } }>, reply) => {
      const parsed = exportQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid format", details: parsed.error.format() });
      }

      const format = parsed.data.format as ExportFormat;
      const manager = await getAgentManager();
      const service = new ExportService(manager);
      const result = await service.exportKnowledge(format);

      return reply
        .header("Content-Type", format === "json" ? "application/json" : "text/markdown; charset=utf-8")
        .header("Content-Disposition", `attachment; filename="milo-knowledge-export.${format === "json" ? "json" : "md"}"`)
        .send(result);
    },
  );

  app.get<{ Querystring: { format?: string } }>(
    "/all",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Querystring: { format?: string } }>, reply) => {
      const parsed = exportQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid format", details: parsed.error.format() });
      }

      const format = parsed.data.format as ExportFormat;
      const manager = await getAgentManager();
      const service = new ExportService(manager);
      const result = await service.exportAllAsString(format);

      return reply
        .header("Content-Type", format === "json" ? "application/json" : "text/markdown; charset=utf-8")
        .header("Content-Disposition", `attachment; filename="milo-full-export.${format === "json" ? "json" : "md"}"`)
        .send(result);
    },
  );
}
