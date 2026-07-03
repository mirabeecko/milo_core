import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import pino from "pino";
import { config } from "./config/index.js";
import { healthRoutes } from "./modules/health/routes.js";
import { authRoutes } from "./modules/auth/routes.js";
import { briefingRoutes } from "./modules/briefing/routes.js";
import { emailRoutes } from "./modules/email/routes.js";
import { calendarRoutes } from "./modules/calendar/routes.js";
import { closeRedisClient } from "./infrastructure/redis.js";

const logger = pino({
  level: config.LOG_LEVEL,
});

const app = Fastify({
  logger,
});

async function start(): Promise<void> {
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
  await app.register(briefingRoutes, { prefix: "/briefing" });
  await app.register(emailRoutes, { prefix: "/email" });
  await app.register(calendarRoutes, { prefix: "/calendar" });

  app.addHook("onClose", async () => {
    await closeRedisClient();
  });

  try {
    await app.listen({ port: config.API_PORT, host: config.API_HOST });
    app.log.info(`MiLO API running on http://${config.API_HOST}:${config.API_PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();

process.on("SIGTERM", async () => {
  await app.close();
});

process.on("SIGINT", async () => {
  await app.close();
});
