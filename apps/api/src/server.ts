import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config/index.js";
import { healthRoutes } from "./modules/health/routes.js";
import { authRoutes } from "./modules/auth/routes.js";
import { googleAuthRoutes } from "./modules/auth/google.routes.js";
import { briefingRoutes } from "./modules/briefing/routes.js";
import { emailRoutes } from "./modules/email/routes.js";
import { calendarRoutes } from "./modules/calendar/routes.js";
import { documentsRoutes } from "./modules/documents/routes.js";
import { knowledgeRoutes } from "./modules/knowledge/routes.js";
import { chatRoutes } from "./modules/chat/routes.js";
import { homeRoutes } from "./modules/home/routes.js";
import { agentsRoutes } from "./modules/agents/routes.js";
import { tasksRoutes } from "./modules/tasks/routes.js";
import { missionsRoutes } from "./modules/missions/routes.js";
import { eventsRoutes } from "./modules/events/routes.js";
import { projectsRoutes } from "./modules/projects/routes.js";
import { usageRoutes } from "./routes/usage.js";
import { settingsRoutes } from "./modules/settings/routes.js";
import { backupRoutes } from "./routes/backup.js";
import { notifierRoutes } from "./modules/notifier/routes.js";
import { reviewsRoutes } from "./modules/reviews/routes.js";
import { focusRoutes } from "./modules/focus/routes.js";
import { budgetRoutes } from "./modules/budget/routes.js";
import { controlAgentsRoutes } from "./modules/control/agents.js";
import { controlUseCasesRoutes } from "./modules/control/use-cases.js";
import { controlCapabilitiesRoutes } from "./modules/control/capabilities.js";
import { weeklyRoutes } from "./modules/weekly/routes.js";
import { executiveRoutes } from "./modules/executive/routes.js";
import { exportRoutes } from "./modules/export/routes.js";
import { activityRoutes } from "./modules/activity/routes.js";
import { controlCenterRoutes } from "./modules/control-center/routes.js";
import { phoneTrackerRoutes } from "./modules/phone-tracker/routes.js";
import { testerRoutes } from "./modules/tester/routes.js";

import { startCronScheduler, stopCronScheduler } from "./services/cron-scheduler.js";
import { closeRedisClient, getRedisClient } from "./infrastructure/redis.js";
import { startWorkers, type MiloWorkers } from "./infrastructure/workers.js";
import { closeQueues } from "./queue/index.js";
import { closeWorkers } from "./queue/workers.js";
import { startScheduler } from "./queue/scheduler.js";
import { jobsRoutes } from "./modules/jobs/routes.js";
import { closeAgentManager, startAgentManager } from "./modules/agents/manager.js";
import { mcpRoutes, initializeMcpServers, shutdownMcpServers } from "./modules/mcp/routes.js";

const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 5000;
const DEPENDENCY_RETRY_MAX = 10;
const DEPENDENCY_RETRY_DELAY_MS = 2000;

let workers: MiloWorkers | null = null;

const app = Fastify({
  logger: {
    level: config.LOG_LEVEL,
  },
});

/**
 * Wait for Redis (and optionally Postgres) to be available before starting.
 * In Docker, depends_on only waits for the container to start, not for the
 * service to be ready. This retry loop bridges that gap and also handles
 * transient Redis outages on startup.
 */
