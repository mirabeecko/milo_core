import { describe, expect, it } from "vitest";
import { AgentStateMachine } from "./agent-state-machine.js";

describe("AgentStateMachine", () => {
  it("allows offline -> starting -> idle", () => {
    expect(AgentStateMachine.canTransition("offline", "starting")).toBe(true);
    expect(AgentStateMachine.canTransition("starting", "idle")).toBe(true);
  });

  it("allows idle -> working -> paused -> working", () => {
    expect(AgentStateMachine.canTransition("idle", "working")).toBe(true);
    expect(AgentStateMachine.canTransition("working", "paused")).toBe(true);
    expect(AgentStateMachine.canTransition("paused", "working")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(AgentStateMachine.canTransition("offline", "working")).toBe(false);
    expect(AgentStateMachine.canTransition("paused", "offline")).toBe(false);
  });

  it("detects operational statuses", () => {
    expect(AgentStateMachine.isOperational("working")).toBe(true);
    expect(AgentStateMachine.isOperational("thinking")).toBe(true);
    expect(AgentStateMachine.isOperational("idle")).toBe(false);
  });

  it("detects terminal statuses", () => {
    expect(AgentStateMachine.isTerminal("offline")).toBe(true);
    expect(AgentStateMachine.isTerminal("error")).toBe(true);
    expect(AgentStateMachine.isTerminal("idle")).toBe(false);
  });
});
