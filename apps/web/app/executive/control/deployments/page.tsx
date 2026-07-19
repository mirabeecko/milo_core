"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getControlDeployments } from "@/lib/api/control-center.api";

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getControlDeployments().then(setDeployments).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Deployments</h2>
        <p className="text-muted-foreground mt-1">{deployments.length} nasazení</p>
      </div>

      {deployments.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">Žádná nasazení nebyla provedena.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {deployments.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{d.agent_name || d.agent_id} — {d.environment}</p>
                  <p className="text-xs text-muted-foreground">{d.version_label}</p>
                </div>
                <Badge variant="outline" className={d.status === "deployed" ? "text-green-400 border-green-500/20" : ""}>{d.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
