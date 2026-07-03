"use client";

import { useMemo, useState } from "react";
import { FileText, FolderKanban, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { documents } from "@/lib/mocks";
import { formatRelative, getSourceColor, getSourceLabel } from "@/lib/format";
import type { Document } from "@/lib/types";
import { cn } from "@/lib/utils";

const allSources = ["vše", "obsidian", "drive", "gmail", "upload", "isds"] as const;
const allProjects = ["vše", "TJ Krupka", "MiLO_Core", "Komárka", "Ninja Týden", "Obchodní příležitosti"];

export default function DocumentsPage(): JSX.Element {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("vše");
  const [projectFilter, setProjectFilter] = useState<string>("vše");

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const matchesQuery =
        query.trim() === "" ||
        doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.snippet.toLowerCase().includes(query.toLowerCase()) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));

      const matchesSource = sourceFilter === "vše" || doc.source === sourceFilter;
      const matchesProject = projectFilter === "vše" || doc.project === projectFilter;

      return matchesQuery && matchesSource && matchesProject;
    });
  }, [query, sourceFilter, projectFilter]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
            <p className="text-muted-foreground">Centrální přehled dokumentů ze všech zdrojů.</p>
          </div>
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Nahrát dokument
          </Button>
        </div>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Hledat v dokumentech, emailech, poznámkách..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Zdroj:</span>
                {allSources.map((source) => (
                  <FilterBadge
                    key={source}
                    label={source === "vše" ? "Vše" : getSourceLabel(source)}
                    isActive={sourceFilter === source}
                    onClick={() => setSourceFilter(source)}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Projekt:</span>
                {allProjects.map((project) => (
                  <FilterBadge
                    key={project}
                    label={project}
                    isActive={projectFilter === project}
                    onClick={() => setProjectFilter(project)}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
              <p className="text-muted-foreground">Žádné dokumenty neodpovídají filtru.</p>
            </div>
          ) : (
            filtered.map((doc) => <DocumentRow key={doc.id} document={doc} />)
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function FilterBadge({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function DocumentRow({ document: doc }: { document: Document }): JSX.Element {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/30">
      <div className="mt-1 rounded-lg bg-primary/10 p-2 text-primary">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{doc.title}</h3>
          <Badge variant="outline" className={cn("text-xs", getSourceColor(doc.source))}>
            {getSourceLabel(doc.source)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {doc.type}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{doc.snippet}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {doc.project && (
            <span className="flex items-center gap-1">
              <FolderKanban className="h-3.5 w-3.5" />
              {doc.project}
            </span>
          )}
          <span>{formatRelative(doc.date)}</span>
          <div className="flex flex-wrap gap-1">
            {doc.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
