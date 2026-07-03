"use client";

import { useEffect, useState } from "react";
import { FileText, Folder, ExternalLink } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string | null;
  modifiedAt: string;
  size: number | null;
  owners: string[];
  isFolder: boolean;
}

export default function DocumentsPage(): JSX.Element {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFiles(): Promise<void> {
      try {
        const response = await fetch("/api/documents", {
          headers: { Authorization: "Bearer demo-token" },
        });

        if (!response.ok) {
          throw new Error("Nepodařilo se načíst soubory");
        }

        const data = (await response.json()) as { files: DriveFile[] };
        setFiles(data.files);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchFiles();
  }, []);

  const formatSize = (bytes: number | null): string => {
    if (bytes === null) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
            <p className="text-muted-foreground">Soubory a složky z Google Drive.</p>
          </div>
          <Button variant="outline">Připojit Drive</Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Načítám soubory...</p>
        ) : files.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <p className="text-muted-foreground">Žádné soubory k zobrazení.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="text-muted-foreground">
                  {file.isFolder ? <Folder className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold">{file.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{file.isFolder ? "Složka" : file.mimeType.split("/").pop()}</span>
                    <span>{formatSize(file.size)}</span>
                    <span>{new Date(file.modifiedAt).toLocaleDateString("cs-CZ")}</span>
                    {file.owners.length > 0 && <span>{file.owners.join(", ")}</span>}
                  </div>
                </div>
                {file.webViewLink && (
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
