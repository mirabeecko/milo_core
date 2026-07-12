import { apiClient } from "./client";

export interface BriefingResponse {
  briefing: string;
  demo?: boolean;
}

export async function generateBriefing(): Promise<BriefingResponse> {
  try {
    return apiClient<BriefingResponse>("/briefing");
  } catch {
    return { briefing: "Briefing API není dostupné.", demo: true };
  }
}
