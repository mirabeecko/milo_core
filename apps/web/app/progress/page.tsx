"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { Activity } from "lucide-react";

const API = "http://localhost:4000";

export default function ProgressPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [live, setLive] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/tasks`).then(r => r.json()).then(setTasks).catch(console.error);
    fetch(`${API}/control-center/agents/live`).then(r => r.json()).then(setLive).catch(console.error);
  }, []);

  const recent = Array.isArray(tasks) ? tasks.slice(-20).reverse() : [];
  const online = live?.agents?.filter((a: any) => a.status !== "offline").length ?? 0;
  const total = live?.total ?? 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader title="Progress Pipeline" description="Aktivita systému v reálném čase" />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{recent.length}</div>
          <div className="text-sm text-muted-foreground">Tasků (posledních 20)</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{online}/{total}</div>
          <div className="text-sm text-muted-foreground">Agentů online</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{recent.filter(t => t.status === "failed").length}</div>
          <div className="text-sm text-muted-foreground">Chyb</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Nedávná aktivita</h3>
          <div className="space-y-2 text-sm">
            {recent.slice(0, 10).map((t: any) => (
              <div key={t.id} className="flex items-center gap-2">
                <span className="text-muted-foreground w-24">{t.completedAt ? new Date(t.completedAt).toLocaleString("cs-CZ") : "—"}</span>
                <span>{t.title}</span>
                <span className={`ml-auto ${t.status === "completed" ? "text-green-400" : t.status === "failed" ? "text-red-400" : "text-yellow-400"}`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
