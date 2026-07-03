import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";

const agents = [
  {
    id: "agent-chief",
    name: "Chief of Staff",
    role: "Každodenní koordinace",
    description: "Generuje briefing, sleduje priority a koordinuje ostatní agenty.",
    status: "running",
    lastActive: "2026-07-03T07:00:00Z",
    currentTask: "Generuji ranní briefing",
    icon: "sunrise",
  },
  {
    id: "agent-legal",
    name: "Legal Agent",
    role: "Právní dokumenty",
    description: "Kontroluje smlouvy, termíny a právní rizika.",
    status: "idle",
    lastActive: "2026-07-02T16:20:00Z",
    currentTask: "Čeká na úkol",
    icon: "scale",
  },
  {
    id: "agent-research",
    name: "Research Agent",
    role: "Rešerše a knowledge",
    description: "Vyhledává informace napříč dokumenty a znalostní bází.",
    status: "running",
    lastActive: "2026-07-03T06:45:00Z",
    currentTask: "Indexuji Obsidian vault",
    icon: "search",
  },
  {
    id: "agent-dev",
    name: "Developer Agent",
    role: "Vývoj a kód",
    description: "Pomáhá s vývojem, refaktoringem a review kódu.",
    status: "paused",
    lastActive: "2026-07-01T14:00:00Z",
    currentTask: "Pozastaveno",
    icon: "code",
  },
  {
    id: "agent-knowledge",
    name: "Knowledge Agent",
    role: "Znalostní báze",
    description: "Organizuje poznámky, tagy a vztahy mezi dokumenty.",
    status: "idle",
    lastActive: "2026-07-02T11:30:00Z",
    currentTask: "Čeká na úkol",
    icon: "book-open",
  },
];

const agentLogs = [
  {
    id: "log-1",
    agentId: "agent-chief",
    timestamp: "2026-07-03T07:00:00Z",
    level: "info",
    message: "Briefing vygenerován za 1.2s",
  },
  {
    id: "log-2",
    agentId: "agent-research",
    timestamp: "2026-07-03T06:45:00Z",
    level: "info",
    message: "Indexováno 127 poznámek z Obsidianu",
  },
  {
    id: "log-3",
    agentId: "agent-legal",
    timestamp: "2026-07-02T16:20:00Z",
    level: "warning",
    message: "Smlouva TJ Krupka vyžaduje doplnění kontaktních údajů",
  },
];

export async function agentsRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  app.get(
    "/",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      return reply.send(agents);
    },
  );

  app.get(
    "/logs",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      return reply.send(agentLogs);
    },
  );
}
