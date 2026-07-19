import type { AgentDefinition, AgentTask, LiveWorkExplanation } from "@milo/shared";
import type { AiMessage } from "@milo/ai";
import { AgentEntityImpl } from "../agent.js";
import type { AgentEntityDeps } from "../agent.js";

// ─── Graphics Agent domain types ────────────────────────────────

export interface ImageGenerationInput {
  prompt: string;
  aspectRatio?: "landscape" | "square" | "portrait";
  referenceImages?: string[];
  style?: string;
}

export interface ImageGenerationResult {
  url: string;
  prompt: string;
  aspectRatio: string;
  generatedAt: string;
}

export interface LayoutInput {
  name: string;
  description: string;
  targetDevice?: "desktop" | "tablet" | "mobile" | "responsive";
  framework?: "tailwind" | "plain-css" | "scss";
  sections: string[];
  colorScheme?: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
}

export interface LayoutResult {
  path: string;
  html: string;
  css: string;
  previewDescription: string;
}

export interface DesignEditInput {
  targetFile: string;
  editDescription: string;
  scope?: "css" | "html" | "layout" | "all";
}

export interface DesignEditResult {
  file: string;
  changes: string;
  diff?: string;
}

export interface DesignAgentState {
  taskProgress: number;
  recentImages: ImageGenerationResult[];
  recentLayouts: LayoutResult[];
  recentEdits: DesignEditResult[];
}

// ─── Graphics Agent implementation ──────────────────────────────

export class DesignAgent extends AgentEntityImpl {
  private state: DesignAgentState = {
    taskProgress: 0,
    recentImages: [],
    recentLayouts: [],
    recentEdits: [],
  };

  constructor(definition: AgentDefinition, deps: AgentEntityDeps) {
    super(definition, deps);
  }

  // ─── Lifecycle ──────────────────────────────────────────────

