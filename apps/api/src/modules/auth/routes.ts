import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import { AuthService } from "./service.js";
import { authMiddleware, AuthenticatedRequest } from "./middleware.js";
import { CalendarService } from "../calendar/service.js";
import { EmailService } from "../email/service.js";
import { setGoogleTokens, type GoogleService } from "../../config/google-tokens.js";
import { config } from "../../config/index.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export async function authRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const authService = new AuthService();

  app.get("/status", async (_request, reply) => {
    const mode = authService.getAuthMode();
    return reply.send(mode);
  });

  app.post("/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
    }

    try {
      const result = await authService.signInWithPassword(parsed.data.email, parsed.data.password);
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(401).send({ error: "Invalid credentials" });
    }
  });

  app.post("/refresh", async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
    }

    try {
      const tokens = await authService.refreshSession(parsed.data.refreshToken);
      return reply.send({ tokens });
    } catch (error) {
      request.log.error(error);
      return reply.status(401).send({ error: "Session refresh failed" });
    }
  });

  app.get("/me", { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    return reply.send({ user: request.user });
  });

  app.post("/logout", { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const authHeader = request.headers.authorization;
    const accessToken = authHeader?.slice(7) ?? "";

    try {
      await authService.signOut(accessToken);
      return reply.send({ success: true });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Logout failed" });
    }
  });

  app.get("/google/callback", async (request, reply) => {
    const query = request.query as { code?: string; state?: string; error?: string };

    if (query.error) {
      return reply.status(400).send({ error: "Google OAuth denied" });
    }

    if (!query.code || !query.state) {
      return reply.status(400).send({ error: "Missing code or state" });
    }

    let state: { userId?: string; service?: GoogleService };
    try {
      state = JSON.parse(query.state);
    } catch {
      return reply.status(400).send({ error: "Invalid state" });
    }

    const { userId, service } = state;
    if (!userId || !service) {
      return reply.status(400).send({ error: "Invalid state" });
    }

    try {
      if (service === "calendar") {
        const calendarService = new CalendarService();
        const tokens = await calendarService.exchangeCode(query.code);
        await setGoogleTokens(userId, "calendar", tokens);
        return reply.redirect(`${config.APP_URL}/calendar?connected=1`);
      }

      if (service === "email") {
        const emailService = new EmailService();
        const tokens = await emailService.exchangeCode(query.code);
        await setGoogleTokens(userId, "email", tokens);
        return reply.redirect(`${config.APP_URL}/email?connected=1`);
      }

      return reply.status(400).send({ error: "Invalid service" });
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: "Failed to connect Google account" });
    }
  });
}
