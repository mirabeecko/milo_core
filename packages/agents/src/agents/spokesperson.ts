import type { AgentDefinition, AgentTask, LiveWorkExplanation } from "@milo/shared";
import type { AiMessage } from "@milo/ai";
import { AgentEntityImpl } from "../agent.js";
import type { AgentEntityDeps } from "../agent.js";
import { XurlService } from "../services/spokesperson/xurl-service.js";
import type { SpokespersonAgentState, XPost } from "../services/spokesperson/types.js";

export class SpokespersonAgent extends AgentEntityImpl {
  private xurlService = new XurlService();
  private state: SpokespersonAgentState = {
    publishedPosts: [],
    scheduledPosts: [],
    taskProgress: 0,
    isConfigured: false,
  };

  constructor(definition: AgentDefinition, deps: AgentEntityDeps) {
    super(definition, deps);
  }

  async initialize(): Promise<void> {
    await super.initialize();
    const status = await this.xurlService.checkStatus();
    this.state.isConfigured = status.authenticated;
  }

  async start(): Promise<void> {
    await super.start();

    this.setExplanation({
      currentActivity: "Kontroluji připojení k X API a načítám existující příspěvky.",
      goal: "Být připraven zveřejňovat oficiální stanoviska spolku.",
      reason: "Bez ověřeného připojení nemohu publikovat jménem spolku.",
      findings: "Začínám inicializaci.",
      evidence: ["xurl CLI", "X API v2"],
      toolsUsed: ["XurlService"],
      nextStep: "Ověřit autentizaci a stav účtu.",
      estimatedCompletion: "Za několik sekund",
      risks: this.state.isConfigured
        ? "Žádné."
        : "X účet není autentizován. Je potřeba spustit 'xurl auth oauth2'.",
      needsFromUser: this.state.isConfigured
        ? "Nic."
        : "Spusť 'xurl auth oauth2 --app <app>' pro autentizaci X účtu.",
      lastCompletedStep: "Inicializace",
      confidence: this.state.isConfigured ? "100 %" : "50 % (čekám na auth)",
      alternativeApproach:
        "Pokud X není dostupný, mohu připravovat návrhy příspěvků offline ke schválení.",
    });

    if (this.state.isConfigured) {
      try {
        const whoami = await this.xurlService.whoami();
        this.setExplanation({
          currentActivity: `Připojen jako @${whoami.data.username} na X.`,
          findings: `Účet @${whoami.data.username} ověřen a připraven.`,
          nextStep: "Čekám na úkoly.",
        });
      } catch (err) {
        console.warn({ err }, "Failed to fetch X user info");
      }
    }

    await this.runAIAnalysis();

    this.setIdleExplanation();
    await this.transitionTo("idle");
  }

  async stop(): Promise<void> {
    await super.stop();
  }

  async pause(): Promise<void> {
    await super.pause();
  }

  async resume(): Promise<void> {
    await super.resume();
  }

  getTaskProgress(): number {
    return this.state.taskProgress;
  }

  getSpokespersonState(): SpokespersonAgentState {
    return { ...this.state };
  }

  /** Get all published posts */
  getPublishedPosts(): XPost[] {
    return [...this.state.publishedPosts];
  }

  /** Post a statement immediately */
  async postStatement(text: string): Promise<XPost> {
    if (!this.state.isConfigured) {
      throw new Error("X účet není autentizován. Spusť 'xurl auth oauth2'.");
    }

    const result = await this.xurlService.post(text);
    const post: XPost = {
      id: result.data.id,
      text: result.data.text,
      createdAt: new Date().toISOString(),
    };

    this.state.publishedPosts.push(post);

    await this.log("info", `Zveřejněn příspěvek: ${result.data.id}`, {
      postId: result.data.id,
      textPreview: text.slice(0, 100),
    });

    return post;
  }

  /** Post a thread of statements */
  async postThread(statements: string[]): Promise<XPost[]> {
    if (!this.state.isConfigured) {
      throw new Error("X účet není autentizován. Spusť 'xurl auth oauth2'.");
    }

    const results = await this.xurlService.postThread(statements);
    const posts: XPost[] = results.map((r) => ({
      id: r.data.id,
      text: r.data.text,
      createdAt: new Date().toISOString(),
    }));

    this.state.publishedPosts.push(...posts);

    await this.log("info", `Zveřejněno vlákno: ${posts.length} příspěvků`, {
      postIds: posts.map((p) => p.id),
    });

    return posts;
  }

  /** Schedule a post for later (stores in memory, real scheduling via AgentManager) */
  async schedulePost(text: string, scheduledFor: string): Promise<void> {
    this.state.scheduledPosts.push({ text, scheduledFor });
    await this.log("info", `Naplánován příspěvek na ${scheduledFor}`, {
      textPreview: text.slice(0, 100),
    });
  }

