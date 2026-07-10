import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import { EmailService } from "./service.js";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { getGoogleTokens, setGoogleTokens } from "../../config/google-tokens.js";

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

      const state = JSON.stringify({
        userId: request.user?.id,
        service: "email",
      });
      const url = emailService.getAuthorizationUrl(state);
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
        const tokens = await emailService.exchangeCode(parsed.data.code);
        await setGoogleTokens(request.user?.id ?? "", "email", tokens);
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
      if (!emailService) {
        return reply.send({
          emails: [],
          demo: true,
          message: "Gmail není připojen. Připojte účet pro zobrazení e-mailů.",
        });
      }

      try {
        const tokens = await getGoogleTokens(request.user?.id ?? "", "email");
        if (!tokens) {
          return reply.send({
            emails: [],
            demo: true,
            message: "Gmail není připojen. Připojte účet pro zobrazení e-mailů.",
          });
        }

        const emails = await emailService.listEmails(request.user?.id ?? "", tokens.accessToken, tokens.refreshToken);
        return reply.send({ emails });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch emails" });
      }
    },
  );
}
