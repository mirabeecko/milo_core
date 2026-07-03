import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import { EmailService } from "./service.js";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";

const connectSchema = z.object({
  code: z.string(),
});

export async function emailRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  let emailService: EmailService | null = null;

  try {
    emailService = new EmailService();
  } catch {
    app.log.warn("Google OAuth not configured, email service running in demo mode");
  }

  app.get(
    "/auth-url",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      if (!emailService) {
        return reply.status(503).send({ error: "Google OAuth is not configured" });
      }

      const url = emailService.getAuthorizationUrl(request.user?.id);
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

      if (!emailService) {
        return reply.status(503).send({ error: "Google OAuth is not configured" });
      }

      try {
        await emailService.exchangeCode(parsed.data.code);
        // TODO: uložit tokeny do databáze šifrovaně
        return reply.send({ connected: true });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({ error: "Failed to connect Gmail" });
      }
    },
  );

  app.get(
    "/",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      // Demo režim, pokud není Google OAuth nakonfigurován
      if (!emailService) {
        return reply.send({ emails: new EmailService().generateDemoEmails() });
      }

      try {
        // TODO: načíst access token z databáze podle userId
        const demoAccessToken = "";
        if (!demoAccessToken) {
          return reply.send({ emails: emailService.generateDemoEmails() });
        }

        const emails = await emailService.listEmails(demoAccessToken);
        return reply.send({ emails });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch emails" });
      }
    },
  );
}
