import { FastifyInstance } from "fastify";
import { scanProjects } from "../modules/projects/scan.js";

export async function scanRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post("/", async () => {
    const result = await scanProjects();
    return result;
  });
}
