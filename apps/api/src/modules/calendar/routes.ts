import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import { CalendarService } from "./service.js";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { getGoogleTokens, setGoogleTokens } from "../../config/google-tokens.js";
import { getCalendarClient } from "../../services/gws-bridge.js";

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

      const state = JSON.stringify({
        userId: request.user?.id,
        service: "calendar",
      });
      const url = calendarService.getAuthorizationUrl(state);
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
        const tokens = await calendarService.exchangeCode(parsed.data.code);
        await setGoogleTokens(request.user?.id ?? "", "calendar", tokens);
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
        return reply.send({
          events: [],
          demo: true,
          message: "Google Calendar není připojen. Připojte účet pro zobrazení událostí.",
        });
      }

      try {
        const tokens = await getGoogleTokens(request.user?.id ?? "", "calendar");
        if (!tokens) {
          return reply.send({
            events: [],
            demo: true,
            message: "Google Calendar není připojen. Připojte účet pro zobrazení událostí.",
          });
        }

        const events = await calendarService.listEvents(request.user?.id ?? "", tokens.accessToken, tokens.refreshToken);
        return reply.send({ events });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch events" });
      }
    },
  );

  // ─── Bridge: Calendar events + AI shrnutí (přes existující OAuth token) ───

  app.get(
    "/events",
    { preHandler: authMiddleware },
    async (_request, reply) => {
      try {
        const calendar = getCalendarClient();

        const now = new Date().toISOString();
        const res = await calendar.events.list({
          calendarId: "primary",
          timeMin: now,
          maxResults: 20,
          singleEvents: true,
          orderBy: "startTime",
        });

        const events = (res.data.items ?? []).map((e) => ({
          id: e.id ?? "",
          summary: e.summary ?? "",
          start: e.start?.dateTime ?? e.start?.date ?? "",
          end: e.end?.dateTime ?? e.end?.date ?? "",
          location: e.location ?? undefined,
          htmlLink: e.htmlLink ?? "",
        }));

        const today = new Date().toISOString().slice(0, 10);
        const todayEvents = events.filter((e: any) => e.start?.startsWith(today));
        const upcomingEvents = events.filter((e: any) => e.start > today);

        return reply.send({
          events,
          total: events.length,
          summary: {
            today: todayEvents.length,
            upcoming: upcomingEvents.length,
            aiSummary: todayEvents.length > 0
              ? `Dnes ${todayEvents.length} událost${todayEvents.length > 1 ? "i" : ""}: ${todayEvents.map((e: any) => e.summary).join(", ")}. Celkem ${events.length} událostí v kalendáři.`
              : `Dnes žádné události. Nejbližší: ${upcomingEvents.slice(0, 3).map((e: any) => `${e.summary} (${e.start?.slice(0, 10)})`).join(", ") || "žádné"}.`,
          },
        });
      } catch (err) {
        return reply.status(500).send({ error: "Calendar bridge failed", detail: String(err) });
      }
    },
  );
}
