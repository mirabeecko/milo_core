import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import { DocumentsService } from "./service.js";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";

const connectSchema = z.object({
  code: z.string(),
});

export async function documentsRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const documentsService = new DocumentsService();

  app.get(
    "/auth-url",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      if (!documentsService.isConfigured()) {
        return reply.status(503).send({ error: "Google OAuth is not configured" });
      }

      const url = documentsService.getAuthorizationUrl(request.user?.id);
      return reply.send({ url });
    },
  );

  app.post(
    "/connect",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const parsed = connectSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
      }

      if (!documentsService.isConfigured()) {
        return reply.status(503).send({ error: "Google OAuth is not configured" });
      }

      try {
        await documentsService.exchangeCode(parsed.data.code);
        return reply.send({ connected: true });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({ error: "Failed to connect Google Drive" });
      }
    },
  );

  app.get(
    "/",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        if (documentsService.isDemo()) {
          return reply.send({ files: [], demo: true, message: "Google Drive není připojen. Připojte účet pro zobrazení souborů." });
        }

        const accessToken = "";
        if (!accessToken) {
          return reply.status(400).send({ error: "Missing access token" });
        }

        const files = await documentsService.listFiles(accessToken);
        return reply.send({ files });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch files" });
      }
    },
  );
}
