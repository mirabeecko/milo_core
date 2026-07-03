"use client";

import { useEffect, useState } from "react";
import { FileText, RefreshCw, Search, Tag, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { getObsidianNotes, searchObsidian, getObsidianNote, reindexObsidian } from "@/lib/api/knowledge.api";
import { formatRelative } from "@/lib/format";
import type { ObsidianNote } from "@/lib/types";

export default function KnowledgePage(): JSX.Element {
  const [notes, setNotes] = useState<ObsidianNote[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedNote, setSelectedNote] = useState<ObsidianNote | null>(null);

  const loadNotes = async (searchQuery?: string): Promise<void> => {
    try {
      setError(null);
      const data = searchQuery
        ? await searchObsidian(searchQuery)
        : await getObsidianNotes();
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nepodařilo se načíst poznámky"));
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    void loadNotes();
  }, []);

  const handleSearch = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setIsSearching(true);
    await loadNotes(query.trim() || undefined);
  };

  const handleReindex = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await reindexObsidian();
      await loadNotes(query.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Reindex selhal"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectNote = async (id: string): Promise<void> => {
    try {
      const note = await getObsidianNote(id);
      if (note) {
        setSelectedNote(note);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader title="Knowledge" description="Poznámky a znalosti z Obsidianu.">
          <Button variant="outline" onClick={() => void handleReindex()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reindexovat
          </Button>
        </PageHeader>

        <form onSubmit={(e) => void handleSearch(e)} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Hledat v názvech, obsahu a tagech..."
            className="pl-9"
          />
        </form>

        {isLoading || isSearching ? (
          <LoadingState rows={4} />
        ) : error ? (
          <EmptyState
            variant="error"
            title="Nepodařilo se načíst poznámky"
            description={error.message}
            action={
              <Button onClick={() => void loadNotes()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Zkusit znovu
              </Button>
            }
          />
        ) : notes.length === 0 ? (
          <EmptyState
            title="Žádné poznámky"
            description={
              query
                ? "Žádná poznámka neodpovídá hledanému výrazu."
                : "Nastav cestu k Obsidian vaultu v nastavení a spusť reindex."
            }
          />
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} onClick={() => void handleSelectNote(note.id)} />
            ))}
          </div>
        )}
      </div>

      <NoteDialog note={selectedNote} onClose={() => setSelectedNote(null)} />
    </DashboardLayout>
  );
}

function NoteDialog({
  note,
  onClose,
}: {
  note: ObsidianNote | null;
  onClose: () => void;
}): JSX.Element | null {
  if (!note) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <Card
        className="max-h-[80vh] w-full max-w-3xl overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{note.title}</h2>
              <p className="text-sm text-muted-foreground">
                {note.path} · {formatRelative(note.modifiedAt)}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm">
            {note.content}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NoteCard({ note, onClick }: { note: ObsidianNote; onClick: () => void }): JSX.Element {
  return (
    <Card
      className="cursor-pointer transition-colors hover:border-primary/30"
      onClick={onClick}
    >
      <CardContent className="flex items-start gap-4 p-4">
        <div className="mt-1 text-muted-foreground">
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{note.title}</h3>
            <span className="text-xs text-muted-foreground">
              {formatRelative(note.modifiedAt)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{note.path}</p>
          <p className="text-sm text-muted-foreground">{formatPreview(note.content)}...</p>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {note.tags.slice(0, 8).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatPreview(content: string): string {
  return content.replace(/#+ /g, "").replace(/\n/g, " ").slice(0, 180).trim();
}
