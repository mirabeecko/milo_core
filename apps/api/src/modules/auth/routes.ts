import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import { AuthService } from "./service.js";
import { authMiddleware, AuthenticatedRequest } from "./middleware.js";

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
}
