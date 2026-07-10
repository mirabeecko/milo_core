"use client";

import {
  FileText,
  ScrollText,
  GitBranch,
  BookOpen,
  Clock,
  CheckCircle2,
  FileEdit,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Artifact, Decision } from "@/lib/data/executive";

interface Props {
  artifacts: Artifact[];
  decisions: Decision[];
}

const typeIcons: Record<string, React.ElementType> = {
  document: FileText,
  adr: ScrollText,
  model: GitBranch,
  plan: BookOpen,
  report: FileEdit,
};

export function ArtifactsView({ artifacts, decisions }: Props) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Artifacts & Decisions"
        description="Dokumenty, rozhodnutí a artefakty vytvořené organizací MiLO"
      />

      <Tabs defaultValue="artifacts" className="w-full">
        <TabsList>
          <TabsTrigger value="artifacts">Dokumenty ({artifacts.length})</TabsTrigger>
          <TabsTrigger value="decisions">ADR ({decisions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="artifacts" className="mt-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {artifacts.map((a) => {
              const Icon = typeIcons[a.type] ?? FileText;
              return (
                <Card key={a.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm truncate">{a.title}</CardTitle>
                          <CardDescription className="text-xs">{a.path}</CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${
                          a.status === "done" ? "text-emerald-500 border-emerald-500/30" :
                          a.status === "in_progress" ? "text-amber-500 border-amber-500/30" :
                          "text-muted-foreground"
                        }`}
                      >
                        {a.status === "done" ? "Hotovo" : a.status === "in_progress" ? "Rozpracováno" : "Plánováno"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px]">{a.type}</Badge>
                      <Badge variant="outline" className="text-[10px]">{a.department}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="decisions" className="mt-4">
          <div className="space-y-4">
            {decisions.map((d) => (
              <Card key={d.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{d.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {d.author} · {d.date}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/30">
                        {d.status}
                      </Badge>
                      {d.reviewDate && (
                        <span className="text-[10px] text-muted-foreground">
                          Revize: {d.reviewDate}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Kontext</p>
                    <p className="text-sm text-muted-foreground line-clamp-3">{d.context}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Rozhodnutí</p>
                    <p className="text-sm text-muted-foreground line-clamp-3">{d.decision}</p>
                  </div>
                  {d.consequences && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Důsledky</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{d.consequences}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <code className="text-muted-foreground">{d.path}</code>
                  </div>
                </CardContent>
              </Card>
            ))}

            {decisions.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-12">
                  <div className="rounded-full bg-muted p-4 text-muted-foreground">
                    <ScrollText className="h-8 w-8" />
                  </div>
                  <p className="text-lg font-medium">Žádné ADR záznamy</p>
                  <p className="text-sm text-muted-foreground max-w-md text-center">
                    ADR záznamy nejsou k dispozici. Budou vytvořeny ARCH oddělením ve Wave 0.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground text-center">
        Zdroj: docs/adr/*.md — statická data z lokálního filesystému
      </p>
    </div>
  );
}
