/** Communication Agent Node — email, zprávy, WhatsApp, ISDS */

import type { AgentNodeFn } from "../graph.js";
import { addActivity, completeTask } from "../state.js";

export const communicationAgentNode: AgentNodeFn = async (state, _signal) => {
  let s = { ...state };

  s = addActivity(s, {
    agentId: "communication-agent",
    agentName: "Communication Agent",
    type: "agent:thinking",
    message: "Kontroluji příchozí zprávy...",
  });

  s = addActivity(s, {
    agentId: "communication-agent",
    agentName: "Communication Agent",
    type: "agent:tool_call",
    message: "Připojuji se ke Gmail API...",
    toolName: "gmail-inbox",
  });

  s = addActivity(s, {
    agentId: "communication-agent",
    agentName: "Communication Agent",
    type: "agent:tool_result",
    message: "Nalezeno 20 nepřečtených emailů za poslední týden",
    toolName: "gmail-inbox",
    toolResult: { unread: 20, period: "7d" },
  });

  // Zpracování úkolů
  const myTasks = s.taskQueue.filter((t) => t.assignedTo === "communication-agent" && t.status === "pending");
  for (const task of myTasks) {
    s = completeTask(s, task.id, "Emaily zpracovány");
  }

  s = addActivity(s, {
    agentId: "communication-agent",
    agentName: "Communication Agent",
    type: "agent:completed",
    message: "Hotovo. Zpracovány komunikační úkoly.",
  });
  s = { ...s, currentAgent: "" };

  return s;
};
