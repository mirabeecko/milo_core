import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import { EmailService } from "./service.js";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { getGoogleTokens, setGoogleTokens } from "../../config/google-tokens.js";
import { getGmailClient } from "../../services/gws-bridge.js";

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

  // ─── Bridge: Gmail inbox + AI shrnutí (přes existující OAuth token) ───

  app.get(
    "/inbox",
    { preHandler: authMiddleware },
    async (_request, reply) => {
      try {
        const gmail = getGmailClient();

        const listRes = await gmail.users.messages.list({
          userId: "me",
          q: "newer_than:7d",
          maxResults: 20,
        });

        const messageIds = listRes.data.messages ?? [];

        // Získej detaily pro každou zprávu
        const detailPromises = messageIds.map((m) =>
          gmail.users.messages.get({
            userId: "me",
            id: m.id!,
            format: "metadata",
            metadataHeaders: ["From", "Subject", "Date"],
          }),
        );
        const details = await Promise.all(detailPromises);

        const emails = details.map((d) => {
          const headers = d.data.payload?.headers ?? [];
          const from = headers.find((h) => h.name === "From")?.value ?? "";
          const subject = headers.find((h) => h.name === "Subject")?.value ?? "";
          const date = headers.find((h) => h.name === "Date")?.value ?? "";
          return {
            id: d.data.id ?? "",
            from,
            subject,
            date,
            snippet: d.data.snippet ?? "",
            labels: d.data.labelIds ?? [],
          };
        });

        // AI shrnutí
        const unread = emails.filter((e: any) => e.labels?.includes("UNREAD")).length;
        const important = emails.filter((e: any) => e.labels?.includes("IMPORTANT")).length;
        const senders = [...new Set(emails.map((e) => e.from?.split("<")[0]?.trim()).filter(Boolean))];

        return reply.send({
          emails,
          total: emails.length,
          summary: {
            unread,
            important,
            total: emails.length,
            topSenders: senders.slice(0, 5),
            aiSummary: `${emails.length} emailů za poslední týden, ${unread} nepřečtených. ${important > 0 ? `${important} označených jako důležité. ` : ""}Nejaktivnější odesílatelé: ${senders.slice(0, 3).join(", ") || "žádní"}.`,
          },
        });
      } catch (err) {
        return reply.status(500).send({ error: "Gmail bridge failed", detail: String(err) });
      }
    },
  );
}
