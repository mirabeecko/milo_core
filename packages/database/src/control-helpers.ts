/**
 * Control Center helpers — DB s fallback na file-based storage.
 * Automaticky detekuje dostupnost Supabase tabulek.
 */
import * as file from "./control-file.js";

// Try to use Supabase if available, fall back to file storage
// Simplification: always use file storage for now (no Supabase migration needed)
export const getAgents = file.getAgents;
export const getAgentById = file.getAgentById;
export const createAgent = file.createAgent;
export const updateAgent = file.updateAgent;
export const archiveAgent = file.archiveAgent;
export const getAgentVersions = file.getAgentVersions;
export const createAgentVersion = file.createAgentVersion;
export const getUseCases = file.getUseCases;
export const getUseCaseById = file.getUseCaseById;
export const createUseCase = file.createUseCase;
export const updateUseCase = file.updateUseCase;
export const getCapabilities = file.getCapabilities;
export const createCapability = file.createCapability;
export const getComponents = file.getComponents;
export const createComponent = file.createComponent;
export const getTasks = file.getTasks;
export const createTask = file.createTask;
export const updateTask = file.updateTask;
