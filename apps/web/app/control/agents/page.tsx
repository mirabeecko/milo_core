"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Agent {
  id: string; slug: string; name: string; description?: string;
  category?: string; status: string; implementation_progress: number;
  runtime_status: string;
}

export default function ControlAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:4000/executive/control/agents")
      .then((r) => r.json())
      .then((d) => { setAgents(d.agents || []); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-muted-foreground">Načítání agentů...</div>;
  if (error) return <div className="p-8 text-red-500">Chyba: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Agenti</h1>
      <p className="text-muted-foreground">{agents.length} agentů v registru</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((a) => (
          <Link key={a.id} href={`/control/agents/${a.id}`} className="block border rounded-lg p-4 hover:border-primary transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{a.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                a.status === "operational" ? "bg-green-100 text-green-700" :
                a.status === "in_development" ? "bg-blue-100 text-blue-700" :
                "bg-gray-100 text-gray-600"
              }`}>{a.status}</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{a.description}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{a.category}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${a.implementation_progress}%` }} />
                </div>
                <span>{a.implementation_progress}%</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
