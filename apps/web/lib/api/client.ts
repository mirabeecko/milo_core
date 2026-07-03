import { ApiError } from "./types";

const API_BASE = "/api";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("milo:accessToken");
}

export async function apiClient<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, text);
  }

  return response.json() as Promise<T>;
}

export const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
