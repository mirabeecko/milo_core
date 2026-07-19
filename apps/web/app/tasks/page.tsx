"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Clock, Plus, RefreshCw, Search, Bot, User, Filter, Wrench, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { AgentTask } from "@/lib/types";
import { formatRelative, getStatusLabel, getStatusColor, getSourceLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

const API = "http://localhost:4000";

const priorityColors: Record<string, string> = {
  critical: "border-rose-500/30 bg-rose-500/10 text-rose-500",
  high: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  normal: "border-blue-500/30 bg-blue-500/10 text-blue-500",
  low: "border-slate-500/30 bg-slate-500/10 text-slate-500",
};

const priorityLabels: Record<string, string> = {
  critical: "Kritická",
  high: "Vysoká",
  normal: "Normální",
  low: "Nízká",
};

type FilterTab = "vse" | "moje" | "agenti";

export default function TasksPage() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("vse");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [creating, setCreating] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [resolvingTask, setResolvingTask] = useState<string | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`${API}/tasks`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nepodařilo se načíst úkoly"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleResolve = async (task: AgentTask) => {
    setResolvingTask(task.id);
    try {
      // Vytvoř nový task pro chief-of-staff s popisem původního selhání
      const title = `Opravit: ${task.title}`;
      const description = [
        `Původní task selhal: ${task.id}`,
        `Název: ${task.title}`,
        task.description ? `Popis: ${task.description}` : null,
        (task.result as any)?.error ? `Chyba: ${(task.result as any).error}` : null,
        `Vytvořeno: ${task.createdAt}`,
      ].filter(Boolean).join("\n");

      await fetch(`${API}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priority: task.priority || "high",
          ownerId: "chief-of-staff",
          ownerType: "agent",
          status: "pending",
          source: "resolve-failed",
        }),
      });

      // Reload
      await load();
    } catch (e) {
      console.error("Resolve error:", e);
    } finally {
      setResolvingTask(null);
    }
  };

  const userTasksCount = tasks.filter((t) => t.ownerType === "user").length;
  const agentTasksCount = tasks.filter((t) => t.ownerType === "agent").length;
  const totalCount = tasks.length;

  const filtered = (() => {
    let result = tasks;

    if (activeTab === "moje") {
      result = result.filter((t) => t.ownerType === "user");
    } else if (activeTab === "agenti") {
      result = result.filter((t) => t.ownerType === "agent");
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          t.ownerId.toLowerCase().includes(q)
      );
    }

    return result;
  })();

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await fetch(`${API}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          priority: newPriority,
          ownerId: "user",
          ownerType: "user",
          status: "pending",
          source: "user",
        }),
      });
      setDialogOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewPriority("normal");
      await load();
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Nepodařilo se načíst úkoly"
        description={error.message}
        action={
          <Button onClick={() => { load(); }} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Zkusit znovu
          </Button>
        }
      />
    );
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "vse", label: "Vše" },
    { key: "moje", label: "Moje úkoly" },
    { key: "agenti", label: "Úkoly agentů" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Úkoly" description="Všechny úkoly napříč agenty">
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Nový úkol
        </Button>
      </PageHeader>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
              <User className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{userTasksCount}</p>
              <p className="text-xs text-muted-foreground">Moje úkoly</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10">
              <Bot className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{agentTasksCount}</p>
              <p className="text-xs text-muted-foreground">Úkoly agentů</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tasks.filter(t => t.status === "completed").length}</p>
              <p className="text-xs text-muted-foreground">Splněno</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tasks.filter(t => t.status === "failed").length}</p>
              <p className="text-xs text-muted-foreground">Selhalo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs + search */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1 rounded-lg bg-muted p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat úkoly..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Žádné úkoly"
          description={
            search
              ? "Zkuste upravit hledání."
              : activeTab !== "vse"
                ? "Pro tento filtr nejsou žádné úkoly."
                : "Zatím nejsou žádné úkoly."
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const isAgentTask = task.ownerType === "agent";
            const isExpanded = expandedTask === task.id;
            const isFailed = task.status === "failed";
            const isCompleted = task.status === "completed";
            const hasLog = (task.log && task.log.length > 0);
            const hasResult = task.result && (task.result.output || task.result.error);

            return (
              <Card
                key={task.id}
                className={cn(
                  "transition-colors hover:border-primary/20",
                  isAgentTask
                    ? "border-l-4 border-l-indigo-500/40"
                    : "border-l-4 border-l-purple-500/40"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Badges row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {isAgentTask ? (
                          <Badge variant="outline" className="gap-1 border-indigo-500/20 bg-indigo-500/10 text-indigo-500">
                            <Bot className="h-3 w-3" />
                            Agent: {task.ownerId}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 border-purple-500/20 bg-purple-500/10 text-purple-500">
                            <User className="h-3 w-3" />
                            Můj úkol
                          </Badge>
                        )}
                        <Badge variant="outline" className={cn("text-xs", priorityColors[task.priority] ?? priorityColors.normal)}>
                          {priorityLabels[task.priority] ?? task.priority}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(task.status))}>
                          {getStatusLabel(task.status)}
                        </Badge>
                        {task.source && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {getSourceLabel(task.source)}
                          </Badge>
                        )}
                      </div>

                      {/* Title + expand toggle */}
                      <div className="flex items-center gap-2 mt-2">
                        <h3 className="font-medium truncate flex-1">{task.title}</h3>
                        <button
                          onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                          className="shrink-0 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {isExpanded ? "Skrýt detail" : "Detail"}
                        </button>
                      </div>

                      {/* Description (always visible, clamped) */}
                      {task.description && !isExpanded && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                      )}

                      {/* Meta row */}
                      <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                        <span>{formatRelative(task.createdAt)}</span>
                        {task.actualTimeMs != null && (
                          <span className="text-muted-foreground/70">
                            {task.actualTimeMs < 1000
                              ? `${task.actualTimeMs}ms`
                              : `${(task.actualTimeMs / 1000).toFixed(1)}s`}
                          </span>
                        )}
                        {(task.toolsUsed || []).length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {(task.toolsUsed || []).map((tool) => (
                              <Badge key={tool} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {/* Vyřešit button for failed tasks */}
                        {isFailed && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-auto gap-1 text-xs h-7"
                            onClick={() => handleResolve(task)}
                            disabled={resolvingTask === task.id}
                          >
                            <Wrench className="h-3 w-3" />
                            {resolvingTask === task.id ? "Vytvářím..." : "Vyřešit"}
                          </Button>
                        )}
                      </div>

                      {/* ===== EXPANDED DETAIL ===== */}
                      {isExpanded && (
                        <div className="mt-3 space-y-3 border-t border-border pt-3">
                          {/* Description full */}
                          {task.description && (
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">Popis</div>
                              <p className="text-sm bg-muted/30 rounded-md p-3 whitespace-pre-wrap">{task.description}</p>
                            </div>
                          )}

                          {/* Timing */}
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <div>
                              <span className="font-medium">Vytvořeno: </span>
                              {new Date(task.createdAt).toLocaleString("cs-CZ")}
                            </div>
                            {task.startedAt && (
                              <div>
                                <span className="font-medium">Spuštěno: </span>
                                {new Date(task.startedAt).toLocaleString("cs-CZ")}
                              </div>
                            )}
                            {task.completedAt && (
                              <div>
                                <span className="font-medium">Dokončeno: </span>
                                {new Date(task.completedAt).toLocaleString("cs-CZ")}
                              </div>
                            )}
                            {task.actualTimeMs != null && (
                              <div>
                                <span className="font-medium">Trvání: </span>
                                {task.actualTimeMs < 1000
                                  ? `${task.actualTimeMs}ms`
                                  : `${(task.actualTimeMs / 1000).toFixed(1)}s`}
                              </div>
                            )}
                          </div>

                          {/* Log */}
                          {hasLog && (
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">
                                Log ({task.log!.length} záznamů)
                              </div>
                              <div className="bg-muted/30 rounded-md p-3 max-h-48 overflow-y-auto space-y-1">
                                {task.log!.map((entry: any, i: number) => {
                                  const levelColors: Record<string, string> = {
                                    info: "text-blue-400",
                                    warn: "text-amber-400",
                                    error: "text-red-400",
                                  };
                                  const time = entry.timestamp
                                    ? new Date(entry.timestamp).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                                    : "";
                                  return (
                                    <div key={i} className="text-xs font-mono flex gap-2">
                                      <span className="text-muted-foreground shrink-0">{time}</span>
                                      <span className={cn("shrink-0 w-8", levelColors[entry.level] || "text-muted-foreground")}>
                                        [{entry.level?.toUpperCase()}]
                                      </span>
                                      <span className="text-foreground/80">{entry.message}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Output / Error */}
                          {hasResult && (
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">
                                {task.result?.error ? "Chyba" : "Výstup"}
                              </div>
                              <div className={cn(
                                "rounded-md p-3 text-xs font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto",
                                task.result?.error ? "bg-red-500/5 text-red-400" : "bg-emerald-500/5 text-emerald-400"
                              )}>
                                {task.result?.error || task.result?.output || JSON.stringify(task.result, null, 2)}
                              </div>
                            </div>
                          )}

                          {/* No log, no result */}
                          {!hasLog && !hasResult && !task.description && (
                            <p className="text-xs text-muted-foreground">Žádné další informace.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nový úkol</DialogTitle>
            <DialogDescription>Vytvořte nový úkol pro sebe nebo pro agenta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Název úkolu</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Např. Zkontrolovat emaily"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Popis</label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Volitelný popis úkolu..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Priorita</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="low">Nízká</option>
                <option value="normal">Normální</option>
                <option value="high">Vysoká</option>
                <option value="critical">Kritická</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Zrušit</Button>
            <Button onClick={handleCreate} disabled={!newTitle.trim() || creating}>
              {creating ? "Vytvářím..." : "Vytvořit úkol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
