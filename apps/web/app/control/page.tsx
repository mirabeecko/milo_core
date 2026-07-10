"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ControlOverviewPage() {
  const [stats, setStats] = useState({ agents: 0, useCases: 0, capabilities: 0, tasks: 0 });

  useEffect(() => {
    Promise.all([
      fetch("http://127.0.0.1:4000/executive/control/agents").then((r) => r.json()),
      fetch("http://127.0.0.1:4000/executive/control/use-cases").then((r) => r.json()),
      fetch("http://127.0.0.1:4000/executive/control/capabilities").then((r) => r.json()),
      fetch("http://127.0.0.1:4000/executive/control/tasks").then((r) => r.json()),
    ]).then(([a, u, c, t]) => {
      setStats({
        agents: a.count || 0,
        useCases: u.count || 0,
        capabilities: c.count || 0,
        tasks: t.count || 0,
      });
    });
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Control Center</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Agenti", stats.agents, "/control/agents"],
          ["Use Cases", stats.useCases, "/control/use-cases"],
          ["Capabilities", stats.capabilities, "/control/capabilities"],
          ["Úkoly", stats.tasks, "/control/agents"],
        ].map(([label, count, href]) => (
          <Link key={label} href={href as string} className="border rounded-lg p-6 hover:border-primary transition-colors text-center">
            <div className="text-3xl font-bold">{count}</div>
            <div className="text-sm text-muted-foreground mt-1">{label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
