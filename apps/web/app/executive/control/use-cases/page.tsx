"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, FileText, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { getControlUseCases } from "@/lib/api/control-center.api";

export default function UseCasesPage() {
  const [useCases, setUseCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getControlUseCases().then(setUseCases).finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? useCases.filter((uc) => uc.name.toLowerCase().includes(search.toLowerCase()) || uc.description?.toLowerCase().includes(search.toLowerCase()))
    : useCases;

  if (loading) return <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Use Cases</h2>
          <p className="text-muted-foreground mt-1">{useCases.length} use cases — editovatelné specifikace chování agentů</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Hledat use case..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((uc) => (
          <Link key={uc.id} href={`/executive/control/use-cases/${uc.id}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{uc.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{uc.slug}</p>
                  </div>
                  <FileText className="h-6 w-6 text-primary/60" />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{uc.purpose || uc.description}</p>
                <div className="flex gap-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">{uc.agent_id}</Badge>
                  <Badge variant="outline" className={`text-xs ${uc.implementation_status === "completed" ? "text-green-400 border-green-500/20" : uc.implementation_status === "not_started" ? "text-gray-400 border-gray-500/20" : "text-yellow-400 border-yellow-500/20"}`}>{uc.implementation_status}</Badge>
                  <Badge variant="outline" className="text-xs">{uc.priority}</Badge>
                </div>
                <Progress value={uc.progress || 0} className="h-1" />
                <p className="text-xs text-muted-foreground">{uc.progress || 0}% dokončeno</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
