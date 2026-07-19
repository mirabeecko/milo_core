"use client";

import { useEffect, useState } from "react";
import { Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getControlMissions, startMission } from "@/lib/api/control-center.api";

export default function MissionsPage() {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getControlMissions().then(setMissions).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Missions</h2>
        <p className="text-muted-foreground mt-1">{missions.length} misí — vývojové balíčky práce</p>
      </div>

      {missions.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">Žádné mise nejsou vytvořeny. Vytvořte první misi z detailu agenta.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {missions.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{m.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">{m.status}</Badge>
                      <Badge variant="outline" className="text-xs">{m.mission_type || m.type}</Badge>
                      {m.agent_id && <Badge variant="outline" className="text-xs">{m.agent_id}</Badge>}
                    </div>
                  </div>
                  {m.status === "planned" && (
                    <Button size="sm" variant="outline" onClick={async () => { await startMission(m.id); setMissions(await getControlMissions()); }}><Rocket className="h-3 w-3 mr-1" /> Start</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
