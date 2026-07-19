/**
 * Safety Rules Engine — vynucuje AGENT_SAFETY_RULES.md na runtime úrovni.
 *
 * Pravidla:
 * - Režimy práce: ANALYZE, PLAN, IMPLEMENT, VERIFY, RECOVERY
 * - IMPLEMENT vyžaduje předchozí PLAN (nebo ANALYZU)
 * - Chráněné soubory nesmí být měněny bez povolení
 * - Scope creep detekce
 * - Minimální zásah — nepřidávat nic mimo scope
 *
 * Použití:
 *   const engine = new SafetyRulesEngine();
 *   engine.setMode(agentId, "analyze");
 *   const check = engine.beforeTask(task, agent);
 *   if (!check.allowed) throw new Error(check.reason);
 */
import type { Agent, AgentTask } from "@milo/shared";

/** Režimy práce podle AGENT_SAFETY_RULES.md sekce 3 */
export type AgentWorkMode = "analyze" | "plan" | "implement" | "verify" | "recovery";

/** Soubor se scope restrikcemi */
export interface FileScope {
  path: string;
  allowed: boolean;
  reason: string;
}

/** Výsledek kontroly */
export interface SafetyCheck {
  allowed: boolean;
  reason?: string;
  mode?: AgentWorkMode;
}

/** Session záznam pro agenta */
interface AgentSession {
  agentId: string;
  currentMode: AgentWorkMode | null;
  plannedFiles: string[];
  changedFiles: string[];
  taskHistory: Array<{ type: string; title: string; timestamp: string }>;
}

/** Chráněné soubory — nesmí se měnit bez explicitního povolení */
const PROTECTED_FILES: FileScope[] = [
  { path: ".env", allowed: false, reason: "Obsahuje credentials — sekce 6.1" },
  { path: ".env.local", allowed: false, reason: "Obsahuje credentials — sekce 6.1" },
  { path: "apps/api/src/config", allowed: false, reason: "Konfigurace API — sekce 6.1" },
  { path: "apps/api/src/server.ts", allowed: false, reason: "Start serveru — sekce 6.3" },
  { path: "apps/web/next.config", allowed: false, reason: "Build konfigurace — sekce 6.3" },
  { path: "package.json", allowed: false, reason: "Workspace — sekce 6.3" },
  { path: "pnpm-lock.yaml", allowed: false, reason: "Lock file — sekce 6.3" },
  { path: "pnpm-workspace.yaml", allowed: false, reason: "Workspace config — sekce 6.3" },
  { path: "tsconfig", allowed: false, reason: "TypeScript config — sekce 6.3" },
  { path: "apps/api/src/modules/auth", allowed: false, reason: "Auth modul — sekce 6.2" },
  { path: "apps/api/src/modules/email", allowed: false, reason: "Email modul — sekce 6.2" },
  { path: "apps/api/src/modules/calendar", allowed: false, reason: "Calendar modul — sekce 6.2" },
  { path: "packages/tools/src/providers/google", allowed: false, reason: "Google provider — sekce 6.2" },
  { path: "packages/tools/src/providers/gmail", allowed: false, reason: "Gmail provider — sekce 6.2" },
  { path: "packages/tools/src/providers/calendar", allowed: false, reason: "Calendar provider — sekce 6.2" },
  { path: "packages/agents/src/services/communication", allowed: false, reason: "Communication service — sekce 6.2" },
  { path: "packages/agents/src/services/calendar", allowed: false, reason: "Calendar service — sekce 6.2" },
];

/** Filesystem-only tool patterns */
const FILESYSTEM_TOOLS = [
  "write_file", "patch", "write", "save",
  "delete", "remove", "unlink", "rm",
];

export class SafetyRulesEngine {
  private sessions = new Map<string, AgentSession>();

  // ── Režim ───────────────────────────────────────────────────

  /** Nastav režim práce agenta */
  setMode(agentId: string, mode: AgentWorkMode): void {
    const session = this._ensureSession(agentId);
    session.currentMode = mode;
  }

  /** Získej aktuální režim */
  getMode(agentId: string): AgentWorkMode | null {
    return this.sessions.get(agentId)?.currentMode ?? null;
  }

  // ── Kontrola před taskem ────────────────────────────────────

