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
export const computeDiff = file.computeDiff;
export const computeImpact = file.computeImpact;
export const getMissions = file.getMissions;
export const createMission = file.createMission;
export const startMission = file.startMission;
export const updateMission = file.updateMission;
export const generateDeveloperPrompt = file.generateDeveloperPrompt;
export const startAudit = file.startAudit;
export const getAudits = file.getAudits;
export const getDeployments = file.getDeployments;
export const createDeployment = file.createDeployment;
export const computeProgress = file.computeProgress;
