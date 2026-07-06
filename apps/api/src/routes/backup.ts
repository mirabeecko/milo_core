import { FastifyInstance } from "fastify";
import { runBackup } from "../../scripts/backup.js";

export async function backupRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post("/", async () => {
    const result = await runBackup();
    return result;
  });
}
