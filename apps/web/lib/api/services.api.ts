import { apiClient } from "./client";
import type { ApiResponse } from "./types";

export interface ServiceStatus {
  name: string;
  connected: boolean;
  status: "connected" | "offline" | "auth_required" | "disabled";
  lastChecked: string;
  error?: string;
}

export interface ServicesResponse {
  services: ServiceStatus[];
}

export async function getServicesStatus(): Promise<ApiResponse<ServiceStatus[]>> {
  const response = await apiClient<ApiResponse<ServiceStatus[]>>("/services/status");
  return response;
}

export async function checkServiceStatus(serviceName: string): Promise<ApiResponse<ServiceStatus>> {
  const response = await apiClient<ApiResponse<ServiceStatus>>(`/services/status/${serviceName}`);
  return response;
}

export async function connectService(serviceName: string): Promise<ApiResponse<{
  connected: boolean;
  message: string;
}>> {
  const response = await apiClient<ApiResponse<{
    connected: boolean;
    message: string;
  }>>(`/services/connect/${serviceName}`, {
    method: "POST",
  });
  return response;
}

export async function disconnectService(serviceName: string): Promise<ApiResponse<{
  disconnected: boolean;
  message: string;
}>> {
  const response = await apiClient<ApiResponse<{
    disconnected: boolean;
    message: string;
  }>>(`/services/disconnect/${serviceName}`, {
    method: "POST",
  });
  return response;
}
