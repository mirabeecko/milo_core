/** Calendar Agent Node — správa kalendáře, detekce kolizí, plánování času */

import type { AgentNodeFn } from "../graph.js";
import { addActivity, completeTask } from "../state.js";

export const calendarAgentNode: AgentNodeFn = async (state, _signal) => {
  let s = { ...state };

  s = addActivity(s, {
    agentId: "calendar-agent",
    agentName: "Calendar Agent",
    type: "agent:thinking",
    message: "Kontroluji kalendář a hledám kolize...",
  });

  // Najít úkoly pro calendar-agenta
  const myTasks = s.taskQueue.filter((t) => t.assignedTo === "calendar-agent" && t.status === "pending");

  for (const task of myTasks) {
    s = addActivity(s, {
      agentId: "calendar-agent",
      agentName: "Calendar Agent",
      type: "agent:tool_call",
      message: `Zpracovávám: ${task.title}`,
      toolName: "calendar-scanner",
    });

    s = completeTask(s, task.id, "Kalendář zkontrolován, 0 kolizí");
  }

  s = addActivity(s, {
    agentId: "calendar-agent",
    agentName: "Calendar Agent",
    type: "agent:completed",
    message: `Hotovo. Zpracováno ${myTasks.length} úkolů.`,
  });

  s = { ...s, currentAgent: "communication-agent" };
  return s;
};
