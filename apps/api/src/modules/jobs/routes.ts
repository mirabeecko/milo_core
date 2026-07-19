import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import { JobName } from "../../infrastructure/queue.js";
import { miloQueue as queue } from "../../infrastructure/queue.js";
import { getSyncedEmails } from "../../jobs/sync-email.js";
import { getSyncedCalendarEvents } from "../../jobs/sync-calendar.js";
import { getSyncedDriveFiles } from "../../jobs/sync-drive.js";
import { getEmbeddings } from "../../jobs/generate-embeddings.js";
import { getAllSyncStates } from "../../jobs/sync-state.js";
import { getAgentManager } from "../agents/manager.js";

const triggerSyncSchema = z.object({
  userId: z.string().optional().default("demo-user"),
  documentId: z.string().optional(),
  agentId: z.string().optional(),
  input: z.string().optional(),
});

const VALID_SYNC_TYPES = ["email", "calendar", "drive", "embeddings", "agent"] as const;

function mapTypeToJobName(type: string): JobName | null {
  switch (type) {
    case "email":
      return JobName.SYNC_EMAIL;
    case "calendar":
      return JobName.SYNC_CALENDAR;
    case "drive":
      return JobName.SYNC_DRIVE;
    case "embeddings":
      return JobName.GENERATE_EMBEDDINGS;
    case "agent":
      return JobName.RUN_AGENT;
    default:
      return null;
  }
}

export async function jobsRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  app.get("/api/jobs", async (_request, reply) => {
    const syncStates = await getAllSyncStates();

    const jobs = syncStates.map((state) => ({
      id: `${state.userId}:${state.service}`,
      type: state.service,
      userId: state.userId,
      status: state.error ? "failed" : "completed",
      lastSyncAt: state.lastSyncAt,
      itemCount: state.itemCount,
      error: state.error,
    }));

    return reply.send({ jobs, count: jobs.length });
  });

  app.get("/api/jobs/sync-status", async (_request, reply) => {
    const states = await getAllSyncStates();

    const [emails, events, files] = await Promise.all([
      getSyncedEmails().catch(() => []),
      getSyncedCalendarEvents().catch(() => []),
      getSyncedDriveFiles().catch(() => []),
    ]);

    return reply.send({
      syncStates: states,
      data: {
        emails: emails.length,
        calendarEvents: events.length,
        driveFiles: files.length,
      },
    });
  });

  app.get("/api/jobs/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    if (id.startsWith("embedding-")) {
      const documentId = id.replace("embedding-", "");
      const embedding = await getEmbeddings(documentId);
      if (!embedding) {
        return reply.status(404).send({ error: "Embedding not found" });
      }
      return reply.send({
        id,
        type: "embeddings",
        status: "completed",
        documentId: embedding.documentId,
        model: embedding.model,
        dimensions: embedding.dimensions,
        generatedAt: embedding.generatedAt,
      });
    }

    const syncStates = await getAllSyncStates();
    const state = syncStates.find((s) => `${s.userId}:${s.service}` === id);

    if (!state) {
      return reply.status(404).send({ error: "Job not found" });
    }

    return reply.send({
      id,
      type: state.service,
      userId: state.userId,
      status: state.error ? "failed" : "completed",
      lastSyncAt: state.lastSyncAt,
      itemCount: state.itemCount,
      error: state.error,
    });
  });

  app.post("/api/jobs/sync/:type", async (request, reply) => {
    const { type } = request.params as { type: string };
    const parsed = triggerSyncSchema.safeParse(request.body ?? {});

    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
    }

    if (!VALID_SYNC_TYPES.includes(type as (typeof VALID_SYNC_TYPES)[number])) {
      return reply
        .status(400)
        .send({ error: `Invalid sync type. Must be one of: ${VALID_SYNC_TYPES.join(", ")}` });
    }

    const jobName = mapTypeToJobName(type);
    if (!jobName) {
      return reply.status(400).send({ error: `Unknown job type: ${type}` });
    }

    const data = parsed.data;
    let jobData: Record<string, unknown>;

    switch (jobName) {
      case JobName.SYNC_EMAIL:
      case JobName.SYNC_CALENDAR:
      case JobName.SYNC_DRIVE:
        jobData = { userId: data.userId };
        break;
      case JobName.GENERATE_EMBEDDINGS:
        jobData = { documentId: data.documentId ?? "unknown" };
        break;
      case JobName.RUN_AGENT:
        jobData = {
          agentId: data.agentId ?? "chief-of-staff",
          userId: data.userId,
          input: data.input ?? "Background task",
        };
        break;
    }

    try {
      const job = await queue.add(jobName, jobData);
      if (!job) {
        return reply.status(503).send({ error: "Queue is not available (Redis not connected)" });
      }

      return reply.status(202).send({
        accepted: true,
        jobId: job.id,
        type,
        message: `Sync ${type} enqueued`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      app.log.error({ err: error }, `Failed to enqueue sync:${type}`);
      return reply.status(500).send({ error: "Failed to enqueue job", message });
    }
  });

  app.get("/api/jobs/agents/status", async (_request, reply) => {
    try {
      const manager = await getAgentManager();
      const agents = manager.listAgents().map((a) => ({
        id: a.id,
        name: a.agent.name,
        status: a.agent.status,
        metrics: a.agent.metrics,
        currentActivity: a.explain().currentActivity,
      }));
      return reply.send({ agents });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({ error: message });
    }
  });
}
