import { Queue } from "bullmq";
import { config } from "../config/index.js";

export enum JobName {
  SYNC_EMAIL = "sync:email",
  SYNC_CALENDAR = "sync:calendar",
  SYNC_DRIVE = "sync:drive",
  GENERATE_EMBEDDINGS = "generate:embeddings",
  RUN_AGENT = "run:agent",
}

export interface JobData {
  [JobName.SYNC_EMAIL]: { userId: string };
  [JobName.SYNC_CALENDAR]: { userId: string };
  [JobName.SYNC_DRIVE]: { userId: string };
  [JobName.GENERATE_EMBEDDINGS]: { documentId: string };
  [JobName.RUN_AGENT]: { agentId: string; userId: string; input: string };
}

export const miloQueue = new Queue<JobData[keyof JobData], unknown, JobName>("milo", {
  connection: { url: config.REDIS_URL },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});
