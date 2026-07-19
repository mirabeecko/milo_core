"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { getControlUseCase } from "@/lib/api/control-center.api";

export default function UseCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [uc, setUc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getControlUseCase(id).then(setUc).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-96 w-full" /></div>;
  if (!uc) return <div className="text-muted-foreground">Use case nenalezen.</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/executive/control/use-cases"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{uc.name}</h2>
          <p className="text-sm text-muted-foreground font-mono">{uc.slug} · agent: {uc.agent_id}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Základní informace</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><strong>Účel:</strong> {uc.purpose}</div>
            <div><strong>Popis:</strong> {uc.description}</div>
            {uc.trigger && <div><strong>Spouštěč:</strong> {uc.trigger}</div>}
            <div className="flex gap-1"><strong>Stav:</strong> <Badge variant="outline">{uc.status}</Badge></div>
            <div className="flex gap-1"><strong>Implementace:</strong> <Badge variant="outline">{uc.implementation_status}</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Připravenost</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Progress value={uc.progress || 0} className="h-3" />
            <p className="text-2xl font-bold">{uc.progress || 0}%</p>
            <div className="flex gap-1">
              <Badge variant="outline">{uc.priority}</Badge>
              <Badge variant="outline">{uc.risk_level || "low"}</Badge>
              <Badge variant="outline">{uc.category || "core"}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Specifikace use case</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 text-sm">
            {uc.purpose && <div><strong>Purpose:</strong> <p className="text-muted-foreground mt-1">{uc.purpose}</p></div>}
            {uc.trigger && <div><strong>Trigger:</strong> <p className="text-muted-foreground mt-1">{uc.trigger}</p></div>}
            <div>
              <strong>Status:</strong>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className={uc.status === "draft" ? "border-yellow-500/30 text-yellow-400" : ""}>Specifikace: {uc.status}</Badge>
                <Badge variant="outline" className={uc.implementation_status === "completed" ? "border-green-500/30 text-green-400" : uc.implementation_status === "not_started" ? "border-gray-500/30 text-gray-400" : "border-blue-500/30 text-blue-400"}>Implementace: {uc.implementation_status}</Badge>
              </div>
            </div>
            <div>
              <strong>Metriky:</strong>
              <div className="grid grid-cols-3 gap-2 mt-1 text-xs text-muted-foreground">
                <div>Priority: {uc.priority}</div>
                <div>Risk: {uc.risk_level || "low"}</div>
                <div>Created: {new Date(uc.created_at).toLocaleDateString("cs")}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">JSON Data</CardTitle></CardHeader>
        <CardContent>
          <pre className="text-xs p-3 bg-muted rounded max-h-80 overflow-auto">{JSON.stringify(uc, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
