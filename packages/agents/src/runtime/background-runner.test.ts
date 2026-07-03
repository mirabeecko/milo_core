import { describe, expect, it } from "vitest";
import { BackgroundRunner } from "./background-runner.js";

describe("BackgroundRunner", () => {
  it("completes a job", async () => {
    const runner = new BackgroundRunner();
    const result = await runner.run("j1", async () => "done", 1000);
    expect(result).toBe("done");
    expect(runner.getJob("j1")?.status).toBe("completed");
  });

  it("times out long jobs", async () => {
    const runner = new BackgroundRunner();
    await expect(
      runner.run(
        "j1",
        async () => new Promise((resolve) => setTimeout(resolve, 500)),
        50,
      ),
    ).rejects.toThrow("timed out");
    expect(runner.getJob("j1")?.status).toBe("timed_out");
  });

  it("cancels a job", async () => {
    const runner = new BackgroundRunner();
    const promise = runner.run(
      "j1",
      async () => new Promise((resolve) => setTimeout(resolve, 500)),
      1000,
    );
    runner.cancel("j1");
    await expect(promise).rejects.toThrow("cancelled");
    expect(runner.getJob("j1")?.status).toBe("cancelled");
  });
});
