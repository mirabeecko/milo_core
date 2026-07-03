import { createClient, type RedisClientType } from "redis";
import { config } from "../config/index.js";

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient) {
    return redisClient;
  }

  redisClient = createClient({ url: config.REDIS_URL });

  redisClient.on("error", (error) => {
    console.error("Redis client error:", error);
  });

  await redisClient.connect();
  return redisClient;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
