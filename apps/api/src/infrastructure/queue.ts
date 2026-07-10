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

let _miloQueue: Queue<JobData[keyof JobData], unknown, JobName> | null | undefined;

function createQueue(): Queue<JobData[keyof JobData], unknown, JobName> | null {
  try {
    return new Queue<JobData[keyof JobData], unknown, JobName>("milo", {
      connection: { url: config.REDIS_URL },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      },
    });
  } catch (error) {
    console.error("Failed to create BullMQ queue – continuing without queue:", error);
    return null;
  }
}

export function getQueue(): Queue<JobData[keyof JobData], unknown, JobName> | null {
  if (_miloQueue === undefined) {
    _miloQueue = createQueue();
  }
  return _miloQueue;
}

export async function closeQueue(): Promise<void> {
  if (_miloQueue) {
    try {
      await _miloQueue.close();
    } catch (error) {
      console.error("Error closing BullMQ queue:", error);
    }
    _miloQueue = undefined;
  }
}

export const miloQueue: Queue<JobData[keyof JobData], unknown, JobName> | null =
  new Proxy({} as Queue<JobData[keyof JobData], unknown, JobName>, {
    get(_target, prop) {
      const queue = getQueue();
      if (!queue) {
        console.warn(`BullMQ queue not available, ignoring access: ${String(prop)}`);
        return undefined;
      }
      const value = (queue as unknown as Record<string | symbol, unknown>)[prop];
      if (typeof value === "function") {
        return value.bind(queue);
      }
      return value;
    },
  });
