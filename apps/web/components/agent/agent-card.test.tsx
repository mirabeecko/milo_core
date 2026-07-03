import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentCard } from "./agent-card";
import type { Agent } from "@/lib/types";

function createAgent(status: Agent["state"]["status"]): Agent {
  const now = new Date().toISOString();
  return {
    id: "chief-of-staff",
    name: "Chief of Staff",
    description: "Koordinátor",
    role: "coordinator",
    specialization: "daily briefing",
    priority: "critical",
    status,
    health: { status: "healthy", lastHeartbeat: now },
    metrics: { totalTasks: 0, successfulTasks: 0, failedTasks: 0, retriedTasks: 0, averageDurationMs: 0, errorCount: 0, lastUpdatedAt: now },
    config: {
      model: "gpt-4o",
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt: "...",
      knowledge: [],
      tools: [],
      permissions: { canRead: [], canWrite: [], canExecute: [] },
      retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      timeoutMs: 120000,
    },
    memory: {},
    createdAt: now,
    updatedAt: now,
    state: {
      status,
      taskProgress: 0,
      explanation: {
        currentActivity: "Test",
        goal: "Test",
        reason: "Test",
        findings: "Test",
        evidence: [],
        toolsUsed: [],
        nextStep: "Test",
        estimatedCompletion: "Neurčito",
        risks: "Žádná",
        needsFromUser: "Nic",
        lastCompletedStep: "Test",
        confidence: "100 %",
        alternativeApproach: "Žádný",
        decisionLog: [],
        updatedAt: now,
      },
      pendingTasks: 0,
      runningTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      runningTimeMs: 0,
      lastActivityAt: now,
    },
  };
}

describe("AgentCard", () => {
  it("renders Start for offline agent and calls onStart", () => {
    const onStart = vi.fn();
    render(<AgentCard agent={createAgent("offline")} onStart={onStart} />);

    const startButton = screen.getByRole("button", { name: /^Start$/i });
    expect(startButton).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Stop$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Pause$/i })).not.toBeInTheDocument();

    fireEvent.click(startButton);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("renders Stop and Pause for working agent", () => {
    render(<AgentCard agent={createAgent("working")} />);

    expect(screen.getByRole("button", { name: /^Stop$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Pause$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Start$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Resume$/i })).not.toBeInTheDocument();
  });

  it("renders Resume for paused agent", () => {
    render(<AgentCard agent={createAgent("paused")} />);

    expect(screen.getByRole("button", { name: /^Resume$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Pause$/i })).not.toBeInTheDocument();
  });

  it("renders Restart for all states", () => {
    render(<AgentCard agent={createAgent("offline")} />);
    expect(screen.getByRole("button", { name: /Restart/i })).toBeInTheDocument();
  });

  it("renders Detail link", () => {
    render(<AgentCard agent={createAgent("idle")} />);

    const detailLink = screen.getByRole("link", { name: /Detail/i });
    expect(detailLink).toHaveAttribute("href", "/agents/chief-of-staff");
  });

  it("shows loading spinner when actionLoading matches", () => {
    const { container } = render(<AgentCard agent={createAgent("offline")} actionLoading="start" />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });
});
