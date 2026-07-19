"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRightLeft, RefreshCw, CheckCircle2, Clock, AlertTriangle, Star, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

const API = "http://localhost:4000";

const usefulnessIcon = (u: string) =>
  u === "high" ? <ThumbsUp className="w-4 h-4 text-green-400" /> :
  u === "medium" ? <Minus className="w-4 h-4 text-yellow-400" /> :
  u === "low" ? <ThumbsDown className="w-4 h-4 text-red-400" /> :
  <Clock className="w-4 h-4 text-blue-400" />;

const statusBadge = (s: string) =>
  s === "completed" ? <Badge variant="default"><CheckCircle2 className="w-3 h-3 mr-1"/>Dokončeno</Badge> :
  s === "running" ? <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Běží</Badge> :
  <Badge variant="outline">{s}</Badge>;

export default function DelegationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/phone-tracker/delegations`);
      setItems(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const completed = items.filter(i => i.status === "completed");
  const highUseful = completed.filter(i => i.usefulness === "high").length;
  const mediumUseful = completed.filter(i => i.usefulness === "medium").length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Delegace"
        description="Historie delegování subagentů — použitelnost a užitečnost"
        actions={
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-1" />Obnovit
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{completed.length}</div>
          <div className="text-sm text-muted-foreground">Dokončeno</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{highUseful}</div>
          <div className="text-sm text-muted-foreground">Vysoce užitečné</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{mediumUseful}</div>
          <div className="text-sm text-muted-foreground">Částečně užitečné</div>
        </CardContent></Card>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl"/>)}</div>
      ) : (
        <div className="space-y-4">
          {items.map((d: any) => (
            <Card key={d.id} className={d.usefulness === "high" ? "border-l-2 border-l-green-500" : d.usefulness === "medium" ? "border-l-2 border-l-yellow-500" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{d.title}</span>
                      {statusBadge(d.status)}
                      {usefulnessIcon(d.usefulness)}
                      <span className="text-xs text-muted-foreground ml-auto">{d.id}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{d.goal}</p>
                    {d.result && (
                      <p className="text-sm mt-2 p-2 rounded bg-secondary/30">{d.result}</p>
                    )}
                    {d.issues && (
                      <p className="text-xs mt-1 text-yellow-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {d.issues}
                      </p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>🕐 {d.duration}</span>
                      <span>👤 {d.agent}</span>
                      <span>📅 {new Date(d.dispatched).toLocaleString("cs-CZ")}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
