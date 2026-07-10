import { apiClient, useMockData } from "./client";

export interface BriefingResponse {
  briefing: string;
  demo?: boolean;
}

export async function generateBriefing(): Promise<BriefingResponse> {
  if (useMockData) {
    return { briefing: "Briefing není k dispozici — připojte AI provider.", demo: true };
  }

  return apiClient<BriefingResponse>("/briefing");
}
