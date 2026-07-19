import { apiClient } from "./client";

export async function approveApproval(id: string): Promise<any> {
  return apiClient(`/executive/approvals/${encodeURIComponent(id)}/approve`, { method: "POST" });
}

export async function rejectApproval(id: string, reason?: string): Promise<any> {
  return apiClient(`/executive/approvals/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
