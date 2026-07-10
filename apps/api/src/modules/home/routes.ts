import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { getProjects } from "../projects/service.js";
import { getAgentManager } from "../agents/manager.js";

export async function homeRoutes(app: FastifyInstance, _options: FastifyPluginOptions): Promise<void> {
  app.get("/", { preHandler: authMiddleware }, async (_request: AuthenticatedRequest, reply) => {
    const projects = getProjects();
    const activeProjects = projects.filter((p) => p.status !== "done" && p.status !== "archived");
    const totalCommits = projects.reduce((sum, p) => sum + p.commit_count, 0);

    let activeAgents = 0;
    try {
      const manager = await getAgentManager();
      activeAgents = manager.listAgents().filter(
        (entity) => entity.agent.status !== "offline" && entity.agent.status !== "error",
      ).length;
    } catch {
      activeAgents = 0;
    }

    return reply.send({
      priorities: activeProjects.slice(0, 5).map((p, i) => ({
        id: p.id || `p-${i}`,
        title: p.goal || p.name,
        priority: i === 0 ? "critical" : i === 1 ? "important" : "low",
        project: p.name,
        due: p.last_updated ? new Date(p.last_updated).toLocaleDateString("cs-CZ") : "—",
        done: p.status === "done",
      })),
      snapshot: {
        unreadEmails: 0,
        upcomingMeetings: 0,
        newDocuments: 0,
        openTasks: activeProjects.length,
        activeAgents,
      },
      decisions: activeProjects
        .filter((p) => p.status === "paused")
        .map((p) => ({
          id: p.id || `d-${p.name}`,
          title: `Obnovit projekt ${p.name}?`,
          description: p.goal || p.description || "Projekt je pozastaven.",
          status: "pending" as const,
          source: "Systém",
          date: p.last_updated || new Date().toISOString(),
        })),
      activityLog: projects.slice(0, 10).map((p) => ({
        id: p.id || `a-${p.name}`,
        type: "system" as const,
        title: `Projekt ${p.name}`,
        description: `${p.commit_count} commitů · ${p.time_spent_hours || 0}h stráveno`,
        timestamp: p.last_updated || new Date().toISOString(),
      })),
      recommendation: activeProjects.length > 0
        ? {
            id: "r-1",
            title: `Aktivních projektů: ${activeProjects.length}`,
            description: `Celkem ${totalCommits} commitů napříč ${projects.length} projekty.`,
            action: "Otevřít projekty",
          }
        : null,
      weather: null,
      aiSummary: {
        unreadEmails: 0,
        emailSenders: [],
        siteVisits: [],
        totalVisits: 0,
        insight: `${projects.length} projektů · ${activeProjects.length} aktivních · ${totalCommits} commitů`,
      },
      calendar: {
        today: [],
        tomorrow: [],
        week: [],
      },
    });
  });
}
