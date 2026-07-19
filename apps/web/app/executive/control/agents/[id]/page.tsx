"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft, Save, Lock, Unlock, Play, Square, Pause,
  RefreshCw, RotateCcw, Plus, Bot, Shield, AlertTriangle,
  FileText, Wrench, Activity, LockIcon,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getControlAgent,
  updateControlAgent,
  startAgent,
  stopAgent,
  pauseAgent,
  resumeAgent,
  restartAgent,
  lockAgent,
  unlockAgent,
  createAgentTask,
  getAgentTasks,
  getAgentLogs,
} from "@/lib/api/control-center.api";

// ─── Badge helpers ─────────────────────────────────────────────

function riskBadge(r: string) {
  switch (r) {
    case "high": return <Badge variant="outline" className="text-red-400 border-red-500/20">Vysoké</Badge>;
    case "medium": return <Badge variant="outline" className="text-yellow-400 border-yellow-500/20">Střední</Badge>;
    case "low": return <Badge variant="outline" className="text-green-400 border-green-500/20">Nízké</Badge>;
    case "critical": return <Badge variant="outline" className="text-red-600 border-red-500/30">Kritické</Badge>;
    default: return <Badge variant="outline">{r}</Badge>;
  }
}

function lifecycleBadge(s: string) {
  switch (s) {
    case "running": return <Badge variant="outline" className="text-green-400 border-green-500/20">Běží</Badge>;
    case "idle": return <Badge variant="outline" className="text-blue-400 border-blue-500/20">Nečinný</Badge>;
    case "paused": return <Badge variant="outline" className="text-yellow-400 border-yellow-500/20">Pozastaven</Badge>;
    case "offline": return <Badge variant="outline" className="text-gray-400 border-gray-500/20">Offline</Badge>;
    case "error": return <Badge variant="outline" className="text-red-500 border-red-500/30">Chyba</Badge>;
    default: return <Badge variant="outline">{s}</Badge>;
  }
}

// ─── Field editor ──────────────────────────────────────────────

