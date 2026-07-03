import { Agent } from "../agent/index.js";

export interface AgentRunOptions {
  input: string;
  traceId: string;
}

export interface AgentRunResult {
  output: string;
  traceId: string;
  completedAt: Date;
}

export class AgentRuntime {
  async run(agent: Agent, options: AgentRunOptions): Promise<AgentRunResult> {
    agent.log("info", "Agent run started", { traceId: options.traceId });

    // TODO: implementovat plánování, volání nástrojů a streamování
    const output = await agent.provider.complete([
      { role: "system", content: agent.systemPrompt.template },
      { role: "user", content: options.input },
    ]);

    agent.log("info", "Agent run completed", { traceId: options.traceId });

    return {
      output,
      traceId: options.traceId,
      completedAt: new Date(),
    };
  }
}
