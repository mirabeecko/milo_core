"use client";

import { useState } from "react";
import {
  Bot,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { cn } from "@/lib/utils";
import type { Mission } from "@/lib/data/executive/types";
import { useExecutiveMissions } from "@/lib/data/executive/use-executive-queries";
import { LiveIndicator } from "@/app/executive/live-indicator";

interface Props {
  missions: Mission[];
}

export function MissionsView({ missions: initialMissions }: Props) {
  const { data: missions = initialMissions, isFetching, isStale, dataUpdatedAt } = useExecutiveMissions(initialMissions);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const completed = missions.filter((m) => m.status === "completed");
  const failed = missions.filter((m) => m.status === "failed");
  const running = missions.filter((m) => m.status === "running");

  const statusIcon = (status: Mission["status"]) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "failed": return <XCircle className="h-4 w-4 text-rose-500" />;
      case "running": return <Bot className="h-4 w-4 text-blue-500 animate-pulse" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const statusLabel = (status: Mission["status"]) => {
    switch (status) {
      case "completed": return "Dokončeno";
      case "failed": return "Chyba";
      case "running": return "Probíhá";
      case "pending": return "Čeká";
      case "cancelled": return "Zrušeno";
      default: return status;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Mise"
        description="Přehled všech misí — dokončených, neúspěšných i aktivních"
      >
        <LiveIndicator isFetching={isFetching} isStale={isStale} isError={false} dataUpdatedAt={dataUpdatedAt} />
      </PageHeader>

      {missions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="rounded-full bg-muted p-4 text-muted-foreground">
              <Bot className="h-8 w-8" />
            </div>
            <p className="text-lg font-medium">Žádná data o misích</p>
            <p className="text-sm text-muted-foreground max-w-md text-center">
              Data o misích nejsou k dispozici. Až Chief of Staff začne vykonávat mise, objeví se zde.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Dokončeno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completed.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4 text-rose-500" />
              Chyby
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{failed.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-500" />
              Aktivní
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{running.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Seznam misí</CardTitle>
          <CardDescription>
            {missions.length} misí celkem · Zdroj: apps/api/data/missions.json
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {missions.map((mission) => (
            <div key={mission.id} className="rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === mission.id ? null : mission.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors text-left"
              >
                {statusIcon(mission.status)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{mission.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {mission.ownerName} · {mission.department}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs shrink-0",
                    mission.status === "completed" && "text-emerald-500 border-emerald-500/30",
                    mission.status === "failed" && "text-rose-500 border-rose-500/30",
                    mission.status === "running" && "text-blue-500 border-blue-500/30",
                  )}
                >
                  {statusLabel(mission.status)}
                </Badge>
                {expandedId === mission.id ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>
              {expandedId === mission.id && (
                <div className="border-t border-border px-3 py-3 space-y-2 text-sm bg-muted/20">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Vytvořeno</span>
                      <p className="text-xs">{mission.createdAt ? new Date(mission.createdAt).toLocaleString("cs-CZ") : "—"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Dokončeno</span>
                      <p className="text-xs">{mission.completedAt ? new Date(mission.completedAt).toLocaleString("cs-CZ") : "—"}</p>
                    </div>
                  </div>
                  {mission.result?.output && (
                    <div>
                      <span className="text-xs text-muted-foreground">Výstup</span>
                      <p className="text-xs whitespace-pre-wrap mt-1 rounded bg-muted/50 p-2 font-mono">
                        {mission.result.output}
                      </p>
                    </div>
                  )}
                  {mission.result?.error && (
                    <div>
                      <span className="text-xs text-muted-foreground">Chyba</span>
                      <p className="text-xs text-rose-500 mt-1 rounded bg-rose-500/10 p-2 font-mono">
                        {mission.result.error}
                      </p>
                    </div>
                  )}
                  {mission.result?.citations && mission.result.citations.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">Zdroje</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {mission.result.citations.map((c, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Data source: apps/api/data/missions.json — lokální soubor
      </p>
    </div>
  );
}
