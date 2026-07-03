import { apiClient, useMockData } from "./client";
import type { Document } from "@/lib/types";
import { documents } from "@/lib/mocks";

export async function getDocuments(): Promise<Document[]> {
  if (useMockData) {
    return documents;
  }

  const response = await apiClient<{ files: unknown[] }>("/documents");
  // TODO: map DriveFile -> Document when real integration is ready
  return response.files as Document[];
}
