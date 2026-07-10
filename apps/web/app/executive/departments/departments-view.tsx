"use client";

import {
  Building2,
  Target,
  Shield,
  BookOpen,
  Users,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import type { Department } from "@/lib/data/executive/types";
import { useExecutiveDepartments } from "@/lib/data/executive/use-executive-queries";
import { LiveIndicator } from "@/app/executive/live-indicator";

interface Props {
  departments: Department[];
}

const deptIcons: Record<string, React.ElementType> = {
  oc: Target,
  arch: Building2,
  eng: Zap,
  know: BookOpen,
  comm: Users,
  ops: Shield,
  qa: Shield,
};

const deptColors: Record<string, string> = {
  oc: "bg-primary/10 text-primary border-primary/30",
  arch: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  eng: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  know: "bg-violet-500/10 text-violet-500 border-violet-500/30",
  comm: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  ops: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
  qa: "bg-rose-500/10 text-rose-500 border-rose-500/30",
};

export function DepartmentsView({ departments: initialDepartments }: Props) {
  const { data: departments = initialDepartments, isFetching, isStale, dataUpdatedAt } = useExecutiveDepartments(initialDepartments);
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Executive Departments"
        description="7 oddělení MiLO — každé vlastní přesně definovanou doménu"
      >
        <LiveIndicator isFetching={isFetching} isStale={isStale} isError={false} dataUpdatedAt={dataUpdatedAt} />
      </PageHeader>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        {departments.map((dept) => {
          const Icon = deptIcons[dept.id] ?? Building2;
          return (
            <Card key={dept.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${deptColors[dept.id] ?? "bg-muted text-muted-foreground"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base">{dept.name}</CardTitle>
                      <CardDescription>{dept.shortName} · {dept.domain}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    Vlna {dept.bootstrapWave}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Poslání</p>
                  <p className="text-sm text-muted-foreground">{dept.missionStatement}</p>
                </div>

                {dept.kpis.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">KPI</p>
                    <div className="space-y-1">
                      {dept.kpis.map((kpi, i) => (
                        <div key={i} className="flex items-center justify-between text-xs rounded bg-muted/30 px-2 py-1">
                          <span className="text-muted-foreground">{kpi.metric}</span>
                          <span className="font-mono font-medium">{kpi.target}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="font-medium text-muted-foreground uppercase tracking-wider mb-1">Odpovědnosti</p>
                    <ul className="space-y-0.5">
                      {dept.responsibilities.slice(0, 3).map((r, i) => (
                        <li key={i} className="text-muted-foreground">· {r}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground uppercase tracking-wider mb-1">Hranice</p>
                    <ul className="space-y-0.5">
                      {dept.boundaries.slice(0, 2).map((b, i) => (
                        <li key={i} className="text-rose-500/70">· {b}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {dept.requiredSpecialists.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Specialisté</p>
                    <div className="flex flex-wrap gap-1">
                      {dept.requiredSpecialists.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Zdroj: docs/board/EXECUTIVE_BOARD_AND_DEPARTMENTS.md — statická data, ne live telemetrie
      </p>
    </div>
  );
}
