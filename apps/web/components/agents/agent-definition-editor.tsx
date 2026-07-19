"use client";

import { useState } from "react";
import { Edit3, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AgentDefinitionEditorProps {
  agentId: string;
  agentName: string;
  /** Po úspěšném uložení */
  onSaved?: () => void;
}

export function AgentDefinitionEditor({
  agentId,
  agentName,
  onSaved,
}: AgentDefinitionEditorProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [temperature, setTemperature] = useState("0.3");
  const [tools, setTools] = useState("");
  const [priority, setPriority] = useState("normal");

  // Načti aktuální data při otevření
  async function handleOpen() {
    setError(null);
    // Zkusit načíst z API
    try {
      const res = await fetch(`/api/agents/${agentId}`);
      if (res.ok) {
        const agent = await res.json();
        setName(agent.name || "");
        setDescription(agent.description || "");
        setSystemPrompt(agent.config?.systemPrompt || "");
        setModel(agent.config?.model || "gpt-4o");
        setTemperature(String(agent.config?.temperature ?? 0.3));
        setTools(Array.isArray(agent.config?.tools) ? agent.config.tools.join(", ") : "");
        setPriority(agent.priority || "normal");
      }
    } catch {
      // Ignorovat — pole zůstanou prázdná
    }
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {};

    if (name.trim()) payload.name = name.trim();
    if (description.trim()) payload.description = description.trim();
    if (systemPrompt.trim()) payload.systemPrompt = systemPrompt.trim();
    if (model.trim()) payload.model = model.trim();

    const temp = parseFloat(temperature);
    if (!isNaN(temp)) payload.temperature = temp;

    if (tools.trim()) {
      payload.tools = tools.split(",").map((t) => t.trim()).filter(Boolean);
    }

    if (priority.trim()) payload.priority = priority.trim();

    try {
      const res = await fetch(`/api/agents/${agentId}/definition`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
      } else {
        setOpen(false);
        onSaved?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }

    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(null); }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleOpen}
        >
          <Edit3 className="h-4 w-4" />
          Upravit definici
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Upravit definici: {agentName}
          </DialogTitle>
          <DialogDescription>
            Změny se zapíší přímo do definičního souboru v{" "}
            <code className="text-xs bg-muted px-1 rounded">
              packages/agents/src/registry/
            </code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Název */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Název</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Název agenta"
            />
          </div>

          {/* Popis */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Popis</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Stručný popis"
            />
          </div>

          {/* Priorita */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Priorita</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Nízká</option>
              <option value="normal">Normální</option>
              <option value="high">Vysoká</option>
              <option value="critical">Kritická</option>
            </select>
          </div>

          {/* Model */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Model</label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Temperature</label>
              <Input
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="0.3"
              />
            </div>
          </div>

          {/* Nástroje */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Nástroje (čárkou oddělené)
            </label>
            <Input
              value={tools}
              onChange={(e) => setTools(e.target.value)}
              placeholder="calendar, gmail, obsidian, task-queue"
            />
            {tools.trim() && (
              <div className="flex gap-1 flex-wrap mt-1">
                {tools.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* System prompt */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              System Prompt
            </label>
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono shadow-sm"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Jsi specializovaný agent..."
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {saving ? "Ukládám..." : "Uložit do definičního souboru"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
