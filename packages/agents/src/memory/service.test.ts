import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryAgentMemoryRepository } from "@milo/database";
import { RepositoryMemoryStorage } from "./storage.js";
import { AgentMemoryImpl } from "./service.js";

describe("AgentMemory", () => {
  let memory: AgentMemoryImpl;

  beforeEach(() => {
    const repo = new InMemoryAgentMemoryRepository();
    const storage = new RepositoryMemoryStorage(repo);
    memory = new AgentMemoryImpl("agent-1", storage);
  });

  it("stores and recalls long-term memory", async () => {
    await memory.remember("long_term", "user-name", "Martin", 0.9);
    const value = await memory.recall("long_term", "user-name");
    expect(value).toBe("Martin");
  });

  it("expires short-term memory", async () => {
    await memory.remember("short_term", "temp", "value", -1000);
    const value = await memory.recall("short_term", "temp");
    expect(value).toBeUndefined();
  });

  it("stores working context", async () => {
    await memory.setWorkingContext("active-task", "review code");
    const context = await memory.getWorkingContext();
    expect(context["active-task"]).toBe("review code");
  });

  it("stores episodes and experiences", async () => {
    await memory.addEpisode("task-1", { title: "Fix bug" });
    await memory.addExperience("lessons", "Always write tests");

    const episodes = await memory.getRecentEpisodes();
    expect(episodes).toHaveLength(1);
    expect(episodes[0].value).toEqual({ title: "Fix bug" });

    const experiences = await memory.getExperiences();
    expect(experiences).toHaveLength(1);
    expect(experiences[0].value).toBe("Always write tests");
  });

  it("consolidates short-term into long-term", async () => {
    await memory.remember("short_term", "important-fact", "fact", 0.9);
    await memory.remember("short_term", "low-priority", "noise", 0.1);

    await memory.consolidate("short_term", "long_term", 0.7);

    const longTerm = await memory.recall("long_term", "important-fact");
    expect(longTerm).toBe("fact");

    const shortTerm = await memory.recall("short_term", "important-fact");
    expect(shortTerm).toBeUndefined();
  });
});
