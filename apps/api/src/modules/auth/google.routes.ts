import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import { createDatabaseClient, type SupabaseClient } from "@milo/database";
import { EmailService } from "../email/service.js";
import { CalendarService } from "../calendar/service.js";
import { DocumentsService } from "../documents/service.js";
import { AuthenticatedRequest, authMiddleware } from "./middleware.js";
import { config } from "../../config/index.js";

const connectSchema = z.object({ code: z.string(), service: z.enum(["gmail", "calendar", "drive"]) });

function getSupabaseClient(): SupabaseClient | null {
  const url = config.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = config.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createDatabaseClient({ url, serviceRoleKey: key });
}

function getService(service: string): EmailService | CalendarService | DocumentsService | null {
  switch (service) {
    case "gmail": return new EmailService();
    case "calendar": return new CalendarService();
    case "drive": return new DocumentsService();
    default: return null;
  }
}

export async function googleAuthRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const emailService = new EmailService();
  const calendarService = new CalendarService();
  const documentsService = new DocumentsService();

  app.get("/google/:service", { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { service } = request.params as { service: string };
    const svc = getService(service);
    if (!svc || !svc.isConfigured()) {
      return reply.status(503).send({ error: "Google OAuth is not configured for this service" });
    }
    const state = JSON.stringify({ userId: request.user?.id ?? "demo", service });
    return reply.send({ url: svc.getAuthorizationUrl(state) });
  });

  app.post("/google/connect", { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const parsed = connectSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
    }

    const { code, service } = parsed.data;
    const userId = request.user?.id ?? "demo";
    const svc = getService(service);

    if (!svc || !svc.isConfigured()) {
      return reply.status(503).send({ error: "Google OAuth is not configured for this service" });
    }

    try {
      const tokens = await svc.exchangeCode(code);

      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from("accounts").upsert({
          user_id: userId,
          provider: "google",
          service,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          token_expires_at: tokens.expiryDate
            ? new Date(tokens.expiryDate).toISOString()
            : null,
          scope: `https://www.googleapis.com/auth/${service}`,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,provider,service" });
      }

      return reply.send({ connected: true, service });
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: "Failed to connect Google account" });
    }
  });

  app.get("/google/status", { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const userId = request.user?.id ?? "demo";
    const supabase = getSupabaseClient();

    if (!supabase) {
      return reply.send({
        gmail: { connected: false, demo: true },
        calendar: { connected: false, demo: true },
        drive: { connected: false, demo: true },
      });
    }

    const { data: accounts } = await supabase
      .from("accounts")
      .select("service, token_expires_at")
      .eq("user_id", userId)
      .eq("provider", "google");

    const statusMap: Record<string, { connected: boolean; expiresAt?: string }> = {
      gmail: { connected: false },
      calendar: { connected: false },
      drive: { connected: false },
    };

    for (const acc of accounts ?? []) {
      if (acc.service in statusMap) {
        statusMap[acc.service] = {
          connected: true,
          expiresAt: acc.token_expires_at,
        };
      }
    }

    return reply.send(statusMap);
  });

  app.get("/google/:service/auth-url", { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply) => {
    const { service } = request.params as { service: string };
    if (service === "gmail") return reply.send({ url: emailService.getAuthorizationUrl() });
    if (service === "calendar") return reply.send({ url: calendarService.getAuthorizationUrl() });
    if (service === "drive") return reply.send({ url: documentsService.getAuthorizationUrl() });
    return reply.status(400).send({ error: "Unknown service" });
  });
}
