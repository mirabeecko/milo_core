"use client";

import { useEffect, useState } from "react";
import { BookOpen, Database, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { getObsidianNotes, getObsidianStatus, reindexObsidian } from "@/lib/api/knowledge.api";
import type { ObsidianNote, ObsidianStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function KnowledgePage() {
  const [notes, setNotes] = useState<ObsidianNote[]>([]);
  const [status, setStatus] = useState<ObsidianStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState("");
  const [reindexing, setReindexing] = useState(false);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [noteData, statusData] = await Promise.all([
        getObsidianNotes(),
        getObsidianStatus(),
      ]);
      setNotes(noteData);
      setStatus(statusData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nepodařilo se načíst knowledge base"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => void load(), []);

  const handleReindex = async () => {
    setReindexing(true);
    try {
      await reindexObsidian();
      await load();
    } catch {
      // ignore
    } finally {
      setReindexing(false);
    }
  };

  const filtered = search.trim()
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.content.toLowerCase().includes(search.toLowerCase()) ||
          n.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
      )
    : notes;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Nepodařilo se načíst knowledge base"
        description={error.message}
        action={<Button onClick={() => void load()} className="gap-2"><RefreshCw className="h-4 w-4" /> Zkusit znovu</Button>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Knowledge Base" description="Indexované poznámky z Obsidianu a vyhledávání">
        <Button onClick={handleReindex} disabled={reindexing} variant="outline" className="gap-2">
          <RefreshCw className={cn("h-4 w-4", reindexing && "animate-spin")} />
          {reindexing ? "Indexuji..." : "Reindexovat"}
        </Button>
      </PageHeader>

      {status && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Obsidian Vault</CardTitle>
            </div>
            <CardDescription>
              {status.configured
                ? `Vault: ${status.vaultPath} · ${status.noteCount} poznámek`
                : "Obsidian není nakonfigurován"}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hledat v poznámkách..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Žádné poznámky" description={search ? "Zkuste upravit hledání." : "Zatím nejsou žádné poznámky."} />
      ) : (
        <div className="space-y-3">
          {filtered.map((note) => (
            <Card key={note.id} className="transition-colors hover:border-primary/20">
              <CardContent className="flex items-start gap-4 p-4">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{note.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {note.content.replace(/#+ /g, "").replace(/\n/g, " ").slice(0, 200)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{note.path}</span>
                    {note.tags.map((tag) => (
                      <span key={tag} className="rounded bg-muted px-1.5 py-0.5 font-mono">{tag}</span>
                    ))}
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
