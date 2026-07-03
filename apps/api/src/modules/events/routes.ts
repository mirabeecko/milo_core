import { FastifyInstance, FastifyPluginOptions } from "fastify";
import type { AgentFrameworkEvent } from "@milo/agents";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { getAgentManager } from "../agents/manager.js";

export async function eventsRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const manager = await getAgentManager();

  app.get<{ Querystring: { limit?: string; type?: string } }>(
    "/",
    { preHandler: authMiddleware },
    async (
      request: AuthenticatedRequest<{ Querystring: { limit?: string; type?: string } }>,
      reply,
    ) => {
      const limit = request.query.limit ? Number(request.query.limit) : 100;
      const type = request.query.type as AgentFrameworkEvent["type"] | undefined;
      const events = await manager.getEvents({ limit, type });
      return reply.send(events);
    },
  );

  app.get(
    "/stream",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      reply.hijack();
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      const send = (event: Record<string, unknown>) => {
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      };

      send({ type: "connection", message: "MiLO event stream connected" });

      const unsubscribe = manager.subscribe(async (event) => {
        send(event as unknown as Record<string, unknown>);
      });

      const keepAlive = setInterval(() => {
        reply.raw.write(":\n\n");
      }, 15000);

      const cleanup = (): void => {
        unsubscribe();
        clearInterval(keepAlive);
      };

      request.raw.on("close", cleanup);
      request.raw.on("error", cleanup);
    },
  );
}
