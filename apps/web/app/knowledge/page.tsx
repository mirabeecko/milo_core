"use client";

import { useEffect, useState } from "react";
import { FileText, Tag } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";

interface ObsidianNote {
  id: string;
  title: string;
  path: string;
  content: string;
  modifiedAt: string;
  tags: string[];
}

export default function KnowledgePage(): JSX.Element {
  const [notes, setNotes] = useState<ObsidianNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNotes(): Promise<void> {
      try {
        const response = await fetch("/api/knowledge/obsidian", {
          headers: { Authorization: "Bearer demo-token" },
        });

        if (!response.ok) {
          throw new Error("Nepodařilo se načíst poznámky");
        }

        const data = (await response.json()) as { notes: ObsidianNote[] };
        setNotes(data.notes);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchNotes();
  }, []);

  const formatPreview = (content: string): string => {
    return content.replace(/#+ /g, "").replace(/\n/g, " ").slice(0, 180).trim();
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Knowledge</h2>
            <p className="text-muted-foreground">Poznámky a znalosti z Obsidianu.</p>
          </div>
          <Button variant="outline">Připojit Obsidian</Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Načítám poznámky...</p>
        ) : notes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <p className="text-muted-foreground">Žádné poznámky k zobrazení.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="mt-1 text-muted-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{note.title}</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.modifiedAt).toLocaleString("cs-CZ")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{note.path}</p>
                  <p className="text-sm text-muted-foreground">{formatPreview(note.content)}...</p>
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