  /**
   * Zkontroluj, jestli agent smí spustit task.
   * Volá se před ExecutionTaskRunner.runStrategy().
   */
  beforeTask(task: AgentTask, agent: Agent): SafetyCheck {
    const session = this._ensureSession(agent.id);
    const mode = session.currentMode;

    // Bez režimu — povolit (první task)
    if (!mode) {
      return { allowed: true, mode: undefined };
    }

    // IMPLEMENT vyžaduje předchozí PLAN
    if (task.type === "implement" && mode !== "plan" && mode !== "implement") {
      const lastPlan = session.taskHistory.findLast(t => 
        t.type === "plan" || t.type === "analyze"
      );
      if (!lastPlan) {
        return {
          allowed: false,
          mode,
          reason: `SAFETY ENGINE: IMPLEMENT task "${task.title}" vyžaduje předchozí PLAN. ` +
            `Aktuální režim: ${mode}. Nastav režim na 'plan' a vytvoř plán změny (sekce 4).`,
        };
      }
    }

    // RECOVERY — jen obnova, nic nového (sekce 17)
    if (mode === "recovery" && task.type !== "recovery" && task.type !== "analyze") {
      return {
        allowed: false,
        mode,
        reason: `SAFETY ENGINE: V režimu RECOVERY smíš jen recovery/analyze tasky. ` +
          `Task "${task.title}" (typ ${task.type}) není povolen.`,
      };
    }

    // VERIFY — jen ověřování, žádné změny (sekce 3.4)
    if (mode === "verify" && task.type === "implement") {
      return {
        allowed: false,
        mode,
        reason: `SAFETY ENGINE: V režimu VERIFY nesmíš implementovat. ` +
          `Task "${task.title}" porušuje pravidlo sekce 3.4.`,
      };
    }

    return { allowed: true, mode };
  }

  /**
   * Zaznamenej dokončený task do historie.
   */
  afterTask(agentId: string, task: AgentTask): void {
    const session = this._ensureSession(agentId);
    session.taskHistory.push({
      type: task.type ?? "custom",
      title: task.title,
      timestamp: new Date().toISOString(),
    });

    // Automatický přechod: PLAN → IMPLEMENT
    if (task.type === "plan" && session.currentMode === "plan") {
      session.currentMode = "implement";
    }
  }

  // ── Ochrana souborů ─────────────────────────────────────────

  /**
   * Zkontroluj, jestli soubor smí být změněn.
   * Volá se před write_file / patch / delete.
   */
  checkFileAccess(filePath: string, agentId: string): SafetyCheck {
    for (const protectedFile of PROTECTED_FILES) {
      if (filePath.includes(protectedFile.path)) {
        return {
          allowed: false,
          reason: `SAFETY ENGINE: Soubor "${filePath}" je chráněný — ${protectedFile.reason}. ` +
            `Potřebuješ explicitní povolení CEO (AGENT_SAFETY_RULES.md sekce 6).`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Zkontroluj, jestli nástroj nemodifikuje soubory mimo scope.
   */
  checkToolScope(toolName: string, args: Record<string, unknown>, agentId: string): SafetyCheck {
    // Jen pro filesystem nástroje
    if (!FILESYSTEM_TOOLS.some(t => toolName.includes(t))) {
      return { allowed: true };
    }

    const filePath = (args.path || args.file || args.filePath || args.target) as string | undefined;
    if (!filePath) {
      return { allowed: true };
    }

    return this.checkFileAccess(filePath, agentId);
  }

  // ── Scope creep ─────────────────────────────────────────────

  /**
   * Zaregistruj plánované soubory (z PLAN fáze).
   */
  registerPlannedFiles(agentId: string, files: string[]): void {
    const session = this._ensureSession(agentId);
    session.plannedFiles = files;
  }

  /**
   * Zkontroluj, jestli změna souboru je v plánu.
   */
  checkScope(filePath: string, agentId: string): SafetyCheck {
    const session = this.sessions.get(agentId);
    if (!session || session.plannedFiles.length === 0) {
      return { allowed: true }; // Žádný plán = žádná kontrola
    }

    const isPlanned = session.plannedFiles.some(f => filePath.includes(f));
    if (!isPlanned) {
      return {
        allowed: false,
        reason: `SAFETY ENGINE: Soubor "${filePath}" není v plánu změn. ` +
          `Plánované soubory: ${session.plannedFiles.join(", ")}. ` +
          `Agenti nesmí měnit soubory mimo scope (AGENT_SAFETY_RULES.md sekce 7).`,
      };
    }

    return { allowed: true };
  }

  // ── Report ──────────────────────────────────────────────────

  /** Vrať report o session agenta */
  getSessionReport(agentId: string): AgentSession | null {
    return this.sessions.get(agentId) ?? null;
  }

  /** Vyčisti session */
  resetAgent(agentId: string): void {
    this.sessions.delete(agentId);
  }

  // ── Internals ───────────────────────────────────────────────

  private _ensureSession(agentId: string): AgentSession {
    let session = this.sessions.get(agentId);
    if (!session) {
      session = {
        agentId,
        currentMode: null,
        plannedFiles: [],
        changedFiles: [],
        taskHistory: [],
      };
      this.sessions.set(agentId, session);
    }
    return session;
  }
}

/** Singleton */
let _instance: SafetyRulesEngine | null = null;

export function getSafetyEngine(): SafetyRulesEngine {
  if (!_instance) {
    _instance = new SafetyRulesEngine();
  }
  return _instance;
}
