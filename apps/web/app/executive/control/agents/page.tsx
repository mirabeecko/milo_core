"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, Bot, Plus, Play, Square, RefreshCw, Activity, XCircle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  bulkStartAgents,
  bulkStopAgents,
  createControlAgent,
  getControlAgents,
} from "@/lib/api/control-center.api";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { useActivityStream } from "@/hooks/use-activity-stream";

const categories = [
  "all", "coordinator", "engineering", "knowledge", "legal",
  "communication", "productivity", "organization", "project",
  "infrastructure", "finance", "business",
];

const categoryLabels: Record<string, string> = {
  coordinator: "Koordinace", engineering: "Vývoj", knowledge: "Znalosti",
  legal: "Právo", communication: "Komunikace", productivity: "Produktivita",
  organization: "Organizace", project: "Projekt", infrastructure: "Infrastruktura",
  finance: "Finance", business: "Podnikání",
};

function catLabel(c: string) {
  return categoryLabels[c] || c;
}

function riskBadge(r: string) {
  switch (r) {
    case "high":
      return <Badge variant="outline" className="text-red-400 border-red-500/20">Vysoké</Badge>;
    case "medium":
      return <Badge variant="outline" className="text-yellow-400 border-yellow-500/20">Střední</Badge>;
    case "low":
      return <Badge variant="outline" className="text-green-400 border-green-500/20">Nízké</Badge>;
    case "critical":
      return <Badge variant="outline" className="text-red-600 border-red-500/30">Kritické</Badge>;
    default:
      return <Badge variant="outline">{r}</Badge>;
  }
}

function lifecycleBadge(s: string) {
  switch (s) {
    case "running":
      return <Badge variant="outline" className="text-green-400 border-green-500/20">Běží</Badge>;
    case "idle":
      return <Badge variant="outline" className="text-blue-400 border-blue-500/20">Nečinný</Badge>;
    case "paused":
      return <Badge variant="outline" className="text-yellow-400 border-yellow-500/20">Pozastaven</Badge>;
    case "offline":
      return <Badge variant="outline" className="text-gray-400 border-gray-500/20">Offline</Badge>;
    case "error":
      return <Badge variant="outline" className="text-red-500 border-red-500/30">Chyba</Badge>;
    default:
      return <Badge variant="outline">{s}</Badge>;
  }
}

const CREATE_FORM_FIELDS = [
  { key: "name", label: "Název agenta", type: "text", required: true },
  { key: "slug", label: "Slug", type: "text", required: true },
  { key: "category", label: "Kategorie", type: "select", required: true },
  { key: "purpose", label: "Účel", type: "text" },
  { key: "description", label: "Popis", type: "textarea" },
  { key: "priority", label: "Priorita", type: "select", options: ["critical", "high", "medium", "low"] },
  { key: "risk_level", label: "Rizikovost", type: "select", options: ["critical", "high", "medium", "low"] },
];

