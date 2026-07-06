import { FastifyInstance } from "fastify";
import { logUsage } from "../modules/usage/service.js";

export async function usageRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post("/log", async (request) => {
    const entry = request.body;
    await logUsage(entry);
    return { message: "Usage logged" };
  });
}
