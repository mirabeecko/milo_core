/** Knowledge Agent Node — znalostní báze, vektorové vyhledávání, indexace */

import type { AgentNodeFn } from "../graph.js";
import { addActivity, completeTask } from "../state.js";

export const knowledgeAgentNode: AgentNodeFn = async (state, _signal) => {
  let s = { ...state };

  s = addActivity(s, {
    agentId: "knowledge-agent",
    agentName: "Knowledge Agent",
    type: "agent:thinking",
    message: "Prohledávám znalostní bázi...",
  });

  const myTasks = s.taskQueue.filter((t) => t.assignedTo === "knowledge-agent" && t.status === "pending");
  for (const task of myTasks) {
    s = completeTask(s, task.id, "Znalosti indexovány");
  }

  s = addActivity(s, {
    agentId: "knowledge-agent",
    agentName: "Knowledge Agent",
    type: "agent:completed",
    message: "Znalostní báze aktualizována.",
  });

  s = { ...s, currentAgent: "" };
  return s;
};
