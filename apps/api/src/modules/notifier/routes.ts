import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { NotifierAgent } from "@milo/agents";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { getAgentManager } from "../agents/manager.js";
import { isFocusActive } from "../../services/config.js";

export async function notifierRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const manager = await getAgentManager();

  app.get(
    "/today",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      const entity = manager.getAgent("notifier");
      if (!entity || !(entity instanceof NotifierAgent)) {
        return reply.status(404).send({ error: "Notifier agent not found or not running" });
      }
      let reminders = entity.getNotifierState().reminders;

      if (isFocusActive()) {
        reminders = reminders.filter(
          (r) => r.priority === "urgent",
        );
      }

      return reply.send(reminders);
    },
  );

  app.post<{ Params: { id: string }; Body: { option: string } }>(
    "/:id/select",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string }; Body: { option: string } }>, reply) => {
      const entity = manager.getAgent("notifier");
      if (!entity || !(entity instanceof NotifierAgent)) {
        return reply.status(404).send({ error: "Notifier agent not found or not running" });
      }
      const { option } = request.body;
      if (!option) {
        return reply.status(400).send({ error: "option is required" });
      }
      const updatedReminder = await entity.selectReminderOption(request.params.id, option);
      if (!updatedReminder) {
        return reply.status(404).send({ error: "Reminder not found" });
      }
      return reply.send(updatedReminder);
    },
  );

  app.post<{ Params: { id: string } }>(
    "/:id/dismiss",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest<{ Params: { id: string } }>, reply) => {
      const entity = manager.getAgent("notifier");
      if (!entity || !(entity instanceof NotifierAgent)) {
        return reply.status(404).send({ error: "Notifier agent not found or not running" });
      }
      const dismissedReminder = await entity.dismissReminder(request.params.id);
      if (!dismissedReminder) {
        return reply.status(404).send({ error: "Reminder not found" });
      }
      return reply.send(dismissedReminder);
    },
  );
}
