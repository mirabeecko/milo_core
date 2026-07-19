"use client";

import { useState, useEffect } from "react";

export default function UseCasesPage() {
  const [useCases, setUseCases] = useState<any[]>([]);
  const [filterAgent, setFilterAgent] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:4000/executive/control/use-cases")
      .then((r) => r.json())
      .then((d) => setUseCases(d.useCases || []));
  }, []);

  const filtered = filterAgent
    ? useCases.filter((uc) => uc.agent_id === filterAgent)
    : useCases;

  const agents = Array.from(new Set(useCases.map((uc: any) => uc.agent_id)));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Use Cases</h1>
      <p className="text-muted-foreground">{useCases.length} use cases celkem</p>

      <select className="border rounded-lg p-2 text-sm" value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)}>
        <option value="">Všichni agenti</option>
        {agents.map((id) => (
          <option key={id} value={id}>{id}</option>
        ))}
      </select>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((uc) => (
          <div key={uc.id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{uc.name}</h3>
            <p className="text-sm text-muted-foreground">{uc.description}</p>
            <div className="flex gap-2 mt-3 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-gray-100">{uc.category}</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{uc.status}</span>
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">{uc.implementation_status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
