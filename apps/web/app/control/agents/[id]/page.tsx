"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

const API = "http://127.0.0.1:4000";

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "spec" | "versions" | "tasks" | "missions" | "audit">("overview");

  // Spec editor state
  const [spec, setSpec] = useState<Record<string, any>>({});
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API}/executive/control/agents/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setAgent(d);
        setSpec(d.specification || defaultSpec(d));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  function defaultSpec(a: any) {
    return {
      purpose: a.purpose || "",
      responsibilities: [""],
      not_responsible_for: [""],
      rules: [""],
      decision_principles: [""],
      communication_style: "profesionální",
      uncertainty_handling: "označit nejistotu",
      read_only: [""],
      can_write: [""],
      requires_approval: [""],
      forbidden: [""],
      preferred_model: "",
      fallback_model: "",
      max_cost: 0,
      max_runtime: 300,
      test_scenarios: [""],
      definition_of_done: [""],
    };
  }

  async function saveVersion(status: string) {
    setSaving(true);
    const finalSpec = jsonMode ? JSON.parse(jsonText) : spec;
    const res = await fetch(`${API}/executive/control/agents/${params.id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specification: finalSpec, change_summary: changeSummary, status, created_by: "owner" }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (status === "ready") router.refresh();
    }
  }

  // ─── Versions ─────────────────────────────────────────────────────

  const [versions, setVersions] = useState<any[]>([]);
  const [diffResult, setDiffResult] = useState<any>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffFrom, setDiffFrom] = useState<number>(0);
  const [diffTo, setDiffTo] = useState<number>(0);

  // Impact analysis
  const [impactResult, setImpactResult] = useState<any>(null);
  const [impactLoading, setImpactLoading] = useState(false);

  useEffect(() => {
    if (tab === "versions") {
      fetch(`${API}/executive/control/agents/${params.id}/versions`)
        .then((r) => r.json())
        .then((d) => setVersions(d.versions || []));
    }
  }, [params.id, tab]);

  async function runDiff() {
    if (!diffFrom || !diffTo) return;
    setDiffLoading(true);
    const res = await fetch(`${API}/executive/control/agents/${params.id}/diff?from=${diffFrom}&to=${diffTo}`, {
      method: "POST",
    });
    const d = await res.json();
    setDiffResult(d);
    setDiffLoading(false);
  }

  async function runImpactAnalysis() {
    setImpactLoading(true);
    const res = await fetch(`${API}/executive/control/agents/${params.id}/impact-analysis`, {
      method: "POST",
    });
    const d = await res.json();
    setImpactResult(d);
    setImpactLoading(false);
  }

  // ─── Tasks ─────────────────────────────────────────────────────────

  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  useEffect(() => {
    if (tab === "tasks") {
      fetch(`${API}/executive/control/tasks?agent_id=${params.id}`)
        .then((r) => r.json())
        .then((d) => setTasks(d.tasks || []));
    }
  }, [params.id, tab]);

  async function addTask() {
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    const res = await fetch(`${API}/executive/control/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: params.id, title: newTaskTitle, task_type: "implementation" }),
    });
    if (res.ok) {
      const t = await res.json();
      setTasks([t, ...tasks]);
      setNewTaskTitle("");
    }
    setAddingTask(false);
  }

  async function updateTaskStatus(taskId: string, status: string) {
    await fetch(`${API}/executive/control/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status } : t)));
  }

  // ─── Missions ──────────────────────────────────────────────────────

  const [missions, setMissions] = useState<any[]>([]);
  const [newMissionTitle, setNewMissionTitle] = useState("");
  const [newMissionDesc, setNewMissionDesc] = useState("");
  const [addingMission, setAddingMission] = useState(false);

  useEffect(() => {
    if (tab === "missions") {
      fetch(`${API}/executive/control/missions?agent_id=${params.id}`)
        .then((r) => r.json())
        .then((d) => setMissions(d.missions || []));
    }
  }, [params.id, tab]);

  async function addMission() {
    if (!newMissionTitle.trim()) return;
    setAddingMission(true);
    const res = await fetch(`${API}/executive/control/missions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: params.id, title: newMissionTitle, description: newMissionDesc }),
    });
    if (res.ok) {
      const m = await res.json();
      setMissions([m, ...missions]);
      setNewMissionTitle("");
      setNewMissionDesc("");
    }
    setAddingMission(false);
  }

  async function startMission(mid: string) {
    await fetch(`${API}/executive/control/missions/${mid}/start`, { method: "POST" });
    setMissions(missions.map((m) => (m.id === mid ? { ...m, status: "in_progress" } : m)));
  }

  // ─── Audit ─────────────────────────────────────────────────────────

  const [audits, setAudits] = useState<any[]>([]);
  const [auditRunning, setAuditRunning] = useState(false);

  useEffect(() => {
    if (tab === "audit") {
      fetch(`${API}/executive/control/audits?agent_id=${params.id}`)
        .then((r) => r.json())
        .then((d) => setAudits(d.audits || []));
    }
  }, [params.id, tab]);

  async function runAudit() {
    setAuditRunning(true);
    const res = await fetch(`${API}/executive/control/audit/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: params.id }),
    });
    if (res.ok) {
      const a = await res.json();
      setAudits([a, ...audits]);
    }
    setAuditRunning(false);
  }

  // ─── Developer Prompt ──────────────────────────────────────────────

  const [devPrompt, setDevPrompt] = useState<string>("");
  const [devPromptLoading, setDevPromptLoading] = useState(false);

  async function generateDevPrompt() {
    setDevPromptLoading(true);
    const res = await fetch(`${API}/executive/control/agents/${params.id}/developer-prompt`, {
      method: "POST",
    });
    const d = await res.json();
    setDevPrompt(d.prompt || "");
    setDevPromptLoading(false);
  }

  // ─── Deploy ────────────────────────────────────────────────────────

  const [deploying, setDeploying] = useState(false);
  const [deployEnv, setDeployEnv] = useState("staging");

  async function deploy() {
    setDeploying(true);
    await fetch(`${API}/executive/control/deployments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: params.id, environment: deployEnv }),
    });
    setDeploying(false);
  }

  // ─── Render ────────────────────────────────────────────────────────

  if (loading) return <div className="p-8">Načítání...</div>;
  if (!agent) return <div className="p-8 text-red-500">Agent nenalezen</div>;

  const TABS: [string, string][] = [
    ["overview", "Přehled"],
    ["spec", "Specifikace"],
    ["versions", "Verze"],
    ["tasks", "Úkoly"],
    ["missions", "Mise"],
    ["audit", "Audit"],
  ];

  function diffColor(ct: string) {
    return ct === "added" ? "text-green-600" : ct === "removed" ? "text-red-600" : "text-amber-600";
  }

  function verdictColor(v: string) {
    return v === "pass" ? "bg-green-100 text-green-800" : v === "conditional_pass" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800";
  }

  function severityColor(s: string) {
    return s === "high" ? "text-red-600" : s === "medium" ? "text-amber-600" : s === "low" ? "text-blue-600" : "text-gray-500";
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <p className="text-muted-foreground">{agent.description}</p>
        </div>
        <div className="flex gap-2 items-center">
          <select value={deployEnv} onChange={(e) => setDeployEnv(e.target.value)} className="text-xs border rounded px-2 py-1">
            <option value="staging">Staging</option>
            <option value="production">Produkce</option>
          </select>
          <button onClick={deploy} disabled={deploying} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
            {deploying ? "Nasazuji..." : "Nasazovat ✦"}
          </button>
        </div>
      </div>

      <div className="flex gap-6 border-b flex-wrap">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as any)} className={`pb-2 text-sm ${tab === key ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Kategorie", agent.category],
              ["Vlastník", agent.owner],
              ["Status", agent.status],
              ["Progress", `${agent.implementation_progress}%`],
            ].map(([label, val]) => (
              <div key={label} className="border rounded-lg p-3">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="font-medium">{val || "—"}</div>
              </div>
            ))}
          </div>

          {/* Dev prompt button */}
          <div className="flex gap-2">
            <button onClick={generateDevPrompt} disabled={devPromptLoading} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
              {devPromptLoading ? "Generuji..." : "Generovat Developer Prompt"}
            </button>
            <button onClick={runImpactAnalysis} disabled={impactLoading} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
              {impactLoading ? "Analyzuji..." : "Spustit dopadovou analýzu"}
            </button>
          </div>

          {devPrompt && (
            <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap">{devPrompt}</pre>
            </div>
          )}

          {impactResult && (
            <div className="space-y-4 border rounded-lg p-4">
              <h2 className="text-lg font-semibold">Dopadová analýza</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ["Změn", impactResult.summary?.change_count],
                  ["Riziko", impactResult.summary?.risk_level],
                  ["Use Cases dokončeno", `${impactResult.summary?.implemented_use_cases}/${impactResult.summary?.total_use_cases}`],
                  ["Komponent hotovo", `${impactResult.summary?.implemented_components}/${impactResult.summary?.total_components}`],
                ].map(([label, val]) => (
                  <div key={label} className="border rounded-lg p-2">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="font-medium">{val ?? "—"}</div>
                  </div>
                ))}
              </div>
              {impactResult.risks?.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm text-red-600 mb-1">Rizika</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {impactResult.risks.map((r: string, i: number) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
              {impactResult.new_tasks_required?.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm mb-1">Potřebné nové úkoly ({impactResult.new_tasks_required.length})</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {impactResult.new_tasks_required.slice(0, 5).map((t: string, i: number) => <li key={i}>{t}</li>)}
                    {impactResult.new_tasks_required.length > 5 && <li>...a dalších {impactResult.new_tasks_required.length - 5}</li>}
                  </ul>
                </div>
              )}
            </div>
          )}

          <h2 className="text-xl font-semibold">Use Cases ({agent.use_cases?.length || 0})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(agent.use_cases || []).map((uc: any) => (
              <div key={uc.id} className="border rounded-lg p-4">
                <h3 className="font-semibold">{uc.name}</h3>
                <p className="text-sm text-muted-foreground">{uc.description}</p>
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{uc.category}</span><span>·</span><span>{uc.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "spec" && (
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Editor specifikace</h2>
            <button onClick={() => { setJsonMode(!jsonMode); if (!jsonMode) setJsonText(JSON.stringify(spec, null, 2)); else setSpec(JSON.parse(jsonText)); }} className="text-sm text-primary">
              {jsonMode ? "Formulář" : "JSON editor"}
            </button>
          </div>

          {jsonMode ? (
            <textarea
              className="w-full h-96 font-mono text-sm border rounded-lg p-4"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
            />
          ) : (
            <div className="space-y-4">
              {[
                ["purpose", "Účel", "textarea"],
                ["communication_style", "Styl komunikace", "text"],
                ["preferred_model", "Preferovaný model", "text"],
                ["fallback_model", "Fallback model", "text"],
                ["max_cost", "Max cena (Kč)", "number"],
                ["max_runtime", "Max runtime (s)", "number"],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  {type === "textarea" ? (
                    <textarea className="w-full border rounded-lg p-2 text-sm" rows={3} value={spec[key] || ""} onChange={(e) => setSpec({ ...spec, [key]: e.target.value })} />
                  ) : (
                    <input type={type} className="w-full border rounded-lg p-2 text-sm" value={spec[key] || ""} onChange={(e) => setSpec({ ...spec, [key]: type === "number" ? Number(e.target.value) : e.target.value })} />
                  )}
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium mb-1">Shrnutí změny</label>
                <input className="w-full border rounded-lg p-2 text-sm" value={changeSummary} onChange={(e) => setChangeSummary(e.target.value)} placeholder="Co jste změnili a proč?" />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => saveVersion("draft")} disabled={saving} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
              {saving ? "Ukládám..." : saved ? "✓ Uloženo" : "Uložit koncept"}
            </button>
            <button onClick={() => saveVersion("ready")} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
              Publikovat verzi
            </button>
          </div>
        </div>
      )}

      {tab === "versions" && (
        <div className="space-y-6 max-w-4xl">
          <h2 className="text-lg font-semibold">Historie verzí ({versions.length})</h2>
          {versions.length === 0 && <p className="text-muted-foreground text-sm">Žádné verze</p>}

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">#</th>
                  <th className="text-left p-2">Label</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Shrnutí</th>
                  <th className="text-left p-2">Vytvořeno</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v: any) => (
                  <tr key={v.id} className="border-t">
                    <td className="p-2 font-mono">v{v.version_number}</td>
                    <td className="p-2">{v.version_label || "—"}</td>
                    <td className="p-2"><span className={`px-2 py-0.5 rounded text-xs ${v.status === "ready" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{v.status}</span></td>
                    <td className="p-2 text-xs text-muted-foreground">{v.change_summary || "—"}</td>
                    <td className="p-2 text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString("cs")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {versions.length >= 2 && (
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">Porovnat verze</h3>
              <div className="flex gap-3 items-end">
                <div>
                  <label className="text-xs text-muted-foreground">Od verze</label>
                  <select value={diffFrom} onChange={(e) => setDiffFrom(Number(e.target.value))} className="w-full border rounded p-1 text-sm">
                    <option value={0}>Vyberte...</option>
                    {versions.map((v: any) => <option key={v.id} value={v.version_number}>v{v.version_number}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Do verze</label>
                  <select value={diffTo} onChange={(e) => setDiffTo(Number(e.target.value))} className="w-full border rounded p-1 text-sm">
                    <option value={0}>Vyberte...</option>
                    {versions.map((v: any) => <option key={v.id} value={v.version_number}>v{v.version_number}</option>)}
                  </select>
                </div>
                <button onClick={runDiff} disabled={diffLoading || !diffFrom || !diffTo} className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-sm">
                  {diffLoading ? "..." : "Porovnat"}
                </button>
              </div>

              {diffResult && (
                <div className="space-y-3">
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">v{diffResult.from_version} → v{diffResult.to_version}</span>
                    <span className="text-green-600">+{diffResult.changed_sections?.filter((c: any) => c.change_type === "added").length || 0} přidáno</span>
                    <span className="text-red-600">-{diffResult.changed_sections?.filter((c: any) => c.change_type === "removed").length || 0} odebráno</span>
                    <span className="text-amber-600">~{diffResult.changed_sections?.filter((c: any) => c.change_type === "modified").length || 0} změněno</span>
                  </div>
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {diffResult.changed_sections?.map((ch: any, i: number) => (
                      <div key={i} className={`text-xs p-2 rounded ${ch.change_type === "added" ? "bg-green-50" : ch.change_type === "removed" ? "bg-red-50" : "bg-amber-50"}`}>
                        <span className={`font-medium ${diffColor(ch.change_type)}`}>[{ch.change_type}]</span>{" "}
                        <span className="font-mono">{ch.path}</span>
                        {ch.old_value != null && ch.new_value != null && (
                          <div className="mt-1 text-muted-foreground">
                            <span className="line-through text-red-400">{JSON.stringify(ch.old_value).slice(0, 60)}</span>
                            {" → "}
                            <span className="text-green-600">{JSON.stringify(ch.new_value).slice(0, 60)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {diffResult.unchanged_sections?.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Nezměněno: {diffResult.unchanged_sections.join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "tasks" && (
        <div className="space-y-4 max-w-3xl">
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-lg p-2 text-sm"
              placeholder="Nový úkol..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
            />
            <button onClick={addTask} disabled={addingTask} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
              {addingTask ? "..." : "Přidat"}
            </button>
          </div>
          {tasks.length === 0 && <p className="text-muted-foreground text-sm">Žádné úkoly</p>}
          {tasks.map((t) => (
            <div key={t.id} className="border rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.status} · {t.task_type}</div>
              </div>
              <select
                className="text-xs border rounded px-2 py-1"
                value={t.status}
                onChange={(e) => updateTaskStatus(t.id, e.target.value)}
              >
                {["planned", "in_progress", "in_review", "completed", "blocked"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {tab === "missions" && (
        <div className="space-y-4 max-w-3xl">
          <h2 className="text-lg font-semibold">Mise ({missions.length})</h2>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-lg p-2 text-sm"
              placeholder="Název mise..."
              value={newMissionTitle}
              onChange={(e) => setNewMissionTitle(e.target.value)}
            />
            <input
              className="flex-1 border rounded-lg p-2 text-sm"
              placeholder="Popis (volitelné)..."
              value={newMissionDesc}
              onChange={(e) => setNewMissionDesc(e.target.value)}
            />
            <button onClick={addMission} disabled={addingMission} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
              {addingMission ? "..." : "Vytvořit misi"}
            </button>
          </div>

          {missions.length === 0 && <p className="text-muted-foreground text-sm">Žádné mise</p>}

          {/* Kanban board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["planned", "in_progress", "completed"].map((status) => (
              <div key={status} className="border rounded-lg p-3">
                <h3 className="font-medium text-sm mb-2 capitalize">
                  {status === "planned" ? "Plánované" : status === "in_progress" ? "Probíhající" : "Dokončené"}
                </h3>
                <div className="space-y-2">
                  {missions.filter((m: any) => m.status === status).map((m: any) => (
                    <div key={m.id} className="border rounded p-2 text-sm hover:bg-gray-50">
                      <div className="font-medium">{m.title}</div>
                      {m.description && <div className="text-xs text-muted-foreground">{m.description}</div>}
                      {status === "planned" && (
                        <button onClick={() => startMission(m.id)} className="mt-1 text-xs text-primary hover:underline">▶ Spustit</button>
                      )}
                    </div>
                  ))}
                  {missions.filter((m: any) => m.status === status).length === 0 && (
                    <div className="text-xs text-muted-foreground italic p-2">Prázdné</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "audit" && (
        <div className="space-y-6 max-w-4xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Audity ({audits.length})</h2>
            <button onClick={runAudit} disabled={auditRunning} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
              {auditRunning ? "Audituji..." : "Spustit nový audit"}
            </button>
          </div>

          {audits.length === 0 && <p className="text-muted-foreground text-sm">Žádné audity. Spusť první audit.</p>}

          {audits.map((a: any) => (
            <div key={a.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-muted-foreground">{a.id}</span>
                  <span className="mx-2 text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("cs")}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${verdictColor(a.verdict)}`}>
                  {a.verdict === "pass" ? "✅ Prošel" : a.verdict === "conditional_pass" ? "⚠️ Podmíněně" : "❌ Neprošel"}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">{a.verdict_reason}</p>

              {a.findings?.length > 0 && (
                <div className="space-y-2">
                  {a.findings.map((f: any, i: number) => (
                    <div key={i} className="border-l-2 pl-3 text-sm" style={{ borderLeftColor: f.severity === "high" ? "#ef4444" : f.severity === "medium" ? "#f59e0b" : f.severity === "low" ? "#3b82f6" : "#9ca3af" }}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${severityColor(f.severity)}`}>{f.severity.toUpperCase()}</span>
                        <span className="text-xs text-muted-foreground">{f.category}</span>
                      </div>
                      <div className="font-medium">{f.description}</div>
                      <div className="text-xs text-muted-foreground">💡 {f.recommendation}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
