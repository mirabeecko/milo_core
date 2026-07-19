import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "../client";

describe("apiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("calls fetch with correct URL and headers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })),
      ),
    );

    await apiClient("/test");
    expect(fetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("throws ApiError on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(new Response("Not found", { status: 404 })),
      ),
    );

    await expect(apiClient("/test")).rejects.toThrow("API error 404");
  });

  it("includes auth token when available", async () => {
    localStorage.setItem("milo:accessToken", "test-token");
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })),
      ),
    );

    await apiClient("/test");
    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    expect(callArgs.headers).toMatchObject({ Authorization: "Bearer test-token" });
  });
});
