import { Queue } from "bullmq";
import { config } from "../config/index.js";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);

export const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
};

export const emailSyncQueue = new Queue("email-sync", { connection });
export const calendarSyncQueue = new Queue("calendar-sync", { connection });
export const driveSyncQueue = new Queue("drive-sync", { connection });
export const obsidianSyncQueue = new Queue("obsidian-sync", { connection });
export const briefingQueue = new Queue("briefing-generate", { connection });
export const knowledgeIndexQueue = new Queue("knowledge-index", { connection });

export const allQueues = [
  emailSyncQueue,
  calendarSyncQueue,
  driveSyncQueue,
  obsidianSyncQueue,
  briefingQueue,
  knowledgeIndexQueue,
];

export async function closeQueues(): Promise<void> {
  await Promise.all(allQueues.map((q) => q.close()));
}
