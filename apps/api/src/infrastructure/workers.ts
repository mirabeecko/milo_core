import { Worker, type Job } from "bullmq";
import { config } from "../config/index.js";
import { getQueue, closeQueue, JobName, type JobData } from "./queue.js";
import { syncEmailJob } from "../jobs/sync-email.js";
import { syncCalendarJob } from "../jobs/sync-calendar.js";
import { syncDriveJob } from "../jobs/sync-drive.js";
import { generateEmbeddingsJob } from "../jobs/generate-embeddings.js";
import { runAgentJob } from "../jobs/run-agent.js";

export interface MiloWorkers {
  emailWorker: Worker | null;
  closeAll: () => Promise<void>;
}

export async function startWorkers(): Promise<MiloWorkers> {
  const queue = getQueue();
  if (!queue) {
    console.warn("[workers] No queue available, workers not started");
    return {
      emailWorker: null,
      closeAll: async () => {},
    };
  }

  const processor = async (job: Job<JobData[keyof JobData], unknown, JobName>) => {
    const startTime = Date.now();
    console.log(`[worker] Processing job ${job.id} (${job.name}), attempt ${job.attemptsMade + 1}/${job.opts.attempts}`);

    try {
      let result: unknown;

      switch (job.name) {
        case JobName.SYNC_EMAIL:
          result = await syncEmailJob(job.data as JobData[JobName.SYNC_EMAIL]);
          break;
        case JobName.SYNC_CALENDAR:
          result = await syncCalendarJob(job.data as JobData[JobName.SYNC_CALENDAR]);
          break;
        case JobName.SYNC_DRIVE:
          result = await syncDriveJob(job.data as JobData[JobName.SYNC_DRIVE]);
          break;
        case JobName.GENERATE_EMBEDDINGS:
          result = await generateEmbeddingsJob(job.data as JobData[JobName.GENERATE_EMBEDDINGS]);
          break;
        case JobName.RUN_AGENT:
          result = await runAgentJob(job.data as JobData[JobName.RUN_AGENT]);
          break;
        default:
          throw new Error(`Unknown job type: ${String(job.name)}`);
      }

      const duration = Date.now() - startTime;
      console.log(`[worker] Job ${job.id} (${job.name}) completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[worker] Job ${job.id} (${job.name}) failed after ${duration}ms: ${message}`);
      throw error;
    }
  };

  let emailWorker: Worker | null = null;

  try {
    emailWorker = new Worker("milo", processor, {
      connection: { url: config.REDIS_URL },
      autorun: true,
      concurrency: 5,
    });

    emailWorker.on("completed", (job) => {
      console.log(`[worker] Job ${job.id} (${job.name}) completed`);
    });

    emailWorker.on("failed", (job, error) => {
      if (job) {
        console.error(`[worker] Job ${job.id} (${job.name}) failed: ${error.message}`);
      } else {
        console.error(`[worker] Job failed: ${error.message}`);
      }
    });

    emailWorker.on("error", (error) => {
      console.error("[worker] Worker error:", error.message);
    });

    console.log("[workers] BullMQ workers started");
  } catch (error) {
    console.error("[workers] Failed to start BullMQ workers:", error);
    emailWorker = null;
    console.warn("[workers] Continuing without background job processing");
  }

  return {
    emailWorker,
    closeAll: async () => {
      if (emailWorker) {
        try {
          await emailWorker.close();
          console.log("[workers] Email worker closed");
        } catch (error) {
          console.error("[workers] Error closing email worker:", error);
        }
      }
      await closeQueue();
    },
  };
}
