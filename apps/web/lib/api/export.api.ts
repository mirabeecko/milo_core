import { getAccessToken } from "./client";

export async function exportData(type: string, format: string): Promise<Blob> {
  const token = getAccessToken();
  const response = await fetch(`/api/export/${type}?format=${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Export failed (${response.status}): ${text}`);
  }
  return response.blob();
}

export async function downloadExport(type: string, format: string): Promise<void> {
  const blob = await exportData(type, format);
  const extension = format === "json" ? "json" : "md";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `milo-${type}-export.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
