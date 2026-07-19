/** Research Agent Node — rešerše, analýza informací, web search */

import type { AgentNodeFn } from "../graph.js";
import { addActivity, completeTask } from "../state.js";

export const researchAgentNode: AgentNodeFn = async (state, _signal) => {
  let s = { ...state };

  s = addActivity(s, {
    agentId: "research-agent",
    agentName: "Research Agent",
    type: "agent:thinking",
    message: "Spouštím rešerši...",
  });

  const myTasks = s.taskQueue.filter((t) => t.assignedTo === "research-agent" && t.status === "pending");
  for (const task of myTasks) {
    s = addActivity(s, {
      agentId: "research-agent",
      agentName: "Research Agent",
      type: "agent:tool_call",
      message: `Hledám: ${task.description}`,
      toolName: "web-search",
    });

    s = completeTask(s, task.id, "Rešerše dokončena");
  }

  s = addActivity(s, {
    agentId: "research-agent",
    agentName: "Research Agent",
    type: "agent:completed",
    message: `Rešerše hotova. ${myTasks.length} úkolů dokončeno.`,
  });

  s = { ...s, currentAgent: "" };
  return s;
};