  async start(): Promise<void> {
    await super.start();

    this.setExplanation({
      currentActivity: "Jsem připraven vytvářet grafiku, layouty a upravovat design.",
      goal: "Generovat obrázky, vytvářet responzivní layouty a upravovat vizuální styl projektů.",
      reason: "Graphics Agent čeká na instrukci od Chief of Staff nebo uživatele.",
      findings: "Žádný aktivní úkol.",
      evidence: [],
      toolsUsed: this.agent.config.tools.slice(0, 5),
      nextStep: "Přijmout úkol a spustit grafickou práci.",
      estimatedCompletion: "Neurčito",
      risks: "Žádné.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Inicializace",
      confidence: "100 %",
      alternativeApproach: "Žádný.",
    });

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

  // ─── Run task ──────────────────────────────────────────────

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

    await this.log("info", `Spouštím grafický úkol: ${task.title}`, { taskId: task.id });

    this.setExplanation({
      currentActivity: `Spouštím úkol: ${task.title}`,
      goal: task.description ?? "Dokončit zadaný grafický úkol",
      reason: `Přijal jsem úkol od ${task.ownerType} ${task.ownerId}`,
      findings: "Zatím začínám.",
      evidence: ["interní fronta úkolů"],
      toolsUsed: this.agent.config.tools.slice(0, 5),
      nextStep: "Analyzovat zadání a připravit podklady.",
      estimatedCompletion: "Za několik vteřin",
      risks: "Žádné známé riziko.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Přijetí úkolu",
      confidence: "100 %",
      alternativeApproach: "Žádný.",
    });

    try {
      const result = await this.executeDesignTask(task);
      this.state.taskProgress = 100;

      this.completedTasks += 1;
      this.agent.metrics.successfulTasks += 1;
      this.consecutiveErrors = 0;

      await this.log("info", `Úkol dokončen: ${task.title}`, { taskId: task.id, output: result });
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

  // ─── Domain methods ───────────────────────────────────────

  /**
   * Generate an image from a text prompt using the configured image generation API.
   */
  async generateImage(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    this.setExplanation({
      ...this.explanation,
      currentActivity: `Generuji obrázek: "${input.prompt.slice(0, 80)}"`,
      goal: "Vytvořit vizuální výstup podle textového popisu.",
      reason: "Uživatel požádal o generování obrázku.",
      findings: "Odesílám prompt do image generation API...",
      evidence: ["image generation API"],
      toolsUsed: ["image_generate", "filesystem:write"],
      nextStep: "Uložit vygenerovaný obrázek do projektu.",
      estimatedCompletion: "Několik vteřin",
      risks: "Nízké.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Přijetí požadavku",
      confidence: "90 %",
      alternativeApproach: "Zkusit alternativní poměr stran nebo styl.",
    });

    // Use the tool registry to generate image — falls back to AI description
    let imageUrl: string;

    try {
      const genResult = await this.deps.toolRegistry.execute("image:generate", {
        prompt: input.prompt,
        aspectRatio: input.aspectRatio ?? "landscape",
        style: input.style,
        referenceImages: input.referenceImages,
      });
      imageUrl = typeof genResult === "string" ? genResult : (genResult as { url: string }).url;
    } catch {
      // Fallback: use AI to describe what would be generated
      const fallback = await this.generateImageDescription(input.prompt);
      imageUrl = fallback;
    }

    const result: ImageGenerationResult = {
      url: imageUrl,
      prompt: input.prompt,
      aspectRatio: input.aspectRatio ?? "landscape",
      generatedAt: new Date().toISOString(),
    };

    this.state.recentImages.unshift(result);
    if (this.state.recentImages.length > 20) {
      this.state.recentImages = this.state.recentImages.slice(0, 20);
    }

    await this.log("info", `Obrázek vygenerován: ${input.prompt.slice(0, 60)}`, {
      url: imageUrl,
      aspectRatio: input.aspectRatio,
    });

    this.setExplanation({
      ...this.explanation,
      currentActivity: "Obrázek vygenerován.",
      findings: `Obrázek pro prompt "${input.prompt.slice(0, 40)}..." byl vygenerován.`,
      lastCompletedStep: "Generování obrázku",
    });

    return result;
  }

  /**
   * Create a responsive layout (HTML + CSS) based on description.
   * Writes the result to the project filesystem.
   */
  async createLayout(input: LayoutInput): Promise<LayoutResult> {
    this.setExplanation({
      ...this.explanation,
      currentActivity: `Vytvářím layout: "${input.name}"`,
      goal: "Vygenerovat HTML a CSS pro responzivní layout.",
      reason: "Uživatel požádal o vytvoření layoutu.",
      findings: "Analyzuji požadavky a generuji kód...",
      evidence: ["layout engine", "AI model", "CSS framework"],
      toolsUsed: ["filesystem:write", "shell:execute"],
      nextStep: "Zapsat vygenerované soubory do projektu.",
      estimatedCompletion: "Několik vteřin",
      risks: "Nízké.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Přijetí zadání",
      confidence: "95 %",
      alternativeApproach: "Použít existující šablonu.",
    });

    const framework = input.framework ?? "tailwind";
    const device = input.targetDevice ?? "responsive";

    // Generate layout using AI
    const htmlCss = await this.generateLayoutCode(input);

    // Determine output path
    const projectPath = this.deps.projectPath ?? process.cwd();
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    const outDir = `${projectPath}/layouts/${slug}`;

    // Write files via tool registry
    try {
      await this.deps.toolRegistry.execute("filesystem:write", {
        filePath: `${outDir}/index.html`,
        content: htmlCss.html,
      });
      await this.deps.toolRegistry.execute("filesystem:write", {
        filePath: `${outDir}/style.css`,
        content: htmlCss.css,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.log("warn", `Nepodařilo se zapsat layout soubory: ${msg}`);
    }

    const result: LayoutResult = {
      path: outDir,
      html: htmlCss.html.slice(0, 500),
      css: htmlCss.css.slice(0, 500),
      previewDescription: `${input.name} — ${device} layout s ${input.sections.length} sekcemi (${framework})`,
    };

    this.state.recentLayouts.unshift(result);
    if (this.state.recentLayouts.length > 20) {
      this.state.recentLayouts = this.state.recentLayouts.slice(0, 20);
    }

    await this.log("info", `Layout vytvořen: ${input.name}`, {
      path: outDir,
      sections: input.sections.length,
      framework,
    });

    return result;
  }

  /**
   * Edit the design of an existing file — modify CSS, HTML structure, or layout.
   */
  async editDesign(input: DesignEditInput): Promise<DesignEditResult> {
    this.setExplanation({
      ...this.explanation,
      currentActivity: `Upravuji design: ${input.targetFile}`,
      goal: input.editDescription,
      reason: "Uživatel požádal o úpravu designu.",
      findings: "Čtu soubor a analyzuji změny...",
      evidence: ["filesystem:read", "filesystem:write"],
      toolsUsed: ["filesystem:read", "filesystem:write", "shell:execute"],
      nextStep: "Provést úpravy a zapsat změny.",
      estimatedCompletion: "Několik vteřin",
      risks: "Nízké.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Přijetí požadavku",
      confidence: "90 %",
      alternativeApproach: "Vrátit návrh změn bez zápisu.",
    });

    // Read the target file
    let originalContent: string;
    try {
      originalContent = await this.deps.toolRegistry.execute("filesystem:read", {
        filePath: input.targetFile,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Nelze přečíst soubor ${input.targetFile}: ${msg}`);
    }

    // Generate design edit using AI
    const modifiedContent = await this.generateDesignEdit(
      input.targetFile,
      originalContent,
      input.editDescription,
      input.scope,
    );

    // Write the modified file
    try {
      await this.deps.toolRegistry.execute("filesystem:write", {
        filePath: input.targetFile,
        content: modifiedContent,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Nelze zapsat soubor ${input.targetFile}: ${msg}`);
    }

    const result: DesignEditResult = {
      file: input.targetFile,
      changes: input.editDescription,
    };

    this.state.recentEdits.unshift(result);
    if (this.state.recentEdits.length > 20) {
      this.state.recentEdits = this.state.recentEdits.slice(0, 20);
    }

    await this.log("info", `Design upraven: ${input.targetFile}`, {
      edit: input.editDescription,
      scope: input.scope,
    });

    return result;
  }

  /**
   * Analyze a project for visual consistency and responsive issues.
   */
  async analyzeDesign(targetPath?: string): Promise<string> {
    const projectPath = targetPath ?? this.deps.projectPath;
    if (!projectPath) {
      throw new Error("Není nastaven projectPath — nemohu analyzovat.");
    }

    this.setExplanation({
      ...this.explanation,
      currentActivity: "Analyzuji vizuální konzistenci projektu.",
      goal: "Identifikovat problémy s designem, responzivitou a přístupností.",
      reason: "Uživatel požádal o design review.",
      findings: "Procházím CSS a komponentové soubory...",
      evidence: ["filesystem:list", "filesystem:read"],
      toolsUsed: ["filesystem:list", "filesystem:read"],
      nextStep: "Provést AI analýzu nalezených souborů.",
      estimatedCompletion: "Několik vteřin",
      risks: "Velké projekty mohou trvat déle.",
      needsFromUser: "Nic.",
      lastCompletedStep: "Zahájení analýzy",
      confidence: "85 %",
      alternativeApproach: "Analyzovat pouze CSS bez komponent.",
    });

    const files = await this.collectDesignFiles(projectPath);

    if (files.length === 0) {
      const msg = "Nenalezeny žádné soubory k analýze (hledám *.css, *.scss, *.html, *.tsx, *.jsx).";
      this.setExplanation({ ...this.explanation, findings: msg });
      return msg;
    }

    const result = await this.runAIAnalysis(files, "Design analýza projektu", "Analyzovat vizuální konzistenci");

    this.setExplanation({
      ...this.explanation,
      currentActivity: "Design analýza dokončena.",
      findings: `Analyzováno ${files.length} souborů.`,
      lastCompletedStep: "Design analýza",
    });

    return result;
  }

  override explain(): LiveWorkExplanation {
    return {
      ...this.explanation,
      currentActivity: "Jsem připraven vytvářet grafiku, layouty a upravovat design.",
      goal: "Generovat obrázky, vytvářet responzivní layouty a upravovat vizuální styl projektů.",
      reason: "Graphics Agent čeká na instrukci od Chief of Staff nebo uživatele.",
    };
  }

  // ─── Private helpers ──────────────────────────────────────

  private async executeDesignTask(task: AgentTask): Promise<string> {
    const title = task.title.toLowerCase();
    const desc = task.description ?? "";

    this.state.taskProgress = 10;

    // Determine task type from title/description
    if (title.includes("obrázek") || title.includes("image") || desc.includes("generovat obrázek")) {
      this.state.taskProgress = 20;
      const result = await this.generateImage({
        prompt: desc || task.title,
        aspectRatio: "landscape",
      });
      this.state.taskProgress = 90;
      return `Obrázek vygenerován: ${result.url}`;
    }

    if (title.includes("layout") || title.includes("šablona") || desc.includes("vytvoř layout")) {
      this.state.taskProgress = 20;
      const result = await this.createLayout({
        name: task.title,
        description: desc,
        sections: ["header", "main", "footer"],
        framework: "tailwind",
      });
      this.state.taskProgress = 90;
      return `Layout vytvořen v ${result.path}: ${result.previewDescription}`;
    }

    if (title.includes("uprav") || title.includes("edit") || title.includes("změň")) {
      this.state.taskProgress = 20;
      // Extract file path from description
      const fileMatch = desc.match(/(?:soubor|file|v)\s+["']?([^\s"']+\.(css|html|scss|less|tsx|jsx))["']?/i);
      const targetFile = fileMatch?.[1] ?? "style.css";
      const result = await this.editDesign({
        targetFile,
        editDescription: desc,
        scope: "all",
      });
      this.state.taskProgress = 90;
      return `Design upraven: ${result.file} — ${result.changes}`;
    }

    // Default: analyze design
    this.state.taskProgress = 20;
    const analysis = await this.analyzeDesign();
    this.state.taskProgress = 90;
    return analysis;
  }

  private async generateImageDescription(prompt: string): Promise<string> {
    if (!this.deps.aiRouter) {
      return `[AI není nakonfigurováno] Popis obrázku pro prompt: "${prompt}" — nakonfigurujte ModelRouter.`;
    }

    try {
      const provider = this.deps.aiRouter.getProvider("analyze");
      const messages: AiMessage[] = [
        {
          role: "system",
          content:
            "Jsi expert na vizuální design a grafiku. Popiš, jak by měl vypadat obrázek podle zadaného promptu. Popiš kompozici, barvy, styl, náladu a klíčové prvky. Odpovídej česky, výstižně.",
        },
        { role: "user", content: `Prompt: ${prompt}\n\nPopiš, jak by měl výsledný obrázek vypadat:` },
      ];
      return await provider.complete(messages, { temperature: 0.4 });
    } catch {
      return `[AI nedostupné] Obrázek pro prompt "${prompt}" by byl vygenerován.`;
    }
  }

  private async generateLayoutCode(input: LayoutInput): Promise<{ html: string; css: string }> {
    if (!this.deps.aiRouter) {
      return this.fallbackLayout(input);
    }

    try {
      const provider = this.deps.aiRouter.getProvider("analyze");

      const colorInfo = input.colorScheme
        ? `Barvy: primary=${input.colorScheme.primary}, secondary=${input.colorScheme.secondary}, bg=${input.colorScheme.background}, text=${input.colorScheme.text}`
        : "Použij moderní tmavé barevné schéma.";

      const messages: AiMessage[] = [
        {
          role: "system",
          content: [
            "Jsi expert na HTML/CSS layouty a responzivní design.",
            "Vytvoř kompletní HTML a CSS pro layout podle zadání.",
            `Framework: ${input.framework ?? "tailwind"}.`,
            `Cílové zařízení: ${input.targetDevice ?? "responsive"}.`,
            "HTML piš do <body>, bez <!DOCTYPE> a <head>.",
            "CSS piš čisté, moderní, s mobile-first přístupem.",
            "Odpovídej formátem:",
            "### HTML",
            "<html kód>",
            "### CSS",
            "<css kód>",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            `Název: ${input.name}`,
            input.description ? `Popis: ${input.description}` : "",
            `Sekce: ${input.sections.join(", ")}`,
            colorInfo,
            input.framework === "tailwind"
              ? "Použij Tailwind CSS utility třídy (CDN)."
              : "Použij plain CSS s proměnnými.",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ];

      const raw = await provider.complete(messages, { temperature: 0.3 });

      // Parse HTML and CSS sections
      const htmlMatch = raw.match(/###\s*HTML\s*\n([\s\S]*?)(?=###\s*CSS|$)/i);
      const cssMatch = raw.match(/###\s*CSS\s*\n([\s\S]*?)$/i);

      return {
        html: htmlMatch?.[1]?.trim() ?? this.fallbackLayout(input).html,
        css: cssMatch?.[1]?.trim() ?? this.fallbackLayout(input).css,
      };
    } catch {
      return this.fallbackLayout(input);
    }
  }

  private fallbackLayout(input: LayoutInput): { html: string; css: string } {
    const title = input.name;
    const sections = input.sections.map(
      (s, i) => `    <section class="section-${i + 1}"><h2>${s}</h2><p>Obsah sekce ${s}</p></section>`,
    );

    const html = [
      '<header class="header">',
      `  <h1>${title}</h1>`,
      `  <p>${input.description || "Responzivní layout"}</p>`,
      "</header>",
      '<main class="main">',
      ...sections,
      "</main>",
      '<footer class="footer">',
      "  <p>&copy; 2026 — Vygenerováno Graphics Agentem</p>",
      "</footer>",
    ].join("\n");

    const css = [
      "* { margin: 0; padding: 0; box-sizing: border-box; }",
      "body { font-family: system-ui, sans-serif; line-height: 1.6; color: #e2e8f0; background: #0f172a; }",
      ".header { padding: 2rem; text-align: center; background: linear-gradient(135deg, #1e293b, #0f172a); }",
      ".header h1 { font-size: 2.5rem; color: #38bdf8; }",
      ".main { max-width: 1200px; margin: 0 auto; padding: 2rem; display: grid; gap: 2rem; }",
      "section { padding: 1.5rem; background: #1e293b; border-radius: 0.75rem; border: 1px solid #334155; }",
      "section h2 { color: #38bdf8; margin-bottom: 0.5rem; }",
      ".footer { padding: 2rem; text-align: center; color: #64748b; border-top: 1px solid #334155; }",
      "@media (max-width: 768px) { .header h1 { font-size: 1.75rem; } .main { padding: 1rem; } }",
    ].join("\n");

    return { html, css };
  }

  private async generateDesignEdit(
    filePath: string,
    originalContent: string,
    editDescription: string,
    scope?: string,
  ): Promise<string> {
    if (!this.deps.aiRouter) {
      throw new Error("AI není nakonfigurováno — nemohu generovat úpravy designu.");
    }

    const provider = this.deps.aiRouter.getProvider("analyze");
    const ext = filePath.split(".").pop() ?? "txt";
    const scopeDesc = scope && scope !== "all" ? `Změny pouze v: ${scope}` : "";

    const messages: AiMessage[] = [
      {
        role: "system",
        content: [
          "Jsi expert na CSS/HTML a vizuální design.",
          "Uprav následující soubor podle pokynů.",
          scopeDesc,
          "NEUPRAVUJ nic jiného než vizuální aspekty (barvy, layout, spacing, fonty, responzivitu).",
          "Zachovej veškerou strukturu a funkcionalitu.",
          "Vrať kompletní upravený obsah souboru, nic nepřidávej ani neubírej mimo požadované změny.",
          "Nezalamuj do markdownu — vrať jen čistý kód.",
        ]
          .filter(Boolean)
          .join(" "),
      },
      {
        role: "user",
        content: [
          `Soubor: ${filePath}`,
          `Požadovaná úprava: ${editDescription}`,
          "",
          "Původní obsah:",
          "```" + ext,
          originalContent,
          "```",
        ].join("\n"),
      },
    ];

    const modified = await provider.complete(messages, { temperature: 0.2 });

    // Strip markdown code fences if present
    return modified.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "").trim();
  }

  private async collectDesignFiles(projectPath: string): Promise<Array<{ path: string; content: string }>> {
    const files: Array<{ path: string; content: string }> = [];

    try {
      const listed = await this.deps.toolRegistry.execute("filesystem:list", {
        directory: projectPath,
        extensions: [".css", ".html", ".tsx", ".jsx", ".scss", ".less"],
        maxDepth: 4,
      });

      const fileList = Array.isArray(listed)
        ? listed.filter((f: unknown) => typeof f === "object" && f !== null)
        : [];

      const maxToRead = 12;
      const filesToRead = fileList.slice(0, maxToRead);

      for (const file of filesToRead) {
        const pathStr = (file as { path?: string }).path;
        if (!pathStr) continue;

        try {
          const content = await this.deps.toolRegistry.execute("filesystem:read", {
            filePath: pathStr,
          });
          if (typeof content === "string") {
            files.push({ path: pathStr, content: content.slice(0, 4000) });
          }
        } catch {
          // skip unreadable files
        }
      }
    } catch (err) {
      await this.log("warn", `Nepodařilo se prohledat soubory: ${err instanceof Error ? err.message : String(err)}`);
    }

    return files;
  }

  private async runAIAnalysis(
    files: Array<{ path: string; content: string }>,
    title: string,
    description?: string,
  ): Promise<string> {
    if (!this.deps.aiRouter) {
      const fallback = `[AI není nakonfigurováno] Design analýza pro "${title}" — nalezeno ${files.length} souborů. Nakonfigurujte ModelRouter pro AI-powered design review.`;
      this.setExplanation({ currentActivity: "AI není nakonfigurováno.", findings: fallback });
      return fallback;
    }

    this.setExplanation({
      currentActivity: "Analyzuji design pomocí AI.",
      nextStep: "Komunikuji s jazykovým modelem.",
    });

    try {
      const provider = this.deps.aiRouter.getProvider("analyze");

      const fileList = files
        .map((f) => `\n### Soubor: ${f.path}\n\`\`\`${f.path.split(".").pop() ?? "txt"}\n${f.content}\n\`\`\``)
        .join("\n");

      const content = [
        `Úkol: ${title}`,
        description ? `Popis: ${description}` : "",
        "",
        `Soubory k analýze (${files.length}):`,
        fileList || "Žádné soubory k analýze.",
      ]
        .filter(Boolean)
        .join("\n");

      const messages: AiMessage[] = [
        {
          role: "system",
          content:
            "Jsi expert na UI/UX design a CSS. Analyzuj následující kód a identifikuj: 1) problémy s responzivitou, 2) nekonzistence v design systému (barvy, spacing, typografie), 3) problémy s přístupností, 4) návrhy na zlepšení. Odpovídej česky, stručně a strukturovaně.",
        },
        { role: "user", content },
      ];

      const result = await provider.complete(messages, { temperature: 0.3 });

      this.setExplanation({
        currentActivity: "AI design analýza dokončena.",
        findings: `Analyzováno ${files.length} souborů.`,
        nextStep: "Čekám na další instrukce.",
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const fallback = `[AI dočasně nedostupné: ${message}] Design analýza pro "${title}" — nalezeno ${files.length} souborů.`;
      this.setExplanation({
        currentActivity: "AI analýza selhala, používám fallback.",
        findings: `Chyba: ${message}`,
      });
      return fallback;
    }
  }
}