  /** Search mentions */
  async searchMentions(query: string): Promise<void> {
    if (!this.state.isConfigured) {
      throw new Error("X účet není autentizován.");
    }

    this.state.lastSearchQuery = query;
    this.state.lastSearchResults = await this.xurlService.search(query);

    await this.log("info", `Vyhledáno "${query}": ${this.state.lastSearchResults.meta?.result_count ?? 0} výsledků`);
  }

  async runTask(task: AgentTask): Promise<void> {
    if (this.status === "offline") {
      throw new Error(`Agent ${this.id} is offline`);
    }

    const startedAt = Date.now();
    this.activeTaskId = task.id;
    this.runningTasks += 1;
    this.state.taskProgress = 0;
    await this.transitionTo("working");
    this.agent.metrics.totalTasks += 1;

    await this.log("info", `Spouštím úkol mluvčího: ${task.title}`, { taskId: task.id });

    this.setExplanation({
      currentActivity: `Spouštím úkol: ${task.title}`,
      goal: task.description ?? "Dokončit zadaný úkol",
      reason: `Přijal jsem úkol od ${task.ownerType} ${task.ownerId}`,
      findings: "Zatím začínám.",
      evidence: ["interní fronta úkolů"],
      toolsUsed: this.agent.config.tools.slice(0, 3),
      nextStep: "Provést požadovanou akci.",
      estimatedCompletion: "Za několik sekund",
      risks: this.state.isConfigured ? "Žádné." : "X není autentizován.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Přijetí úkolu",
      confidence: "100 %",
      alternativeApproach: "Žádný.",
    });

    try {
      // Task payload can contain: type, text, statements, mediaPath, query, scheduledFor
      const payload = task.payload as Record<string, unknown> | undefined;
      const actionType = (payload?.type as string) ?? "post";

      switch (actionType) {
        case "post": {
          const text = payload?.text as string;
          if (!text) throw new Error("Chybí text příspěvku (payload.text)");
          const post = await this.postStatement(text);
          this.state.taskProgress = 100;
          await this.log("info", `Úkol splněn: příspěvek ${post.id} zveřejněn`);
          break;
        }
        case "thread": {
          const statements = payload?.statements as string[];
          if (!statements?.length) throw new Error("Chybí statements (payload.statements)");
          const posts = await this.postThread(statements);
          this.state.taskProgress = 100;
          await this.log("info", `Úkol splněn: vlákno ${posts.length} příspěvků zveřejněno`);
          break;
        }
        case "search": {
          const query = payload?.query as string;
          if (!query) throw new Error("Chybí vyhledávací dotaz (payload.query)");
          await this.searchMentions(query);
          this.state.taskProgress = 100;
          break;
        }
        case "schedule": {
          const text = payload?.text as string;
          const scheduledFor = payload?.scheduledFor as string;
          if (!text || !scheduledFor) throw new Error("Chybí text nebo scheduledFor");
          await this.schedulePost(text, scheduledFor);
          this.state.taskProgress = 100;
          break;
        }
        default:
          throw new Error(`Neznámý typ akce: ${actionType}`);
      }

      this.completedTasks += 1;
      this.agent.metrics.successfulTasks += 1;
      this.consecutiveErrors = 0;

      this.setExplanation({
        currentActivity: "Úkol dokončen.",
        findings: `Úkol ${task.title} byl úspěšně dokončen.`,
        lastCompletedStep: `Dokončil jsem úkol ${task.title}`,
      });
    } catch (error) {
      this.failedTasks += 1;
      this.agent.metrics.failedTasks += 1;
      this.agent.metrics.errorCount += 1;
      this.consecutiveErrors += 1;
      this.state.taskProgress = 0;

      const message = error instanceof Error ? error.message : String(error);
      await this.log("error", `Úkol selhal: ${message}`, { taskId: task.id });
      this.setExplanation({
        currentActivity: "Úkol selhal.",
        findings: `Úkol ${task.title} selhal: ${message}`,
      });

      if (this.consecutiveErrors >= this.deps.config.maxConsecutiveErrors) {
        await this.transitionTo("error");
      }
    } finally {
      this.runningTasks = Math.max(0, this.runningTasks - 1);
      this.activeTaskId = undefined;
      this.state.taskProgress = 0;
      if (this.status !== "paused" && this.status !== "error") {
        await this.transitionTo("idle");
      }
    }

    const actualTimeMs = Date.now() - startedAt;
    if (this.agent.metrics.averageDurationMs === 0) {
      this.agent.metrics.averageDurationMs = actualTimeMs;
    } else {
      const total = this.agent.metrics.successfulTasks + this.agent.metrics.failedTasks;
      this.agent.metrics.averageDurationMs = Math.round(
        (this.agent.metrics.averageDurationMs * (total - 1) + actualTimeMs) / total,
      );
    }
    this.agent.metrics.lastUpdatedAt = new Date().toISOString();
  }

