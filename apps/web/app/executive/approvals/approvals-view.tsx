"use client";

import {
  ClipboardCheck,
  Clock,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import type { Approval } from "@/lib/data/executive/types";
import { useExecutiveApprovals } from "@/lib/data/executive/use-executive-queries";
import { LiveIndicator } from "@/app/executive/live-indicator";
import { approveApproval, rejectApproval } from "@/lib/api/approvals.api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Props {
  approvals: Approval[];
}

const urgencyStyles: Record<string, string> = {
  critical: "text-rose-500 border-rose-500/30 bg-rose-500/10",
  high: "text-amber-500 border-amber-500/30 bg-amber-500/10",
  normal: "text-blue-500 border-blue-500/30 bg-blue-500/10",
  low: "text-muted-foreground",
};

const urgencyLabel: Record<string, string> = {
  critical: "Kritické",
  high: "Vysoká",
  normal: "Normální",
  low: "Nízká",
};

const typeIcons: Record<string, React.ElementType> = {
  adr: FileText,
  rfc: FileText,
  constitutional: ShieldCheck,
  budget: ArrowUpRight,
  escalation: AlertTriangle,
  other: Clock,
};

export function ApprovalsView({ approvals: initialApprovals }: Props) {
  const { data: approvals = initialApprovals, isFetching, isStale, dataUpdatedAt } = useExecutiveApprovals(initialApprovals);
  const queryClient = useQueryClient();
  const [actingIds, setActingIds] = useState<Set<string>>(new Set());

  const pending = approvals.filter((a) => a.status === "pending");

  async function handleApprove(id: string) {
    setActingIds((prev) => new Set(prev).add(id));
    try {
      await approveApproval(id);
      toast.success("Schválení potvrzeno");
      queryClient.invalidateQueries({ queryKey: ["executive", "approvals"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Nepodařilo se schválit");
    } finally {
      setActingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleReject(id: string) {
    setActingIds((prev) => new Set(prev).add(id));
    try {
      await rejectApproval(id);
      toast.success("Schválení zamítnuto");
      queryClient.invalidateQueries({ queryKey: ["executive", "approvals"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Nepodařilo se zamítnout");
    } finally {
      setActingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Owner Approvals"
        description="Rozhodnutí a schválení čekající na Vlastníka"
      >
        <LiveIndicator isFetching={isFetching} isStale={isStale} isError={false} dataUpdatedAt={dataUpdatedAt} />
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Čeká na schválení
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pending.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Vysoká priorita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {pending.filter((a) => a.urgency === "high" || a.urgency === "critical").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-emerald-500" />
              Celkem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{approvals.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Seznam ke schválení</CardTitle>
          <CardDescription>
            {pending.length} položek čeká na akci
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {approvals.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="rounded-full bg-emerald-500/10 p-4 text-emerald-500">
                <ClipboardCheck className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium">Žádné čekající schválení</p>
              <p className="text-sm text-muted-foreground max-w-md text-center">
                Všechna rozhodnutí jsou schválena nebo neexistují data.
              </p>
            </div>
          )}

          {approvals.map((approval) => {
            const TypeIcon = typeIcons[approval.type] ?? Clock;
            const isActing = actingIds.has(approval.id);
            const isDecided = approval.status !== "pending";
            return (
              <div
                key={approval.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={`text-xs ${urgencyStyles[approval.urgency] ?? ""}`}>
                      {urgencyLabel[approval.urgency] ?? approval.urgency}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">{approval.department}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{approval.type}</Badge>
                    {isDecided && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${approval.status === "approved" ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10" : "text-rose-500 border-rose-500/30 bg-rose-500/10"}`}
                      >
                        {approval.status === "approved" ? "Schváleno" : "Zamítnuto"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium">{approval.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{approval.description}</p>
                  {approval.context && (
                    <p className="text-xs text-muted-foreground/70 mt-1 italic">{approval.context}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {new Date(approval.createdAt).toLocaleDateString("cs-CZ")}
                  </p>
                </div>
                {!isDecided && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleReject(approval.id)}
                      disabled={isActing}
                    >
                      {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      Odložit
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={() => handleApprove(approval.id)}
                      disabled={isActing}
                    >
                      {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ClipboardCheck className="h-3 w-3" />}
                      Schválit
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Zdroj: Executive API — live data z /executive/approvals
      </p>
    </div>
  );
}
