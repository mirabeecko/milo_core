import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { checkBudgets, getActiveAlerts, acknowledgeAlert } from "../../services/budget-checker.js";
import { getConfig } from "../../services/config.js";

export async function budgetRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  app.get(
    "/alerts",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      const alerts = getActiveAlerts();
      const cfg = getConfig();
      return reply.send({ alerts, monthly_budget_total: cfg.monthly_budget_total });
    },
  );

  app.post(
    "/check",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      try {
        const newAlerts = await checkBudgets();
        return reply.send({
          checked: true,
          new_alerts: newAlerts,
          budget_status: newAlerts.length === 0 ? "ok" : "alert",
        });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Budget check failed" });
      }
    },
  );

  app.post(
    "/alerts/:id/acknowledge",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const alert = acknowledgeAlert(id);
      if (!alert) return reply.status(404).send({ error: "Alert not found" });
      return reply.send(alert);
    },
  );
}
