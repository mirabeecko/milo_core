"use client";

import { useState, useEffect } from "react";

const API = "http://127.0.0.1:4000";

const STATUS_COLS = ["planned", "in_progress", "in_review", "completed", "blocked"];
const STATUS_LABELS: Record<string, string> = {
  planned: "Plánované",
  in_progress: "Probíhá",
  in_review: "V revizi",
  completed: "Hotovo",
  blocked: "Blokované",
};
const STATUS_COLORS: Record<string, string> = {
  planned: "bg-gray-50 border-gray-200",
  in_progress: "bg-blue-50 border-blue-200",
  in_review: "bg-purple-50 border-purple-200",
  completed: "bg-green-50 border-green-200",
  blocked: "bg-red-50 border-red-200",
};

export default function DevelopmentBoardPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"board" | "table">("board");
  const [filterAgent, setFilterAgent] = useState<string>("all");

  // New task
  const [newTitle, setNewTitle] = useState("");
  const [newAgentId, setNewAgentId] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/executive/control/tasks`).then((r) => r.json()),
      fetch(`${API}/executive/control/agents`).then((r) => r.json()),
      fetch(`${API}/executive/control/components`).then((r) => r.json()),
    ]).then(([t, a, c]) => {
      setTasks(t.tasks || []);
      setAgents(a.agents || []);
      setComponents(c.components || []);
      setLoading(false);
    });
  }, []);

  // Pick first agent for new task form
  useEffect(() => {
    if (agents.length > 0 && !newAgentId) setNewAgentId(agents[0].id);
  }, [agents]);

  const filteredTasks = tasks.filter((t: any) =>
    filterAgent === "all" ? true : t.agent_id === filterAgent
  );

  async function updateTaskStatus(taskId: string, status: string) {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status } : t)));
    await fetch(`${API}/executive/control/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function addTask() {
    if (!newTitle.trim() || !newAgentId) return;
    setAdding(true);
    const res = await fetch(`${API}/executive/control/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: newAgentId, title: newTitle, task_type: "implementation" }),
    });
    if (res.ok) {
      const t = await res.json();
      setTasks([t, ...tasks]);
      setNewTitle("");
    }
    setAdding(false);
  }

  function handleDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.setData("taskId", taskId);
  }

  function handleDrop(e: React.DragEvent, status: string) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) updateTaskStatus(taskId, status);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function getAgentName(agentId: string) {
    return agents.find((a: any) => a.id === agentId)?.name || agentId;
  }

  if (loading) return <div className="p-8">Načítání...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Development Board</h1>
        <div className="flex gap-3 items-center">
          <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} className="border rounded-lg p-2 text-sm">
            <option value="all">Všichni agenti</option>
            {agents.map((a: any) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <div className="flex border rounded-lg overflow-hidden">
            <button onClick={() => setView("board")} className={`px-3 py-1.5 text-sm ${view === "board" ? "bg-primary text-primary-foreground" : ""}`}>Board</button>
            <button onClick={() => setView("table")} className={`px-3 py-1.5 text-sm ${view === "table" ? "bg-primary text-primary-foreground" : ""}`}>Tabulka</button>
          </div>
        </div>
      </div>

      {/* New task form */}
      <div className="flex gap-2 max-w-2xl">
        <input
          className="flex-1 border rounded-lg p-2 text-sm"
          placeholder="Nový úkol..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <select value={newAgentId} onChange={(e) => setNewAgentId(e.target.value)} className="border rounded-lg p-2 text-sm">
          {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <button onClick={addTask} disabled={adding} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
          {adding ? "..." : "Přidat"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STATUS_COLS.map((s) => (
          <div key={s} className={`border rounded-lg p-3 ${STATUS_COLORS[s]}`}>
            <div className="text-xs text-muted-foreground">{STATUS_LABELS[s]}</div>
            <div className="text-xl font-bold">{filteredTasks.filter((t: any) => t.status === s).length}</div>
          </div>
        ))}
      </div>

      {view === "board" ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {STATUS_COLS.map((status) => (
            <div
              key={status}
              className={`border rounded-lg p-3 min-h-[200px] ${STATUS_COLORS[status]}`}
              onDrop={(e) => handleDrop(e, status)}
              onDragOver={handleDragOver}
            >
              <h3 className="font-medium text-sm mb-2 flex justify-between">
                {STATUS_LABELS[status]}
                <span className="text-xs text-muted-foreground">{filteredTasks.filter((t: any) => t.status === status).length}</span>
              </h3>
              <div className="space-y-2">
                {filteredTasks.filter((t: any) => t.status === status).map((t: any) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, t.id)}
                    className="bg-white border rounded-lg p-3 text-sm cursor-move hover:shadow-md transition-shadow"
                  >
                    <div className="font-medium">{t.title}</div>
                    <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{getAgentName(t.agent_id)}</span>
                      <span>·</span>
                      <span>{t.task_type}</span>
                    </div>
                    {t.blocked_reason && (
                      <div className="mt-1 text-xs text-red-500">🚫 {t.blocked_reason}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Úkol</th>
                <th className="text-left p-2">Agent</th>
                <th className="text-left p-2">Typ</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Akce</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t: any) => (
                <tr key={t.id} className="border-t">
                  <td className="p-2 font-medium">{t.title}</td>
                  <td className="p-2 text-xs">{getAgentName(t.agent_id)}</td>
                  <td className="p-2 text-xs">{t.task_type}</td>
                  <td className="p-2">
                    <select
                      value={t.status}
                      onChange={(e) => updateTaskStatus(t.id, e.target.value)}
                      className="text-xs border rounded px-2 py-0.5"
                    >
                      {STATUS_COLS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </td>
                  <td className="p-2 text-xs">
                    {t.blocked_reason && <span className="text-red-500 mr-2">🚫 {t.blocked_reason}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Component overview */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Implementační komponenty ({components.length})</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Název</th>
                <th className="text-left p-2">Typ</th>
                <th className="text-left p-2">Soubor</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Testy</th>
              </tr>
            </thead>
            <tbody>
              {components.map((c: any) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2 font-medium">{c.name}</td>
                  <td className="p-2 text-xs">{c.component_type}</td>
                  <td className="p-2 text-xs font-mono text-muted-foreground">{c.file_path || "—"}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      c.implementation_status === "implemented" ? "bg-green-100 text-green-800" :
                      c.implementation_status === "in_progress" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-600"
                    }`}>{c.implementation_status}</span>
                  </td>
                  <td className="p-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      c.test_status === "tested" ? "bg-green-100 text-green-800" :
                      c.test_status === "partial" ? "bg-amber-100 text-amber-800" :
                      "bg-gray-100 text-gray-500"
                    }`}>{c.test_status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
