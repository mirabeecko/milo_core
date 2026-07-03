import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";

const projects = [
  {
    id: "proj-tj",
    name: "TJ Krupka",
    status: "active",
    priority: "critical",
    lastActivity: "2026-07-03T08:30:00Z",
    openTasks: 5,
    documents: 12,
    description: "Právní a komunikační podpora TJ Krupka.",
    color: "bg-blue-500",
  },
  {
    id: "proj-milo",
    name: "MiLO_Core",
    status: "active",
    priority: "important",
    lastActivity: "2026-07-03T06:15:00Z",
    openTasks: 8,
    documents: 24,
    description: "Osobní operační systém.",
    color: "bg-purple-500",
  },
  {
    id: "proj-komarka",
    name: "Komárka",
    status: "active",
    priority: "important",
    lastActivity: "2026-07-02T14:20:00Z",
    openTasks: 3,
    documents: 6,
    description: "Web a marketing pro komárku.",
    color: "bg-emerald-500",
  },
  {
    id: "proj-ninja",
    name: "Ninja Týden",
    status: "on_hold",
    priority: "low",
    lastActivity: "2026-07-01T10:00:00Z",
    openTasks: 7,
    documents: 4,
    description: "Týdenní sportovní akce.",
    color: "bg-orange-500",
  },
  {
    id: "proj-obchod",
    name: "Obchodní příležitosti",
    status: "active",
    priority: "important",
    lastActivity: "2026-07-02T16:45:00Z",
    openTasks: 4,
    documents: 9,
    description: "Sledování nových zakázek a poptávek.",
    color: "bg-rose-500",
  },
];

export async function projectsRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  app.get(
    "/",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      return reply.send(projects);
    },
  );
}
