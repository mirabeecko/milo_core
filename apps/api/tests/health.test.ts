import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import { healthRoutes } from "../src/modules/health/routes.js";

const app = Fastify();

beforeAll(async () => {
  await app.register(healthRoutes, { prefix: "/" });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("Health routes", () => {
  it("GET /health returns ok", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body) as { status: string };
    expect(body.status).toBe("ok");
  });

  it("GET /ready returns ready", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/ready",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body) as { status: string };
    expect(body.status).toBe("ready");
  });
});
