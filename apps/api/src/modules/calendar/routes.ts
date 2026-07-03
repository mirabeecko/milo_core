import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import { CalendarService } from "./service.js";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";

const connectSchema = z.object({
  code: z.string(),
});

export async function calendarRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  let calendarService: CalendarService | null = null;

  try {
    calendarService = new CalendarService();
  } catch {
    app.log.warn("Google OAuth not configured, calendar service running in demo mode");
  }

  app.get(
    "/auth-url",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      if (!calendarService) {
        return reply.status(503).send({ error: "Google OAuth is not configured" });
      }

      const url = calendarService.getAuthorizationUrl(request.user?.id);
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

      if (!calendarService) {
        return reply.status(503).send({ error: "Google OAuth is not configured" });
      }

      try {
        await calendarService.exchangeCode(parsed.data.code);
        return reply.send({ connected: true });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({ error: "Failed to connect Google Calendar" });
      }
    },
  );

  app.get(
    "/",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      if (!calendarService) {
        return reply.send({ events: new CalendarService().generateDemoEvents() });
      }

      try {
        const demoAccessToken = "";
        if (!demoAccessToken) {
          return reply.send({ events: calendarService.generateDemoEvents() });
        }

        const events = await calendarService.listEvents(demoAccessToken);
        return reply.send({ events });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch events" });
      }
    },
  );
}
