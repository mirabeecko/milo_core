import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";

export async function homeRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  app.get(
    "/",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      return reply.send({
        priorities: [
          {
            id: "p-1",
            title: "Dokončit návrh smlouvy pro TJ Krupka",
            priority: "critical",
            project: "TJ Krupka",
            due: "Dnes do 12:00",
            done: false,
          },
          {
            id: "p-2",
            title: "Projít feedback k MiLO_Core dashboardu",
            priority: "important",
            project: "MiLO_Core",
            due: "Dnes do 17:00",
            done: false,
          },
          {
            id: "p-3",
            title: "Připravit nabídku pro Komárku",
            priority: "low",
            project: "Komárka",
            due: "Příští týden",
            done: false,
          },
        ],
        snapshot: {
          unreadEmails: 4,
          upcomingMeetings: 2,
          newDocuments: 7,
          openTasks: 12,
          activeAgents: 3,
        },
        decisions: [
          {
            id: "d-1",
            title: "Schválit rozpočet Ninja Týden",
            description: "Agent připravil návrh rozpočtu 85 000 Kč. Čeká na schválení.",
            status: "pending",
            source: "Chief of Staff",
            date: "2026-07-03T08:30:00Z",
          },
          {
            id: "d-2",
            title: "Přidat kontakt do Gmail sync",
            description: "Legal Agent našel nový kontakt v ISDS. Přidat do Gmail kontaktů?",
            status: "pending",
            source: "Legal Agent",
            date: "2026-07-03T09:15:00Z",
          },
        ],
        activityLog: [
          {
            id: "a-1",
            type: "agent",
            title: "Chief of Staff vygeneroval briefing",
            description: "Denní přehled připraven v 7:00.",
            timestamp: "2026-07-03T07:00:00Z",
          },
          {
            id: "a-2",
            type: "system",
            title: "Sync Obsidian vaultu dokončen",
            description: "Indexováno 127 poznámek.",
            timestamp: "2026-07-03T06:45:00Z",
          },
          {
            id: "a-3",
            type: "user",
            title: "Otevřena stránka Projects",
            description: "Uživatel zkontroloval stav projektů.",
            timestamp: "2026-07-03T06:30:00Z",
          },
          {
            id: "a-4",
            type: "integration",
            title: "Google Calendar sync",
            description: "Nalezeny 2 nové události na dnešek.",
            timestamp: "2026-07-03T06:15:00Z",
          },
        ],
        recommendation: {
          id: "r-1",
          title: "Nejdřív vyřeš kritickou prioritu",
          description:
            "Smlouva pro TJ Krupka má deadline dnes v 12:00. Agent připravil podklady.",
          action: "Otevřít prioritu",
        },
        weather: {
          location: "Krupka",
          condition: "clear",
          temperature: 24,
          feelsLike: 26,
          humidity: 52,
          windSpeed: 12,
          forecast: [
            { time: "14:00", temperature: 25, condition: "clear" },
            { time: "17:00", temperature: 23, condition: "cloudy" },
            { time: "20:00", temperature: 19, condition: "cloudy" },
          ],
        },
        aiSummary: {
          unreadEmails: 4,
          emailSenders: ["Jan Novák", "Město Krupka", "Google Workspace", "Pavel Dvořák"],
          siteVisits: [
            { site: "tjkrupka.cz", visits: 312, uniqueVisitors: 198, changePercent: 12, topPage: "/rozvrh" },
            { site: "sheskates.cz", visits: 187, uniqueVisitors: 143, changePercent: -5, topPage: "/obleceni" },
            { site: "ninja-tyden.cz", visits: 94, uniqueVisitors: 71, changePercent: 34, topPage: "/prihlaska" },
            { site: "webdo24.cz", visits: 45, uniqueVisitors: 38, changePercent: 8, topPage: "/sluzby" },
          ],
          totalVisits: 638,
          insight:
            "Ninja Týden má největší nárůst návštěvnosti (+34 %). TJ Krupka překonává 300 návštěv za den. Ve snech Skates klesá traffic o 5 %.",
        },
      });
    },
  );
}
