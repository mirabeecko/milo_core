import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getAgents,
  getAgent,
  startAgent,
  stopAgent,
  pauseAgent,
  resumeAgent,
  restartAgent,
} from "./agents.api";
import { ApiError } from "./types";

describe("agents.api", () => {
  beforeEach(() => {
    globalThis.localStorage = {
      getItem: vi.fn(() => "demo-token"),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockFetch(response: Response): void {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response)));
  }

  it("getAgents returns parsed agents", async () => {
    const agents = [{ id: "chief-of-staff", name: "Chief of Staff" }];
    mockFetch(new Response(JSON.stringify(agents), { status: 200 }));

    const result = await getAgents();

    expect(result).toEqual(agents);
    expect(fetch).toHaveBeenCalledWith(
      "/api/agents",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer demo-token" }) }),
    );
  });

  it("getAgent returns parsed agent", async () => {
    const agent = { id: "chief-of-staff", name: "Chief of Staff" };
    mockFetch(new Response(JSON.stringify(agent), { status: 200 }));

    const result = await getAgent("chief-of-staff");

    expect(result).toEqual(agent);
    expect(fetch).toHaveBeenCalledWith("/api/agents/chief-of-staff", expect.any(Object));
  });

  it.each([
    ["startAgent", startAgent, "start"],
    ["stopAgent", stopAgent, "stop"],
    ["pauseAgent", pauseAgent, "pause"],
    ["resumeAgent", resumeAgent, "resume"],
    ["restartAgent", restartAgent, "restart"],
  ] as const)("%s sends POST to /agents/:id/%s", async (_name, fn, action) => {
    mockFetch(new Response(JSON.stringify({ status: action }), { status: 200 }));

    await fn("chief-of-staff");

    expect(fetch).toHaveBeenCalledWith(
      `/api/agents/chief-of-staff/${action}`,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("throws ApiError with status and message on error response", async () => {
    mockFetch(new Response("Invalid state transition", { status: 409 }));

    await expect(startAgent("chief-of-staff")).rejects.toMatchObject({
      status: 409,
      message: "API error 409: Invalid state transition",
    });
  });
});
