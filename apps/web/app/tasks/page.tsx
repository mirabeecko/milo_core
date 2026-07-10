"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Clock, Plus, RefreshCw, Search, Bot, User, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { getTasks, createTask } from "@/lib/api/tasks.api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { AgentTask } from "@/lib/types";
import { formatRelative, getStatusLabel, getStatusColor, getSourceLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

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

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getTasks({ limit: 50 });
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nepodařilo se načíst úkoly"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => void load(), []);

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
      await createTask({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        priority: newPriority as AgentTask["priority"],
        ownerId: "user",
        ownerType: "user",
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
          <Button onClick={() => void load()} className="gap-2">
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
      <PageHeader title="Úkoly" description="Všechny úkoly napříč agenty a projekty">
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Nový úkol
        </Button>
      </PageHeader>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
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
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Filter className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-xs text-muted-foreground">Celkem</p>
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
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Owner indicator */}
                        {isAgentTask ? (
                          <Badge
                            variant="outline"
                            className="gap-1 border-indigo-500/20 bg-indigo-500/10 text-indigo-500"
                          >
                            <Bot className="h-3 w-3" />
                            Agent: {task.ownerId}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="gap-1 border-purple-500/20 bg-purple-500/10 text-purple-500"
                          >
                            <User className="h-3 w-3" />
                            Můj úkol
                          </Badge>
                        )}
                        {/* Priority */}
                        <Badge
                          variant="outline"
                          className={cn("text-xs", priorityColors[task.priority] ?? priorityColors.normal)}
                        >
                          {priorityLabels[task.priority] ?? task.priority}
                        </Badge>
                        {/* Status */}
                        <Badge
                          variant="outline"
                          className={cn("text-xs", getStatusColor(task.status))}
                        >
                          {getStatusLabel(task.status)}
                        </Badge>
                        {/* Source */}
                        {task.source && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {getSourceLabel(task.source)}
                          </Badge>
                        )}
                      </div>

                      <h3 className="mt-2 font-medium truncate">{task.title}</h3>
                      {task.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                      )}

                      <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                        {task.toolsUsed.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {task.toolsUsed.map((tool) => (
                              <Badge key={tool} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <span>{formatRelative(task.createdAt)}</span>
                        {task.result && (
                          <button
                            onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                            className="ml-auto inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            {expandedTask === task.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            Výsledek
                          </button>
                        )}
                      </div>
                      {expandedTask === task.id && task.result && (
                        <div className="mt-3 rounded-md bg-muted/50 p-3 text-xs font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                          {typeof task.result === "string"
                            ? task.result
                            : JSON.stringify(task.result, null, 2)}
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
