import { createClient, type RedisClientType } from "redis";
import { config } from "../config/index.js";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

let redisClient: RedisClientType | null = null;
let connectionFailed = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getRedisClient(): Promise<RedisClientType | null> {
  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (connectionFailed) {
    return null;
  }

  redisClient = createClient({ url: config.REDIS_URL });

  redisClient.on("error", (error) => {
    console.error("Redis client error:", error);
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await redisClient.connect();
      connectionFailed = false;
      return redisClient;
    } catch (error) {
      console.warn(`Redis connection attempt ${attempt}/${MAX_RETRIES} failed:`, error);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  console.error("Redis unavailable after all retries – continuing in degraded mode");
  connectionFailed = true;
  redisClient = null;
  return null;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient?.isOpen) {
    try {
      await redisClient.quit();
    } catch (error) {
      console.error("Error closing Redis client:", error);
    }
    redisClient = null;
  }
  connectionFailed = false;
}
