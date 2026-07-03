import { describe, expect, it } from "vitest";
import { AgentScheduler } from "./agent-scheduler.js";

describe("AgentScheduler", () => {
  it("schedules a one-time job", async () => {
    const scheduler = new AgentScheduler(50);
    let called = false;
    scheduler.scheduleAt(Date.now() + 100, () => {
      called = true;
    });
    scheduler.start();
    await new Promise((resolve) => setTimeout(resolve, 250));
    scheduler.stop();
    expect(called).toBe(true);
  });

  it("schedules an interval job", async () => {
    const scheduler = new AgentScheduler(50);
    let count = 0;
    scheduler.scheduleInterval(100, () => {
      count += 1;
    });
    scheduler.start();
    await new Promise((resolve) => setTimeout(resolve, 300));
    scheduler.stop();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("cancels a job", async () => {
    const scheduler = new AgentScheduler(50);
    let called = false;
    const id = scheduler.scheduleAt(Date.now() + 200, () => {
      called = true;
    });
    scheduler.cancel(id);
    scheduler.start();
    await new Promise((resolve) => setTimeout(resolve, 300));
    scheduler.stop();
    expect(called).toBe(false);
  });
});
