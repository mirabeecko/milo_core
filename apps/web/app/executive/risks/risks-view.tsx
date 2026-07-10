"use client";

import {
  AlertTriangle,
  ShieldAlert,
  AlertOctagon,
  TrendingUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Risk, Blocker } from "@/lib/data/executive";

interface Props {
  risks: Risk[];
  blockers: Blocker[];
}

const probabilityColor = (p: Risk["probability"]) => {
  switch (p) {
    case "Vysoká": return "text-rose-500 border-rose-500/30 bg-rose-500/10";
    case "Střední": return "text-amber-500 border-amber-500/30 bg-amber-500/10";
    case "Nízká": return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
    default: return "text-muted-foreground";
  }
};

const impactColor = (i: Risk["impact"]) => {
  switch (i) {
    case "Kritický": return "text-rose-500";
    case "Vysoký": return "text-amber-500";
    case "Střední": return "text-amber-500/70";
    case "Nízký": return "text-emerald-500";
    default: return "text-muted-foreground";
  }
};

const severityColor = (s: Blocker["severity"]) => {
  switch (s) {
    case "blocking": return "text-rose-500 border-rose-500/30 bg-rose-500/10";
    case "delaying": return "text-amber-500 border-amber-500/30 bg-amber-500/10";
    case "warning": return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
    default: return "";
  }
};

export function RisksView({ risks, blockers }: Props) {
  const activeBlockers = blockers.filter((b) => b.status === "active");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Risks & Blockers"
        description="Identifikovaná rizika a aktivní blokery — přehled pro Executive Board"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Celkem rizik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{risks.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {risks.filter((r) => r.probability === "Vysoká").length} vysoká pravděpodobnost
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-500" />
              Aktivní blokery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeBlockers.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeBlockers.filter((b) => b.severity === "blocking").length} blokující
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-rose-500" />
              Kritický dopad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{risks.filter((r) => r.impact === "Kritický").length}</p>
            <p className="text-xs text-muted-foreground mt-1">rizik s kritickým dopadem</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="risks" className="w-full">
        <TabsList>
          <TabsTrigger value="risks">
            Rizika ({risks.length})
          </TabsTrigger>
          <TabsTrigger value="blockers">
            Blokery ({activeBlockers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="risks" className="mt-4 space-y-3">
          {risks.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <div className="rounded-full bg-muted p-4 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <p className="text-lg font-medium">Žádná rizika neidentifikována</p>
                <p className="text-sm text-muted-foreground max-w-md text-center">
                  Rizika budou identifikována v BOOTSTRAP_AND_ROADMAP.md nebo jiných dokumentech.
                </p>
              </CardContent>
            </Card>
          )}

          {risks.map((risk) => (
            <Card key={risk.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{risk.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline" className={`text-xs ${probabilityColor(risk.probability)}`}>
                        Pravděpodobnost: {risk.probability}
                      </Badge>
                      <Badge variant="outline" className={`text-xs font-medium ${impactColor(risk.impact)}`}>
                        Dopad: {risk.impact}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="font-medium">Mitigace:</span> {risk.mitigation}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {risk.source}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="blockers" className="mt-4 space-y-3">
          {activeBlockers.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <div className="rounded-full bg-emerald-500/10 p-4 text-emerald-500">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <p className="text-lg font-medium">Žádné aktivní blokery</p>
                <p className="text-sm text-muted-foreground max-w-md text-center">Všechny známé blokery jsou vyřešeny.</p>
              </CardContent>
            </Card>
          )}

          {activeBlockers.map((blocker) => (
            <Card key={blocker.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${severityColor(blocker.severity)}`}>
                        {blocker.severity === "blocking" ? "Blokující" : blocker.severity === "delaying" ? "Zdržující" : "Varování"}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{blocker.department}</Badge>
                    </div>
                    <p className="text-sm font-medium mt-2">{blocker.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{blocker.description}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{blocker.reportedAt}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground text-center">
        Zdroj: BOOTSTRAP_AND_ROADMAP.md, TASKS.md, ARCHITECTURE.md, AUDIT.md — statická analýza
      </p>
    </div>
  );
}
