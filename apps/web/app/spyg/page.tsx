"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Zap, Shield, Loader2, RefreshCw, Edit3, Save, X, FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";

const API = "http://localhost:4000";
const WATCHLIST = `${API}/phone-tracker/spyg/watchlist`;

interface WatchlistItem {
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
  financialPotential?: string;
  phase?: string;
  preLaunchTasks?: string[];
  priority?: number;
  linkedProject?: string;
}

const PHASES = ["nápad", "plánování", "vývoj", "spuštěno", "výdělečné"];

const PRIORITY_COLOR = (p: number) =>
  p >= 9 ? { bar: "bg-red-500", border: "border-l-red-500", label: "KRITICKÁ" } :
  p >= 7 ? { bar: "bg-amber-500", border: "border-l-amber-500", label: "VYSOKÁ" } :
  p >= 5 ? { bar: "bg-blue-500", border: "border-l-blue-500", label: "STŘEDNÍ" } :
           { bar: "bg-slate-500", border: "border-l-slate-500", label: "NÍZKÁ" };

function formatDate(ts: string): string {
  try { return new Date(ts).toLocaleString("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return ts; }
}

export default function SpygPage() {
  const [allItems, setAllItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTags, setNewTags] = useState("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WatchlistItem>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(WATCHLIST);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAllItems(json.items || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba načítání");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); const i = setInterval(loadData, 10_000); return () => clearInterval(i); }, [loadData]);

  // FILTER: jen nápady (ne hotové projekty s financialPotential)
  const ideasOnly = allItems.filter(i => !i.financialPotential && !(i.preLaunchTasks && i.preLaunchTasks.length > 0));
  // SEPARATE: gamechangers vs regular
  const gamechangers = ideasOnly.filter(i => i.gamechanger);
  const regular = ideasOnly.filter(i => !i.gamechanger).sort((a, b) => (b.priority || b.importance) - (a.priority || a.importance));

  // GROUP by linkedProject
  const grouped = new Map<string, WatchlistItem[]>();
  regular.forEach(item => {
    const key = item.linkedProject || "— bez projektu —";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  });

  // ─── ADD ───
  const addItem = async () => {
    if (!newText.trim()) return;
    setAdding(true); setSaveStatus(null);
    try {
      const res = await fetch(WATCHLIST, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText.trim(), description: newDesc.trim(), tags: newTags.split(",").map(t => t.trim()).filter(Boolean) }) });
      if (!res.ok) throw new Error("Chyba");
      setNewText(""); setNewDesc(""); setNewTags("");
      setSaveStatus("✅ Uloženo"); await loadData();
    } catch (e: any) { setSaveStatus(`❌ ${e.message}`); }
    setAdding(false);
  };

  // ─── EDIT ───
  const startEdit = (item: WatchlistItem) => { setEditingId(item.id); setEditForm({ ...item }); setEditError(null); };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); setEditError(null); };
  const saveEdit = async () => {
    if (!editingId || !editForm.text?.trim()) return;
    setEditSaving(true); setEditError(null);
    try {
      const res = await fetch(`${WATCHLIST}/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEditingId(null); setEditForm({}); await loadData();
    } catch (e: any) { setEditError(e.message); }
    setEditSaving(false);
  };
  const updateEditField = (field: string, value: any) => setEditForm(prev => ({ ...prev, [field]: value }));

  // ─── PROMOTE TO PROJECT ───
  const promoteToProject = async (item: WatchlistItem) => {
    try {
      await fetch(`${API}/phone-tracker/projects`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, text: item.text, description: item.description, tags: item.tags, financialPotential: "—", phase: "plánování", preLaunchTasks: [], priority: item.priority || item.importance }) });
      await loadData();
    } catch {}
  };

  const projectOptions = allItems.filter(i => i.financialPotential);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={<span className="flex items-center gap-2">🕵️ SPY_G <Badge variant="outline" className="text-red-400 border-red-400">WATCHLIST</Badge></span>}
        description="Evidence nápadů a sledovaných témat — projekty na /projekty"
        actions={
          <div className="flex gap-2">
            {lastUpdated && <span className="text-xs text-muted-foreground self-center">{lastUpdated.toLocaleTimeString("cs-CZ")}</span>}
            <Button variant="outline" size="sm" onClick={loadData}><RefreshCw className="w-4 h-4 mr-1" />Obnovit</Button>
          </div>
        }
      />

      {error && <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded border border-red-500/20">{error}</div>}

      {/* GAMECHANGER — ČERVENÝ */}
      {gamechangers.length > 0 && (
        <div className="relative rounded-xl border-2 border-red-600 bg-gradient-to-r from-red-950 to-zinc-900 shadow-lg shadow-red-900/30 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 animate-pulse" />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-red-900/50">
              <Zap className="w-6 h-6 text-red-400" />
              <span className="font-bold text-red-400 tracking-widest text-sm uppercase">Gamechanger</span>
              <span className="text-xs text-red-300/60">{gamechangers.length} položek</span>
            </div>
            {gamechangers.map(item => {
              const pc = PRIORITY_COLOR(item.priority || item.importance);
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-red-900/30 bg-red-950/40 mb-2 last:mb-0">
                  <Shield className="w-4 h-4 text-red-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-red-100">{item.text}</div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{pc.label}</Badge>
                      <Badge variant="outline" className="text-xs text-red-400 border-red-400">{item.phase}</Badge>
                      {item.linkedProject && <Badge variant="outline" className="text-xs text-blue-400">🔗 {item.linkedProject}</Badge>}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => startEdit(item)}><Edit3 className="w-3 h-3" /></Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD FORM */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Plus className="w-4 h-4" />Přidat nápad</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Nápad, téma, úkol..." value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem()} />
          <Textarea placeholder="Popis..." value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} />
          <div className="flex gap-2">
            <Input placeholder="Tagy (čárkou)" value={newTags} onChange={e => setNewTags(e.target.value)} className="flex-1" />
            <Button onClick={addItem} disabled={adding}>{adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Přidat"}</Button>
          </div>
          {saveStatus && <p className={`text-xs ${saveStatus.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>{saveStatus}</p>}
        </CardContent>
      </Card>

      {/* ITEMS — GROUPED BY PROJECT */}
      {loading ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div> : (
        [...grouped.entries()].map(([project, items]) => (
          <div key={project}>
            {project !== "— bez projektu —" && (
              <div className="flex items-center gap-2 mb-2">
                <FolderPlus className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-400">📁 {project}</span>
                <Badge variant="outline" className="text-xs">{items.length}</Badge>
              </div>
            )}
            <div className="space-y-2">
              {items.map(item => {
                const pc = PRIORITY_COLOR(item.priority || item.importance);
                return (
                  <Card key={item.id} className={`border-l-4 ${pc.border} ${editingId === item.id ? "ring-1 ring-primary/20" : ""}`}>
                    <CardContent className="p-3">
                      {editingId === item.id ? (
                        <div className="space-y-2">
                          <Input value={editForm.text || ""} onChange={e => updateEditField("text", e.target.value)} placeholder="Název" />
                          <Textarea value={editForm.description || ""} onChange={e => updateEditField("description", e.target.value)} placeholder="Popis" rows={2} />
                          <div className="grid grid-cols-2 gap-2">
                            <Input type="number" min={1} max={10} value={editForm.priority || 7} onChange={e => updateEditField("priority", parseInt(e.target.value) || 7)} placeholder="Priorita 1-10" />
                            <Input value={(editForm.tags || []).join(", ")} onChange={e => updateEditField("tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))} placeholder="Tagy" />
                            <select value={editForm.phase || ""} onChange={e => updateEditField("phase", e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                              <option value="">Fáze</option>
                              {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <select value={editForm.linkedProject || ""} onChange={e => updateEditField("linkedProject", e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                              <option value="">— nepropojeno —</option>
                              {projectOptions.map(p => <option key={p.id} value={p.text}>{p.text}</option>)}
                            </select>
                            <label className="flex items-center gap-2 text-sm cursor-pointer col-span-2">
                              <input type="checkbox" checked={editForm.gamechanger || false} onChange={e => updateEditField("gamechanger", e.target.checked)} />
                              🔴 Gamechanger
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEdit} disabled={editSaving}>{editSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}Uložit</Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}><X className="w-4 h-4 mr-1" />Zrušit</Button>
                            {editError && <span className="text-xs text-red-400 self-center">{editError}</span>}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <div className={`w-1.5 self-stretch rounded-full ${pc.bar} shrink-0`} style={{ minHeight: "36px" }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.gamechanger && <Zap className="w-3 h-3 text-red-400" />}
                              <span className="font-medium text-sm">{item.text}</span>
                              <Badge className={`text-[10px] font-bold text-white ${pc.bar}`}>{pc.label}</Badge>
                              {item.linkedProject && <Badge variant="outline" className="text-[10px] text-blue-400">🔗 {item.linkedProject}</Badge>}
                            </div>
                            {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                            <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap items-center">
                              <span>📅 {formatDate(item.firstSeen)}</span>
                              <span>🎯 {(item.priority || item.importance)}/10</span>
                              {item.tags?.map((t: string) => (
                                <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button size="sm" variant="ghost" onClick={() => startEdit(item)} aria-label="Upravit"><Edit3 className="w-3 h-3" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => promoteToProject(item)} title="Převést na projekt"><FolderPlus className="w-3 h-3 text-green-400" /></Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