export default function ControlAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [bulkLoading, setBulkLoading] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState<Record<string, string>>({});
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // --- Activity stream ---
  const { events, connected, clear, reconnect } = useActivityStream();
  const [workflowLoading, setWorkflowLoading] = useState(false);

  async function handleRunWorkflow() {
    setWorkflowLoading(true);
    try {
      await fetch("http://localhost:4001/api/agents/run", { method: "POST" });
    } catch (e) {
      console.error("Workflow run failed:", e);
    }
    setWorkflowLoading(false);
  }

  const fetchAgents = useCallback(() => {
    setLoading(true);
    setError(null);
    getControlAgents()
      .then((data) => {
        setAgents(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Nepodařilo se načíst agenty. Je API server spuštěný?");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const filtered = agents.filter((a) => {
    if (category !== "all" && a.category !== category) return false;
    if (
      search &&
      !a.name.toLowerCase().includes(search.toLowerCase()) &&
      !a.description?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const runningCount = agents.filter((a) => a.lifecycle_status === "running").length;
  const errorCount = agents.filter((a) => a.lifecycle_status === "error").length;

  async function handleBulkStart() {
    setBulkLoading("start");
    try {
      const ids = filtered.map((a) => a.id);
      await bulkStartAgents(ids);
      await fetchAgents();
    } catch (e) {
      console.error(e);
    }
    setBulkLoading(null);
  }

  async function handleBulkStop() {
    setBulkLoading("stop");
    try {
      const ids = filtered.map((a) => a.id);
      await bulkStopAgents(ids);
      await fetchAgents();
    } catch (e) {
      console.error(e);
    }
    setBulkLoading(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateSubmitting(true);
    try {
      await createControlAgent(createForm);
      setShowCreateDialog(false);
      setCreateForm({});
      await fetchAgents();
    } catch (err) {
      console.error(err);
    }
    setCreateSubmitting(false);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader title="Agenti" description="Načítám katalog agentů..." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader title="Agenti" description="Řídící centrum agentů" />
        <EmptyState
          variant="error"
          title="Chyba připojení"
          description={error}
          action={
            <Button onClick={fetchAgents} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Zkusit znovu
            </Button>
          }
        />

        {/* Activity Feed — funguje i bez hlavního API */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold font-mono">ŽIVÁ AKTIVITA</h2>
            <Button
              variant="default"
              size="sm"
              onClick={handleRunWorkflow}
              disabled={workflowLoading}
            >
              {workflowLoading ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              Spustit agenty
            </Button>
          </div>
          <ActivityFeed events={events} connected={connected} onClear={clear} onReconnect={reconnect} maxHeight="400px" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Agenti" description="Řídící centrum agentů">
        <Button variant="outline" size="sm" onClick={fetchAgents} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Obnovit
        </Button>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Vytvořit agenta
        </Button>
      </PageHeader>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <Bot className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold">{agents.length}</p>
              <p className="text-xs text-muted-foreground">Celkem agentů</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <CheckCircle className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold">{runningCount}</p>
              <p className="text-xs text-muted-foreground">Běží</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <Activity className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold">{agents.length - runningCount - errorCount}</p>
              <p className="text-xs text-muted-foreground">Nečinných</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <XCircle className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-2xl font-bold">{errorCount}</p>
              <p className="text-xs text-muted-foreground">Chyb</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + filters + bulk actions */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hledat agenta..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={handleBulkStart}
          disabled={bulkLoading !== null}
        >
          {bulkLoading === "start" ? (
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-1" />
          )}
          Spustit všechny
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleBulkStop}
          disabled={bulkLoading !== null}
        >
          {bulkLoading === "stop" ? (
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Square className="h-4 w-4 mr-1" />
          )}
          Zastavit všechny
        </Button>
      </div>

      <div className="flex gap-1 flex-wrap">
        {categories.map((c) => (
          <Button
            key={c}
            variant={category === c ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(c)}
          >
            {c === "all" ? "Vše" : catLabel(c)}
          </Button>
        ))}
      </div>

      {/* Agent cards */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Žádní agenti"
          description={search || category !== "all" ? "Zkuste upravit filtr nebo vyhledávání." : "Zatím nejsou registrováni žádní agenti."}
          action={
            <Button onClick={() => setShowCreateDialog(true)} variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Vytvořit prvního agenta
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => (
            <Link key={agent.id} href={`/executive/control/agents/${agent.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{agent.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{agent.slug}</p>
                    </div>
                    <Bot className="h-8 w-8 text-primary/60" />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {agent.purpose || agent.description}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant="outline">{catLabel(agent.category)}</Badge>
                    {riskBadge(agent.risk_level)}
                    <Badge variant="outline">{agent.priority}</Badge>
                  </div>
                  <Progress value={agent.implementation_progress || 0} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{agent.implementation_progress || 0}% připraveno</span>
                    {lifecycleBadge(agent.lifecycle_status)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Activity Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold font-mono">ŽIVÁ AKTIVITA</h2>
          <Button
            variant="default"
            size="sm"
            onClick={handleRunWorkflow}
            disabled={workflowLoading}
          >
            {workflowLoading ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            Spustit agenty
          </Button>
        </div>
        <ActivityFeed events={events} connected={connected} onClear={clear} onReconnect={reconnect} maxHeight="400px" />
      </div>

      {/* Create agent dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vytvořit nového agenta</DialogTitle>
            <DialogDescription>Vyplňte údaje pro registraci nového agenta.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {CREATE_FORM_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                {field.type === "select" ? (
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={createForm[field.key] || ""}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    required={field.required}
                  >
                    <option value="" disabled>Vyberte...</option>
                    {field.key === "category"
                      ? categories.filter((c) => c !== "all").map((c) => (
                          <option key={c} value={c}>{catLabel(c)}</option>
                        ))
                      : field.options?.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={createForm[field.key] || ""}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  />
                ) : (
                  <input
                    type={field.type}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={createForm[field.key] || ""}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    required={field.required}
                  />
                )}
              </div>
            ))}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} disabled={createSubmitting}>
                Zrušit
              </Button>
              <Button type="submit" disabled={createSubmitting}>
                {createSubmitting ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Vytvořit agenta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