async function waitForDependencies(): Promise<void> {
  const startTime = Date.now();

  for (let attempt = 1; attempt <= DEPENDENCY_RETRY_MAX; attempt++) {
    try {
      const redis = await getRedisClient();
      if (redis?.isOpen) {
        app.log.info(`Redis ready after ${attempt} attempt(s) in ${Date.now() - startTime}ms`);
        return;
      }
    } catch {
      // getRedisClient already logs warnings
    }

    if (attempt < DEPENDENCY_RETRY_MAX) {
      app.log.info(
        `Waiting for dependencies... attempt ${attempt}/${DEPENDENCY_RETRY_MAX}, retrying in ${DEPENDENCY_RETRY_DELAY_MS}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, DEPENDENCY_RETRY_DELAY_MS));
    }
  }

  app.log.warn(
    `Dependencies not available after ${DEPENDENCY_RETRY_MAX} attempts (${Date.now() - startTime}ms) — starting in degraded mode`,
  );
}

async function start(): Promise<void> {
  // Čekej na závislosti (DB, Redis) před startem serveru
  // Toto řeší Docker race condition, kde depends_on čeká jen na kontejner, ne službu
  await waitForDependencies();

  await app.register(helmet);
  await app.register(cors, {
    origin: config.NODE_ENV === "development",
  });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(healthRoutes, { prefix: "/" });
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(googleAuthRoutes, { prefix: "/auth" });
  await app.register(briefingRoutes, { prefix: "/briefing" });
  await app.register(emailRoutes, { prefix: "/email" });
  await app.register(calendarRoutes, { prefix: "/calendar" });
  await app.register(documentsRoutes, { prefix: "/documents" });
  await app.register(knowledgeRoutes, { prefix: "/knowledge" });
  await app.register(chatRoutes, { prefix: "/chat" });
  await app.register(homeRoutes, { prefix: "/home" });
  await app.register(agentsRoutes, { prefix: "/agents" });
  await app.register(tasksRoutes, { prefix: "/tasks" });
  await app.register(missionsRoutes, { prefix: "/missions" });
  await app.register(eventsRoutes, { prefix: "/events" });
  await app.register(projectsRoutes, { prefix: "/projects" });
  await app.register(usageRoutes, { prefix: "/usage" });
  await app.register(settingsRoutes, { prefix: "/settings" });
  await app.register(backupRoutes, { prefix: "/backup" });
  await app.register(notifierRoutes, { prefix: "/notifier" });
  await app.register(reviewsRoutes, { prefix: "/reviews" });
  await app.register(focusRoutes, { prefix: "/focus-mode" });
  await app.register(budgetRoutes, { prefix: "/budget" });
  await app.register(weeklyRoutes, { prefix: "/weekly" });
  await app.register(executiveRoutes);
  await app.register(controlAgentsRoutes);
  await app.register(controlUseCasesRoutes);
  await app.register(controlCapabilitiesRoutes);
  await app.register(controlCenterRoutes, { prefix: "/control-center" });
  await app.register(phoneTrackerRoutes, { prefix: "/phone-tracker" });
  await app.register(testerRoutes, { prefix: "/tester" });

  await app.register(jobsRoutes);
  await app.register(exportRoutes, { prefix: "/export" });
  await app.register(mcpRoutes, { prefix: "/mcp" });
  await app.register(activityRoutes);

  app.setErrorHandler((error: Error & { statusCode?: number }, _request, reply) => {
    app.log.error({ err: error }, "Unhandled API error");
    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      error: statusCode >= 500 ? "Internal Server Error" : error.message,
      message: error.message,
    });
  });

  app.addHook("onClose", async () => {
    await closeWorkers();
    await closeQueues();
    await stopCronScheduler();
    await closeAgentManager();
    await shutdownMcpServers();
    if (workers) {
      await workers.closeAll();
    }
    await closeRedisClient();
  });

  try {
    await app.listen({ port: config.API_PORT, host: config.API_HOST });
    app.log.info(`MiLO API running on http://${config.API_HOST}:${config.API_PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }

  try {
    startScheduler();
    app.log.info("BullMQ scheduler started");
  } catch (err) {
    app.log.warn("BullMQ scheduler not started (Redis may be unavailable)");
  }

  try {
    await startAgentManager();
    app.log.info("Agent manager started");
    startCronScheduler();
    app.log.info("Cron scheduler started");
    workers = await startWorkers();
    if (workers.emailWorker) {
      app.log.info("BullMQ workers started");
    } else {
      app.log.warn("BullMQ workers not started (Redis unavailable)");
    }
  } catch (error) {
    app.log.error({ err: error }, "Failed to start agent manager, continuing without agents");
  }

  // Initialize MCP servers (optional — won't block startup on failure)
  try {
    await initializeMcpServers();
    app.log.info("MCP servers initialized");
  } catch (error) {
    app.log.warn({ err: error }, "Failed to initialize MCP servers, continuing without MCP");
  }
}

start();

function gracefulShutdown(signal: string): void {
  app.log.info(`Received ${signal}, starting graceful shutdown...`);
  const forceExitTimer = setTimeout(() => {
    app.log.warn("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);

  void app.close().finally(() => {
    clearTimeout(forceExitTimer);
    app.log.info("Server closed");
    process.exit(0);
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason: unknown) => {
  app.log.error({ err: reason }, "Unhandled rejection – continuing");
});

process.on("uncaughtException", (error: Error) => {
  app.log.fatal({ err: error }, "Uncaught exception – server will shut down gracefully");
  gracefulShutdown("uncaughtException");
});
