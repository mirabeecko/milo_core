import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import { ChatService } from "./service.js";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { getAgentManager } from "../agents/manager.js";

const chatRequestSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
});

export async function chatRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const manager = await getAgentManager();
  const chatService = new ChatService(manager);

  app.post(
    "/",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const parsed = chatRequestSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
      }

      try {
        const userId = request.user?.id ?? "demo";
        const response = await chatService.sendMessage(userId, parsed.data);
        return reply.send(response);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "Failed to process message" });
      }
    },
  );
}
