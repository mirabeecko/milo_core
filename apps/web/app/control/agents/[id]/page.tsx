"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function AgentDetailPage() {
  const params = useParams();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://127.0.0.1:4000/executive/control/agents/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setAgent(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="p-8">Načítání...</div>;
  if (!agent) return <div className="p-8 text-red-500">Agent nenalezen</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">{agent.name}</h1>
        <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-700">{agent.status}</span>
      </div>
      <p className="text-muted-foreground">{agent.description}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Kategorie", agent.category],
          ["Vlastník", agent.owner],
          ["Slug", agent.slug],
          ["Progress", `${agent.implementation_progress}%`],
        ].map(([label, val]) => (
          <div key={label} className="border rounded-lg p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="font-medium">{val || "—"}</div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mt-8">Use Cases ({agent.use_cases?.length || 0})</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(agent.use_cases || []).map((uc: any) => (
          <div key={uc.id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{uc.name}</h3>
            <p className="text-sm text-muted-foreground">{uc.description}</p>
            <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
              <span>{uc.category}</span>
              <span>·</span>
              <span>{uc.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
