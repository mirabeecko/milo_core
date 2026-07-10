import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { getConfig, saveConfig, isFocusActive } from "../../services/config.js";
import { z } from "zod";

const focusModeSchema = z.object({
  duration_minutes: z.number().min(1).max(480),
});

export async function focusRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  app.get(
    "/",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      const cfg = getConfig();
      const active = isFocusActive();
      return reply.send({
        focus_mode: active,
        focus_until: cfg.focus_until,
      });
    },
  );

  app.post(
    "/",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const parsed = focusModeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
      }

      const until = new Date(Date.now() + parsed.data.duration_minutes * 60_000).toISOString();
      saveConfig({ focus_mode: true, focus_until: until });

      return reply.send({
        focus_mode: true,
        focus_until: until,
        message: `Focus mode active for ${parsed.data.duration_minutes} minutes`,
      });
    },
  );

  app.delete(
    "/",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      saveConfig({ focus_mode: false, focus_until: null });
      return reply.send({ focus_mode: false, message: "Focus mode cancelled" });
    },
  );
}
