import { FastifyInstance } from "fastify";
import { runBackup, listBackups } from "../services/backup.js";

export async function backupRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post("/", async () => {
    const result = await runBackup();
    return result;
  });

  fastify.get("/", async () => {
    return listBackups();
  });
}
