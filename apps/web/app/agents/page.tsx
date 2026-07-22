"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentCard } from "@/components/agent/agent-card";
import { PageHeader } from "@/components/common/page-header";
import { getAgents } from "@/lib/api/agents.api";
import type { Agent } from "@/lib/types";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getAgents();
      setAgents(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nepodařilo se načíst agenty"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh každých 15s pro realtime status
  useEffect(() => {
    const i = setInterval(load, 15000);
    return () => clearInterval(i);
  }, [load]);

  // Filtrovat jen použitelné agenty (mají tools/skills)
  const usable = agents.filter((a) => {
    const tools = a.config?.tools?.length ?? 0;
    return tools > 0;
  });

  const usableCount = usable.length;
  const totalCount = agents.length;
  const workingCount = usable.filter((a) => {
    const s = a.state?.status ?? a.status;
    return s === "working" || s === "thinking";
  }).length;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <p className="text-red-400 font-medium mb-2">Nepodařilo se načíst agenty</p>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => { setIsLoading(true); load(); }} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Zkusit znovu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <PageHeader
          title="Agenti"
          description={`${usableCount} použitelných / ${totalCount} registrovaných • ${workingCount} aktivních`}
        />
        <div className="flex items-center gap-2">
          <Button onClick={load} variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Obnovit
          </Button>
        </div>
      </div>

      {usable.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">Žádní použitelní agenti — všichni jsou bez nástrojů.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {usable.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
