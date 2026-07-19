"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Target,
  CheckSquare,
  Clock,
  Tag,
  Zap,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { cn } from "@/lib/utils";

const API = "http://localhost:4000";

const PHASES = ["nápad", "plánování", "vývoj", "spuštěno", "výdělečné"] as const;
type Phase = (typeof PHASES)[number];

interface ProjectItem {
  id: string;
  text: string;
  source: string;
  importance: number;
  relevance: number;
  gamechanger: boolean;
  status: string;
  firstSeen: string;
  lastReminded: string | null;
  tags: string[];
  description: string;
  financialPotential: string;
  phase: Phase;
  preLaunchTasks: string[];
  priority: number;
}

interface ProjectsData {
  items: ProjectItem[];
}

// ─── Helpers ─────────────────────────────────────────────────

const PHASE_CONFIG: Record<Phase, { label: string; color: string; progress: number }> = {
  nápad: { label: "Nápad", color: "bg-slate-500", progress: 10 },
  plánování: { label: "Plánování", color: "bg-blue-500", progress: 30 },
  vývoj: { label: "Vývoj", color: "bg-amber-500", progress: 60 },
  spuštěno: { label: "Spuštěno", color: "bg-emerald-500", progress: 85 },
  výdělečné: { label: "Výdělečné", color: "bg-green-600", progress: 100 },
};

function formatDate(ts: string): string {
  try {
    return new Date(ts).toLocaleDateString("cs-CZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return ts;
  }
}

function PriorityBadge({ value }: { value: number }) {
  const color =
    value >= 8
      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
      : value >= 6
        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
        : value >= 4
          ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
          : "bg-slate-500/10 text-slate-400 border-slate-500/30";
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border", color)}>
      <Target className="h-3 w-3" /> {value}/10
    </span>
  );
}

function PhaseBadge({ phase }: { phase: Phase }) {
  const config = PHASE_CONFIG[phase];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium", config.color, "text-white")}>
      {config.label}
    </span>
  );
}

