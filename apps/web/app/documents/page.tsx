"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { getDocuments } from "@/lib/api/documents.api";
import { getObsidianNotes, mapObsidianToDocument } from "@/lib/api/knowledge.api";
import type { Document } from "@/lib/types";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

const sourceColors: Record<string, string> = {
  obsidian: "border-purple-500/30 bg-purple-500/10 text-purple-500",
  drive: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  gmail: "border-blue-500/30 bg-blue-500/10 text-blue-500",
  upload: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  isds: "border-rose-500/30 bg-rose-500/10 text-rose-500",
};

const sourceLabels: Record<string, string> = {
  obsidian: "Obsidian",
  drive: "Drive",
  gmail: "Gmail",
  upload: "Upload",
  isds: "ISDS",
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [docs, obsidianNotes] = await Promise.all([
        getDocuments(),
        getObsidianNotes(),
      ]);
      const obsidianDocs = obsidianNotes.map(mapObsidianToDocument);
      const merged = [
        ...docs,
        ...obsidianDocs.filter(
          (od) => !docs.some((d) => d.id === od.id),
        ),
      ];
      setDocuments(merged as any);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nepodařilo se načíst dokumenty"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => void load(), []);

  const filtered = search.trim()
    ? documents.filter(
        (d) =>
          d.title.toLowerCase().includes(search.toLowerCase()) ||
          d.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
          (d.project && d.project.toLowerCase().includes(search.toLowerCase())),
      )
    : documents;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Nepodařilo se načíst dokumenty"
        description={error.message}
        action={<Button onClick={() => void load()} className="gap-2"><RefreshCw className="h-4 w-4" /> Zkusit znovu</Button>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Dokumenty" description="Dokumenty z Obsidianu, G Drive, Gmailu a ISDS">
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nahrát dokument
        </Button>
      </PageHeader>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hledat dokumenty..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Žádné dokumenty" description={search ? "Zkuste upravit hledání." : "Zatím nejsou žádné dokumenty."} />
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => (
            <Card key={doc.id} className="transition-colors hover:border-primary/20">
              <CardContent className="flex items-start gap-4 p-4">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{doc.title}</h3>
                    <Badge variant="outline" className={cn("text-xs", sourceColors[doc.source] ?? "")}>
                      {sourceLabels[doc.source] ?? doc.source}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {doc.type}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{doc.snippet}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {doc.project && <span className="font-medium">{doc.project}</span>}
                    {doc.tags.map((tag) => (
                      <span key={tag} className="rounded bg-muted px-1.5 py-0.5 font-mono">{tag}</span>
                    ))}
                    <span>{formatRelative(doc.date)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
