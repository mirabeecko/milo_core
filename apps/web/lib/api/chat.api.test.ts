import { describe, it, expect, vi, afterEach } from "vitest";
import { sendMessage } from "./chat.api";

describe("chat.api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends a message and returns response", async () => {
    const mockResponse = {
      message: {
        id: "msg-1",
        role: "assistant",
        content: "Ahoj!",
        timestamp: "2026-01-01T00:00:00Z",
        sources: [],
        suggestedActions: [],
      },
      conversationId: "conv-1",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(new Response(JSON.stringify(mockResponse), { status: 200 })),
      ),
    );

    const result = await sendMessage({ message: "Ahoj" });
    expect(result.message.content).toBe("Ahoj!");
    expect(result.conversationId).toBe("conv-1");
  });

  it("returns fallback on network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("Network error"))),
    );

    const result = await sendMessage({ message: "test" });
    expect(result.message.role).toBe("assistant");
    expect(result.message.content).toContain("není dostupné");
  });

  it("returns fallback on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(new Response("Server error", { status: 500 })),
      ),
    );

    const result = await sendMessage({ message: "test" });
    expect(result.message.content).toContain("není dostupné");
  });
});
