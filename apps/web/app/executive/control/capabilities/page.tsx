"use client";

import { useEffect, useState } from "react";
import { Puzzle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { getControlCapabilities } from "@/lib/api/control-center.api";

export default function CapabilitiesPage() {
  const [capabilities, setCapabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getControlCapabilities().then(setCapabilities).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Capabilities</h2>
        <p className="text-muted-foreground mt-1">{capabilities.length} schopností — sdílené napříč agenty</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((cap) => (
          <Card key={cap.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{cap.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{cap.capability_code}</p>
                </div>
                <Puzzle className="h-6 w-6 text-primary/60" />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{cap.description}</p>
              <div className="flex gap-1 flex-wrap">
                <Badge variant="outline" className="text-xs">{cap.status}</Badge>
                <Badge variant="outline" className="text-xs">{cap.maturity_level}</Badge>
                {cap.owner && <Badge variant="outline" className="text-xs">{cap.owner}</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
