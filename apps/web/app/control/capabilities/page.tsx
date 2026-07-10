"use client";

import { useState, useEffect } from "react";

export default function CapabilitiesPage() {
  const [caps, setCaps] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:4000/executive/control/capabilities")
      .then((r) => r.json())
      .then((d) => setCaps(d.capabilities || []));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Capabilities</h1>
      <p className="text-muted-foreground">{caps.length} capabilities v registru</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {caps.map((c) => (
          <div key={c.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{c.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{c.maturity_level || "concept"}</span>
            </div>
            <p className="text-sm text-muted-foreground">{c.description}</p>
            <div className="mt-2 text-xs text-muted-foreground">
              <code className="bg-gray-100 px-1 rounded">{c.capability_code}</code>
              <span className="ml-2">{c.category}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
