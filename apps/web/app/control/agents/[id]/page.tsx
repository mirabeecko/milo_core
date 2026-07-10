"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "spec">("overview");

  // Spec editor state
  const [spec, setSpec] = useState<Record<string, any>>({});
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`http://127.0.0.1:4000/executive/control/agents/${params.id}`)
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
    const res = await fetch(`http://127.0.0.1:4000/executive/control/agents/${params.id}/versions`, {
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

  if (loading) return <div className="p-8">Načítání...</div>;
  if (!agent) return <div className="p-8 text-red-500">Agent nenalezen</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <p className="text-muted-foreground">{agent.description}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => saveVersion("draft")} disabled={saving} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
            {saving ? "Ukládám..." : saved ? "✓ Uloženo" : "Uložit koncept"}
          </button>
          <button onClick={() => saveVersion("ready")} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
            Publikovat verzi
          </button>
        </div>
      </div>

      <div className="flex gap-6 border-b">
        {[
          ["overview", "Přehled"],
          ["spec", "Specifikace"],
        ].map(([key, label]) => (
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
        </div>
      )}
    </div>
  );
}
