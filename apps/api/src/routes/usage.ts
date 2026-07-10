import { FastifyInstance } from "fastify";
import { logUsage, getUsageForProject, getAllUsage, type UsageEntry } from "../modules/usage/service.js";

export async function usageRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post("/log", async (request) => {
    const entry = request.body as UsageEntry;
    await logUsage(entry);
    return { message: "Usage logged" };
  });

  fastify.get<{ Params: { project: string } }>("/project/:project", async (request) => {
    const { project } = request.params;
    return await getUsageForProject(project);
  });

  fastify.get("/", async () => {
    return await getAllUsage();
  });
}