function ProgressBar({ phase }: { phase: Phase }) {
  const pct = PHASE_CONFIG[phase].progress;
  const color = PHASE_CONFIG[phase].color;
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-500", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Project Card ────────────────────────────────────────────

function ProjectCard({
  item,
  isExpanded,
  onToggle,
}: {
  item: ProjectItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = PHASE_CONFIG[item.phase];
  const completedTasks = item.preLaunchTasks.length;

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:shadow-lg hover:border-primary/30",
        isExpanded && "border-primary/50 shadow-lg ring-1 ring-primary/20",
        item.gamechanger && "border-rose-500/30 bg-rose-500/[0.02]"
      )}
      onClick={onToggle}
    >
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {item.gamechanger && <Zap className="h-4 w-4 text-rose-400 flex-shrink-0" />}
              <h3 className="font-semibold text-sm truncate">{item.text}</h3>
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
            )}
          </div>
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-1.5">
          <PhaseBadge phase={item.phase} />
          <PriorityBadge value={item.priority} />
          {item.financialPotential !== "—" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="h-3 w-3" /> {item.financialPotential}
            </span>
          )}
        </div>

        {/* Progress & tasks summary */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{config.progress}%</span>
          </div>
          <ProgressBar phase={item.phase} />
          {completedTasks > 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckSquare className="h-3 w-3" />
              {completedTasks} úkol{completedTasks === 1 ? "" : completedTasks < 5 ? "y" : "ů"} před spuštěním
            </p>
          )}
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatDate(item.firstSeen)}
          </span>
          <span className="flex items-center gap-1">
            <Tag className="h-3 w-3" /> {item.source}
          </span>
        </div>

        {/* Expanded detail */}
        {isExpanded && (
          <div className="border-t border-border pt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* Pre-launch tasks checklist */}
            {item.preLaunchTasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5 text-amber-400" />
                  Úkoly před spuštěním
                </p>
                <ul className="space-y-1">
                  {item.preLaunchTasks.map((task, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <span className="flex-shrink-0 w-4 h-4 rounded border border-border flex items-center justify-center text-[10px]">
                        {i + 1}
                      </span>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Full description */}
            {item.description && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">Popis</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            )}

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Fáze:</span>{" "}
                <span className="font-medium">{config.label}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Priorita:</span>{" "}
                <span className="font-medium">{item.priority}/10</span>
              </div>
              <div>
                <span className="text-muted-foreground">Potenciál:</span>{" "}
                <span className="font-medium">{item.financialPotential}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>{" "}
                <span className="font-medium">{item.status}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────

export default function ProjektyPage() {
  const [data, setData] = useState<ProjectsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ─── Add form state ───
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newFinancial, setNewFinancial] = useState("");
  const [newPhase, setNewPhase] = useState<Phase>("nápad");
  const [newPriority, setNewPriority] = useState(5);
  const [newTasks, setNewTasks] = useState("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API}/phone-tracker/projects`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba načítání");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const addProject = async () => {
    if (!newText.trim()) return;
    setAdding(true);
    setSaveStatus(null);
    try {
      const tags = newTags.split(",").map((t) => t.trim()).filter(Boolean);
      const tasks = newTasks
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`${API}/phone-tracker/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newText.trim(),
          description: newDesc.trim(),
          tags,
          financialPotential: newFinancial.trim() || undefined,
          phase: newPhase,
          preLaunchTasks: tasks,
          priority: newPriority,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setSaveStatus(`✅ Přidáno: ${result.item.text}`);
      setNewText("");
      setNewDesc("");
      setNewTags("");
      setNewFinancial("");
      setNewPhase("nápad");
      setNewPriority(5);
      setNewTasks("");
      await loadData();
    } catch (err) {
      setSaveStatus(`❌ Chyba: ${err instanceof Error ? err.message : "neznámá"}`);
    } finally {
      setAdding(false);
    }
  };

  // ─── Filtering ─────────────────────────────────────────────

  const items = (data?.items || []).filter((item) => {
    if (phaseFilter !== "all" && item.phase !== phaseFilter) return false;
    if (priorityFilter === "high" && item.priority < 7) return false;
    if (priorityFilter === "mid" && (item.priority < 4 || item.priority >= 7)) return false;
    if (priorityFilter === "low" && item.priority >= 4) return false;
    if (search.trim()) {
      const lower = search.toLowerCase();
      const matchesText = item.text.toLowerCase().includes(lower);
      const matchesDesc = item.description.toLowerCase().includes(lower);
      const matchesTags = item.tags.some((t) => t.toLowerCase().includes(lower));
      if (!matchesText && !matchesDesc && !matchesTags) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projekty"
        description="Přehled projektů a nápadů s finančním potenciálem, fází a úkoly před spuštěním"
      >
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              🕐 {lastUpdated.toLocaleTimeString("cs-CZ")}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Obnovit
          </Button>
        </div>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat projekty..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <span className="text-xs text-muted-foreground self-center mr-1">Fáze:</span>
          {["all", ...PHASES].map((p) => (
            <Button
              key={p}
              variant={phaseFilter === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPhaseFilter(p)}
            >
              {p === "all" ? "Vše" : PHASE_CONFIG[p as Phase]?.label || p}
            </Button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          <span className="text-xs text-muted-foreground self-center mr-1">Priorita:</span>
          {[
            { key: "all", label: "Vše" },
            { key: "high", label: "Vysoká" },
            { key: "mid", label: "Střední" },
            { key: "low", label: "Nízká" },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={priorityFilter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setPriorityFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Add form */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setExpandedId(expandedId === "__add" ? null : "__add")}
        >
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Přidat projekt
            </span>
            {expandedId === "__add" ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CardTitle>
        </CardHeader>
        {expandedId === "__add" && (
          <CardContent className="space-y-3 border-t border-border pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  placeholder="Název projektu"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Textarea
                  placeholder="Popis (volitelné)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                />
              </div>
              <Input
                placeholder="Tagy (čárkou oddělené)"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
              />
              <Input
                placeholder="Finanční potenciál (např. 500K-2M)"
                value={newFinancial}
                onChange={(e) => setNewFinancial(e.target.value)}
              />
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Fáze</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newPhase}
                  onChange={(e) => setNewPhase(e.target.value as Phase)}
                >
                  {PHASES.map((p) => (
                    <option key={p} value={p}>
                      {PHASE_CONFIG[p].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Priorita (1-10)</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={newPriority}
                  onChange={(e) => setNewPriority(Number(e.target.value))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">
                  Úkoly před spuštěním (jeden na řádek)
                </label>
                <Textarea
                  placeholder={"Vybrat technologii\nNavrhnout architekturu\nPřipravit MVP"}
                  value={newTasks}
                  onChange={(e) => setNewTasks(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={addProject} disabled={adding || !newText.trim()}>
                {adding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Přidat projekt
              </Button>
              {saveStatus && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    saveStatus.startsWith("✅") ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {saveStatus}
                </span>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="py-6 text-center">
            <p className="text-red-400 font-medium">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" /> Zkusit znovu
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">
              {data?.items?.length
                ? "Žádné projekty neodpovídají filtrům."
                : "Zatím žádné projekty. Přidejte první!"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Project grid */}
      {!loading && !error && items.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            {items.length} projekt{items.length === 1 ? "" : items.length < 5 ? "y" : "ů"}
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ProjectCard
                key={item.id}
                item={item}
                isExpanded={expandedId === item.id}
                onToggle={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
