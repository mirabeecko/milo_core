export const bullmqConfig = {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential" as const, delay: 1000 },
    removeOnComplete: { age: 3600 * 24 },
    removeOnFail: { age: 3600 * 24 * 7 },
  },
};
