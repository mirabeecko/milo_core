"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DocumentRow } from "@/components/document/document-row";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { getDocuments } from "@/lib/api/documents.api";
import { getSourceLabel } from "@/lib/format";
import type { Document } from "@/lib/types";
import { cn } from "@/lib/utils";

const allSources = ["vše", "obsidian", "drive", "gmail", "upload", "isds"] as const;
const allProjects = ["vše", "TJ Krupka", "MiLO_Core", "Komárka", "Ninja Týden", "Obchodní příležitosti"];

export default function DocumentsPage(): JSX.Element {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("vše");
  const [projectFilter, setProjectFilter] = useState<string>("vše");

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getDocuments();
        setDocuments(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Nepodařilo se načíst dokumenty"));
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

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
  }, [query, sourceFilter, projectFilter, documents]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-6xl">
          <LoadingState rows={4} />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-6xl">
          <EmptyState
            variant="error"
            title="Nepodařilo se načíst dokumenty"
            description={error.message}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          title="Documents"
          description="Centrální přehled dokumentů ze všech zdrojů."
        >
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Nahrát dokument
          </Button>
        </PageHeader>

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
            <EmptyState
              title="Žádné dokumenty"
              description="Žádné dokumenty neodpovídají zadanému filtru."
            />
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
