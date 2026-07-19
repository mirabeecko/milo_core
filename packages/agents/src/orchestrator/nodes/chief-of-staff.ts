/**
 * Chief of Staff Agent Node
 *
 * Koordinátor — plánuje úkoly, deleguje na ostatní agenty,
 * připravuje daily briefing, reportuje vlastníkovi.
 */

import type { AgentNodeFn } from "../graph.js";
import type { AgentStateData } from "../state.js";
import { addActivity, addTask, completeTask } from "../state.js";

export const chiefOfStaffNode: AgentNodeFn = async (state, _signal) => {
  let s: AgentStateData = { ...state };

  // 1. Přemýšlení — co je potřeba udělat
  s = addActivity(s, {
    agentId: "chief-of-staff",
    agentName: "Chief of Staff",
    type: "agent:thinking",
    message: "Analyzuji úkoly a plánuji den...",
  });

  // 2. Vytvoření plánu — přidání úkolů do fronty
  const tasks = [
    {
      id: `task-${Date.now()}-1`,
      title: "Zkontrolovat emaily",
      description: "Projít příchozí emaily a označit důležité",
      priority: "high" as const,
      assignedTo: "communication-agent",
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    },
    {
      id: `task-${Date.now()}-2`,
      title: "Připravit daily briefing",
      description: "Shrnout dnešní kalendář, úkoly a priority",
      priority: "critical" as const,
      assignedTo: "chief-of-staff",
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    },
    {
      id: `task-${Date.now()}-3`,
      title: "Zkontrolovat kalendář na zítra",
      description: "Zjistit kolize a navrhnout úpravy",
      priority: "medium" as const,
      assignedTo: "calendar-agent",
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    },
    {
      id: `task-${Date.now()}-4`,
      title: "Vyhledat informace k projektu",
      description: "Provést rešerši dle aktuálních potřeb",
      priority: "medium" as const,
      assignedTo: "research-agent",
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    },
  ];

  for (const task of tasks) {
    s = addTask(s, task);
  }

  // 3. Vlastní úkol — daily briefing
  const briefingTask = tasks.find((t) => t.assignedTo === "chief-of-staff")!;
  s = addActivity(s, {
    agentId: "chief-of-staff",
    agentName: "Chief of Staff",
    type: "agent:tool_call",
    message: "Připravuji daily briefing...",
    toolName: "briefing-generator",
  });

  // Simulace práce
  s = addActivity(s, {
    agentId: "chief-of-staff",
    agentName: "Chief of Staff",
    type: "agent:tool_result",
    message: "Daily briefing připraven: 3 události dnes, 5 úkolů, 2 priority",
    toolName: "briefing-generator",
    toolResult: {
      events: 3,
      tasks: 5,
      priorities: 2,
      summary: "Den začíná standupem v 9:00, následuje práce na MiLO_Core. Odpoledne schůzka s DJ.",
    },
  });

  s = completeTask(s, briefingTask.id, "Briefing připraven");

  // 4. Report — co se udělalo
  s = addActivity(s, {
    agentId: "chief-of-staff",
    agentName: "Chief of Staff",
    type: "agent:completed",
    message: `Plánování dokončeno. ${s.taskQueue.length} úkolů ve frontě, 1 dokončen.`,
  });

  // 5. Kam dál — delegace na další agenty
  s = { ...s, currentAgent: "communication-agent" };

  return s;
};