  private async runAIAnalysis(): Promise<string> {
    if (!this.deps.aiRouter) {
      const fallback = this.buildFallbackSummary();
      this.setExplanation({
        currentActivity: "AI není nakonfigurováno. Připraven pracovat s přímými příkazy.",
        findings: fallback,
        nextStep: "Nakonfigurujte ModelRouter pro AI asistenci při tvorbě příspěvků.",
      });
      return `[AI není nakonfigurováno]\n\n${fallback}`;
    }

    this.setExplanation({
      currentActivity: "Připravuji AI asistenci pro tvorbu příspěvků.",
      nextStep: "Komunikuji s jazykovým modelem.",
    });

    try {
      const provider = this.deps.aiRouter.getProvider("analyze");
      const content = [
        `Stav X účtu: ${this.state.isConfigured ? "Připojen" : "Nepřipojen"}`,
        `Publikovaných příspěvků: ${this.state.publishedPosts.length}`,
        `Naplánovaných příspěvků: ${this.state.scheduledPosts.length}`,
        `Poslední dotaz: ${this.state.lastSearchQuery ?? "žádný"}`,
      ].join("\n");

      const messages: AiMessage[] = [
        {
          role: "system",
          content:
            "Jsi oficiální mluvčí spolku. Zhodnoť aktuální stav komunikace: co bylo publikováno, co je naplánováno, co by se mělo komunikovat dál. Navrhni případné další kroky. Odpovídej česky, stručně.",
        },
        { role: "user", content },
      ];

      const result = await provider.complete(messages, { temperature: 0.3 });

      this.setExplanation({
        currentActivity: "AI analýza dokončena.",
        findings: `Analyzován stav komunikace. ${this.state.publishedPosts.length} příspěvků publikováno.`,
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const fallback = this.buildFallbackSummary();
      this.setExplanation({
        currentActivity: "AI analýza selhala, používám fallback.",
        findings: `Chyba: ${message}. ${fallback}`,
      });
      return `[AI dočasně nedostupné: ${message}]\n\n${fallback}`;
    }
  }

  private buildFallbackSummary(): string {
    return [
      `Stav mluvčího (bez AI):`,
      `- X účet: ${this.state.isConfigured ? "Připojen" : "Nepřipojen – spusť 'xurl auth oauth2'"}`,
      `- Publikovaných příspěvků: ${this.state.publishedPosts.length}`,
      `- Naplánovaných příspěvků: ${this.state.scheduledPosts.length}`,
      `- Poslední vyhledávání: ${this.state.lastSearchQuery ?? "žádné"}`,
      this.state.publishedPosts.length > 0
        ? `\nPoslední příspěvky:\n${this.state.publishedPosts.slice(-3).map((p) => `  - [${p.id}] ${p.text.slice(0, 80)}...`).join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  private setIdleExplanation(): void {
    this.state.taskProgress = 0;
    this.setExplanation({
      currentActivity: this.state.isConfigured
        ? "Čekám na pokyny ke zveřejnění oficiálních stanovisek."
        : "Čekám na autentizaci X účtu.",
      goal: "Být připraven okamžitě zveřejnit oficiální komunikaci spolku.",
      reason: "Mluvčí musí být vždy připraven reagovat na aktuální dění.",
      findings: this.state.isConfigured
        ? `X účet připojen. ${this.state.publishedPosts.length} příspěvků publikováno, ${this.state.scheduledPosts.length} naplánováno.`
        : "X účet není autentizován. Je potřeba spustit autentizaci.",
      evidence: ["X API", "Historie příspěvků"],
      toolsUsed: ["XurlService"],
      nextStep: "Čekám na úkol nebo instrukci.",
      estimatedCompletion: "Neurčito",
      risks: this.state.isConfigured ? "Žádné." : "Bez autentizace nemohu publikovat.",
      needsFromUser: this.state.isConfigured ? "Nic." : "Spusť 'xurl auth oauth2 --app <app>'.",
      lastCompletedStep: "Inicializace a ověření stavu",
      confidence: this.state.isConfigured ? "100 %" : "0 % (čekám na auth)",
      alternativeApproach:
        "Pokud nejsou žádné úkoly, budu čekat na instrukce.",
      decisionLog: this.explanation.decisionLog,
    });
  }
}