function FieldRow({
  label,
  value,
  onChange,
  type = "text",
  disabled,
  dirty,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "textarea" | "number";
  disabled?: boolean;
  dirty?: boolean;
}) {
  const borderClass = dirty ? "border-yellow-500 ring-1 ring-yellow-500/30" : "border-input";
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {type === "textarea" ? (
        <textarea
          className={`flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground ${borderClass}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      ) : (
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={borderClass}
        />
      )}
    </div>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
  disabled,
  dirty,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
  dirty?: boolean;
}) {
  const borderClass = dirty ? "border-yellow-500 ring-1 ring-yellow-500/30" : "border-input";
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select
        className={`flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground ${borderClass}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function TagInput({
  label,
  values,
  onChange,
  disabled,
  dirty,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
  dirty?: boolean;
}) {
  const [inputVal, setInputVal] = useState("");
  const borderClass = dirty ? "border-yellow-500 ring-1 ring-yellow-500/30" : "border-input";

  function add() {
    const trimmed = inputVal.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInputVal("");
    }
  }

  function remove(tag: string) {
    onChange(values.filter((v) => v !== tag));
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex gap-1 flex-wrap mb-1">
        {values.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            {!disabled && (
              <button onClick={() => remove(tag)} className="hover:text-red-400 ml-0.5">&times;</button>
            )}
          </Badge>
        ))}
      </div>
      {!disabled && (
        <div className="flex gap-1">
          <Input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
            placeholder="Přidat..."
            className={`h-8 text-xs ${borderClass}`}
          />
          <Button type="button" size="sm" variant="outline" onClick={add}>+</Button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [agent, setAgent] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Editable fields
  const [edit, setEdit] = useState<Record<string, any>>({});
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [lockAction, setLockAction] = useState<"lock" | "unlock" | null>(null);

  // Task creation
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");

  const isLocked = agent?.locked || agent?.is_locked;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [a, t, l] = await Promise.all([
        getControlAgent(id),
        getAgentTasks(id).catch(() => []),
        getAgentLogs(id, 50).catch(() => []),
      ]);
      setAgent(a);
      setTasks(t);
      setLogs(l);
      setEdit({
        name: a.name || "",
        description: a.description || "",
        purpose: a.purpose || "",
        role: a.role || "",
        department: a.department || "",
        priority: a.priority || "medium",
        risk_level: a.risk_level || "low",
        category: a.category || "",
        mission: a.mission || "",
        authority: a.authority || "",
        boundaries: a.boundaries || "",
        escalation_rules: a.escalation_rules || "",
        model: a.model || a.config?.model || "gpt-4o",
        temperature: String(a.temperature ?? a.config?.temperature ?? 0.3),
        system_prompt: a.system_prompt || a.config?.system_prompt || a.config?.systemPrompt || "",
        knowledge: Array.isArray(a.knowledge) ? a.knowledge : a.config?.knowledge || [],
        tools: Array.isArray(a.tools) ? a.tools : a.config?.tools || [],
        permissions: Array.isArray(a.permissions) ? a.permissions.join(", ") : a.config?.permissions?.join(", ") || "",
      });
      setDirtyFields(new Set());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function markDirty(field: string) {
    setDirtyFields((prev) => new Set(prev).add(field));
  }

  const isDirty = dirtyFields.size > 0;

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(edit)) {
        if (dirtyFields.has(key)) {
          if (key === "permissions") {
            payload[key] = String(val).split(",").map((s) => s.trim()).filter(Boolean);
          } else if (key === "temperature") {
            payload[key] = parseFloat(String(val));
          } else if (key === "knowledge" || key === "tools") {
            payload[key] = val;
          } else {
            payload[key] = val;
          }
        }
      }
      const updated = await updateControlAgent(id, payload);
      setAgent({ ...agent, ...updated });
      setDirtyFields(new Set());
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  async function runLifecycle(action: string) {
    setActionLoading(action);
    try {
      switch (action) {
        case "start": await startAgent(id); break;
        case "stop": await stopAgent(id); break;
        case "pause": await pauseAgent(id); break;
        case "resume": await resumeAgent(id); break;
        case "restart": await restartAgent(id); break;
      }
      const a = await getControlAgent(id);
      setAgent(a);
    } catch (e) {
      console.error(e);
    }
    setActionLoading(null);
  }

  async function confirmLock() {
    setActionLoading(lockAction === "lock" ? "lock" : "unlock");
    try {
      if (lockAction === "lock") await lockAgent(id);
      else await unlockAgent(id);
      const a = await getControlAgent(id);
      setAgent(a);
    } catch (e) {
      console.error(e);
    }
    setShowLockDialog(false);
    setLockAction(null);
    setActionLoading(null);
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setActionLoading("createTask");
    try {
      await createAgentTask(id, {
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim() || undefined,
        priority: newTaskPriority,
      });
      setNewTaskTitle("");
      setNewTaskDesc("");
      const t = await getAgentTasks(id).catch(() => []);
      setTasks(t);
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  }

  // ─── Loading state ───────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Link href="/executive/control/agents">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Bot className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Agent nenalezen</p>
          <p className="text-sm">Agent s ID {id} nebyl nalezen.</p>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/executive/control/agents">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{agent.name}</h2>
              {isLocked && <Lock className="h-4 w-4 text-yellow-400" />}
              {lifecycleBadge(agent.lifecycle_status)}
            </div>
            <p className="text-sm text-muted-foreground font-mono">{agent.slug || agent.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
              Změny nejsou uloženy
            </Badge>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving || !isDirty || isLocked}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Ukládám..." : "Uložit změny"}
          </Button>
        </div>
      </div>

      {/* Lifecycle controls */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline" size="sm"
          onClick={() => runLifecycle("start")}
          disabled={actionLoading !== null || agent.lifecycle_status === "running" || isLocked}
        >
          {actionLoading === "start" ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
          Spustit
        </Button>
        <Button
          variant="outline" size="sm"
          onClick={() => runLifecycle("stop")}
          disabled={actionLoading !== null || agent.lifecycle_status === "offline" || isLocked}
        >
          {actionLoading === "stop" ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Square className="h-4 w-4 mr-1" />}
          Zastavit
        </Button>
        <Button
          variant="outline" size="sm"
          onClick={() => runLifecycle("pause")}
          disabled={actionLoading !== null || agent.lifecycle_status !== "running" || isLocked}
        >
          {actionLoading === "pause" ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Pause className="h-4 w-4 mr-1" />}
          Pozastavit
        </Button>
        <Button
          variant="outline" size="sm"
          onClick={() => runLifecycle("resume")}
          disabled={actionLoading !== null || agent.lifecycle_status !== "paused" || isLocked}
        >
          <Play className="h-4 w-4 mr-1" />
          Obnovit
        </Button>
        <Button
          variant="outline" size="sm"
          onClick={() => runLifecycle("restart")}
          disabled={actionLoading !== null || isLocked}
        >
          {actionLoading === "restart" ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-1" />}
          Restartovat
        </Button>
        <div className="flex-1" />
        <Button
          variant={isLocked ? "outline" : "destructive"}
          size="sm"
          onClick={() => { setLockAction(isLocked ? "unlock" : "lock"); setShowLockDialog(true); }}
        >
          {isLocked ? <Unlock className="h-4 w-4 mr-1" /> : <LockIcon className="h-4 w-4 mr-1" />}
          {isLocked ? "Odemknout agenta" : "Zamknout agenta"}
        </Button>
      </div>

      {/* Layout: sidebar + main */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Informace o agentovi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium">{agent.role || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Oddělení:</span>
              <span className="font-medium">{agent.department || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stav:</span>
              {lifecycleBadge(agent.lifecycle_status)}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priorita:</span>
              <Badge variant="outline">{agent.priority}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Riziko:</span>
              {riskBadge(agent.risk_level)}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kategorie:</span>
              <Badge variant="outline">{agent.category}</Badge>
            </div>
            {agent.implementation_progress != null && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Připravenost</span>
                  <span>{agent.implementation_progress}%</span>
                </div>
                <Progress value={agent.implementation_progress} className="h-1.5" />
              </div>
            )}
            {isLocked && (
              <div className="flex items-center gap-2 text-yellow-400 text-xs mt-2 p-2 rounded bg-yellow-500/10">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <span>Agent je zamčený — konfigurace je pouze pro čtení.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main tabs */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="prehled">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="prehled"><FileText className="h-4 w-4 mr-1" /> Přehled</TabsTrigger>
              <TabsTrigger value="konfigurace"><Wrench className="h-4 w-4 mr-1" /> Konfigurace</TabsTrigger>
              <TabsTrigger value="runtime"><Activity className="h-4 w-4 mr-1" /> Runtime</TabsTrigger>
              <TabsTrigger value="zamek"><Shield className="h-4 w-4 mr-1" /> Zámek</TabsTrigger>
            </TabsList>

            {/* ── Přehled ──────────────────────────────────────── */}
            <TabsContent value="prehled" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Popis a mise</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <FieldRow
                    label="Popis"
                    value={edit.description ?? ""}
                    onChange={(v) => { setEdit((p) => ({ ...p, description: v })); markDirty("description"); }}
                    type="textarea"
                    disabled={isLocked}
                    dirty={dirtyFields.has("description")}
                  />
                  <FieldRow
                    label="Mise (mission)"
                    value={edit.mission ?? ""}
                    onChange={(v) => { setEdit((p) => ({ ...p, mission: v })); markDirty("mission"); }}
                    type="textarea"
                    disabled={isLocked}
                    dirty={dirtyFields.has("mission")}
                  />
                  <FieldRow
                    label="Autorita (authority)"
                    value={edit.authority ?? ""}
                    onChange={(v) => { setEdit((p) => ({ ...p, authority: v })); markDirty("authority"); }}
                    type="textarea"
                    disabled={isLocked}
                    dirty={dirtyFields.has("authority")}
                  />
                  <FieldRow
                    label="Hranice (boundaries)"
                    value={edit.boundaries ?? ""}
                    onChange={(v) => { setEdit((p) => ({ ...p, boundaries: v })); markDirty("boundaries"); }}
                    type="textarea"
                    disabled={isLocked}
                    dirty={dirtyFields.has("boundaries")}
                  />
                  <FieldRow
                    label="Eskalační pravidla (escalation_rules)"
                    value={edit.escalation_rules ?? ""}
                    onChange={(v) => { setEdit((p) => ({ ...p, escalation_rules: v })); markDirty("escalation_rules"); }}
                    type="textarea"
                    disabled={isLocked}
                    dirty={dirtyFields.has("escalation_rules")}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Konfigurace ──────────────────────────────────── */}
            <TabsContent value="konfigurace" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Model a parametry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <SelectRow
                      label="Model"
                      value={edit.model ?? "gpt-4o"}
                      options={[
                        { value: "gpt-4o", label: "GPT-4o" },
                        { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
                        { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
                        { value: "claude-3-opus", label: "Claude 3 Opus" },
                        { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
                        { value: "deepseek-v3", label: "DeepSeek V3" },
                      ]}
                      onChange={(v) => { setEdit((p) => ({ ...p, model: v })); markDirty("model"); }}
                      disabled={isLocked}
                      dirty={dirtyFields.has("model")}
                    />
                    <FieldRow
                      label="Teplota (temperature)"
                      value={edit.temperature ?? "0.3"}
                      onChange={(v) => { setEdit((p) => ({ ...p, temperature: v })); markDirty("temperature"); }}
                      type="number"
                      disabled={isLocked}
                      dirty={dirtyFields.has("temperature")}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">System prompt</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldRow
                    label="System prompt"
                    value={edit.system_prompt ?? ""}
                    onChange={(v) => { setEdit((p) => ({ ...p, system_prompt: v })); markDirty("system_prompt"); }}
                    type="textarea"
                    disabled={isLocked}
                    dirty={dirtyFields.has("system_prompt")}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Znalosti a nástroje</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TagInput
                    label="Znalostní zdroje (knowledge)"
                    values={Array.isArray(edit.knowledge) ? edit.knowledge : []}
                    onChange={(v) => { setEdit((p) => ({ ...p, knowledge: v })); markDirty("knowledge"); }}
                    disabled={isLocked}
                    dirty={dirtyFields.has("knowledge")}
                  />
                  <TagInput
                    label="Nástroje (tools)"
                    values={Array.isArray(edit.tools) ? edit.tools : []}
                    onChange={(v) => { setEdit((p) => ({ ...p, tools: v })); markDirty("tools"); }}
                    disabled={isLocked}
                    dirty={dirtyFields.has("tools")}
                  />
                  <FieldRow
                    label="Oprávnění (permissions, oddělená čárkou)"
                    value={edit.permissions ?? ""}
                    onChange={(v) => { setEdit((p) => ({ ...p, permissions: v })); markDirty("permissions"); }}
                    disabled={isLocked}
                    dirty={dirtyFields.has("permissions")}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Runtime ──────────────────────────────────────── */}
            <TabsContent value="runtime" className="mt-4 space-y-4">
              {/* Current status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Aktuální stav</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lifecycle:</span>
                    {lifecycleBadge(agent.lifecycle_status)}
                  </div>
                  {agent.current_task && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Aktuální úkol:</span>
                      <span className="font-medium">{agent.current_task}</span>
                    </div>
                  )}
                  {agent.last_heartbeat && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Poslední heartbeat:</span>
                      <span>{new Date(agent.last_heartbeat).toLocaleString("cs")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Create task */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Zadat úkol</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTask} className="space-y-3">
                    <Input
                      placeholder="Název úkolu..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      disabled={isLocked}
                    />
                    <textarea
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted/50"
                      placeholder="Popis úkolu (volitelné)..."
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      disabled={isLocked}
                    />
                    <div className="flex gap-2 items-center">
                      <select
                        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value)}
                        disabled={isLocked}
                      >
                        <option value="low">Nízká</option>
                        <option value="medium">Střední</option>
                        <option value="high">Vysoká</option>
                        <option value="critical">Kritická</option>
                      </select>
                      <Button type="submit" size="sm" disabled={isLocked || actionLoading === "createTask"}>
                        {actionLoading === "createTask" ? (
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-1" />
                        )}
                        Vytvořit úkol
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Task history */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Historie úkolů</CardTitle>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Žádné úkoly.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs text-muted-foreground">
                            <th className="pb-2 font-medium">Název</th>
                            <th className="pb-2 font-medium">Priorita</th>
                            <th className="pb-2 font-medium">Stav</th>
                            <th className="pb-2 font-medium">Vytvořeno</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.map((t) => (
                            <tr key={t.id} className="border-b border-border/50">
                              <td className="py-2 pr-2">{t.title}</td>
                              <td className="py-2 pr-2">
                                <Badge variant="outline" className="text-xs">{t.priority || "-"}</Badge>
                              </td>
                              <td className="py-2 pr-2">
                                {t.status === "completed" ? (
                                  <Badge variant="outline" className="text-green-400 border-green-500/20 text-xs">Dokončeno</Badge>
                                ) : t.status === "failed" ? (
                                  <Badge variant="outline" className="text-red-400 border-red-500/20 text-xs">Chyba</Badge>
                                ) : t.status === "running" ? (
                                  <Badge variant="outline" className="text-blue-400 border-blue-500/20 text-xs">Běží</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">{t.status || "pending"}</Badge>
                                )}
                              </td>
                              <td className="py-2 text-muted-foreground text-xs">
                                {t.created_at ? new Date(t.created_at).toLocaleString("cs") : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Logs */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Log aktivity</CardTitle>
                </CardHeader>
                <CardContent>
                  {logs.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Žádné záznamy v logu.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs text-muted-foreground">
                            <th className="pb-2 font-medium">Čas</th>
                            <th className="pb-2 font-medium">Úroveň</th>
                            <th className="pb-2 font-medium">Zpráva</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map((log, i) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="py-1.5 pr-2 text-muted-foreground text-xs whitespace-nowrap">
                                {log.timestamp ? new Date(log.timestamp).toLocaleString("cs") : "-"}
                              </td>
                              <td className="py-1.5 pr-2">
                                <Badge variant="outline" className={`text-xs ${
                                  log.level === "error" ? "text-red-400 border-red-500/20" :
                                  log.level === "warn" ? "text-yellow-400 border-yellow-500/20" :
                                  "text-muted-foreground"
                                }`}>
                                  {log.level || "info"}
                                </Badge>
                              </td>
                              <td className="py-1.5 text-xs">{log.message || log.msg || JSON.stringify(log)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Zámek ────────────────────────────────────────── */}
            <TabsContent value="zamek" className="mt-4">
              <Card className={isLocked ? "border-yellow-500/30 bg-yellow-500/5" : "border-border"}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Stav zámku agenta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      isLocked ? "bg-yellow-500/10 text-yellow-400" : "bg-muted text-muted-foreground"
                    }`}>
                      {isLocked ? <Lock className="h-6 w-6" /> : <Unlock className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="font-semibold">{isLocked ? "Agent je zamčený" : "Agent není zamčený"}</p>
                      <p className="text-sm text-muted-foreground">
                        {isLocked
                          ? "Konfigurace agenta je chráněna proti změnám. Pro úpravu konfigurace je nutné agenta nejprve odemknout."
                          : "Konfigurace agenta je otevřená pro úpravy. Zamknutím zabráníte nechtěným změnám."}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={isLocked ? "outline" : "destructive"}
                    onClick={() => { setLockAction(isLocked ? "unlock" : "lock"); setShowLockDialog(true); }}
                  >
                    {isLocked ? (
                      <>
                        <Unlock className="h-4 w-4 mr-1" />
                        Odemknout agenta
                      </>
                    ) : (
                      <>
                        <LockIcon className="h-4 w-4 mr-1" />
                        Zamknout agenta
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Lock confirmation dialog */}
      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              {lockAction === "lock" ? "Zamknout agenta?" : "Odemknout agenta?"}
            </DialogTitle>
            <DialogDescription>
              {lockAction === "lock"
                ? "Opravdu chcete zamknout agenta? Po zamknutí nebude možné měnit konfiguraci bez odemknutí."
                : "Opravdu chcete odemknout agenta? Po odemknutí bude možné upravovat veškerou konfiguraci."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLockDialog(false)}>
              Zrušit
            </Button>
            <Button
              variant={lockAction === "lock" ? "destructive" : "default"}
              onClick={confirmLock}
              disabled={actionLoading !== null}
            >
              {actionLoading === "lock" || actionLoading === "unlock" ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : null}
              {lockAction === "lock" ? "Zamknout" : "Odemknout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
