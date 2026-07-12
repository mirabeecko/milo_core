import { apiClient } from "./client";
import type { Document } from "@/lib/types";

interface DriveFileResponse {
  files: Array<{
    id: string;
    name: string;
    mimeType: string;
    modifiedAt: string;
    isFolder: boolean;
  }>;
}

function mapMimeTypeToType(mimeType: string): string {
  if (mimeType === "application/vnd.google-apps.folder") return "Složka";
  if (mimeType === "application/vnd.google-apps.document") return "Dokument";
  if (mimeType.includes("spreadsheet")) return "Tabulka";
  if (mimeType.includes("pdf")) return "PDF";
  return "Soubor";
}

export async function getDocuments(): Promise<Document[]> {
  try {
    const response = await apiClient<DriveFileResponse>("/documents");
    return response.files.map((file) => ({
      id: file.id,
      title: file.name,
      type: mapMimeTypeToType(file.mimeType),
      source: "drive" as const,
      date: file.modifiedAt,
      project: undefined,
      tags: [],
      snippet: file.isFolder ? "Google Drive složka" : "Google Drive soubor",
    }));
  } catch {
    return [];
  }
}
