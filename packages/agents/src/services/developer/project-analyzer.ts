import { join, relative, extname } from "node:path";
import type { ProjectAnalyzer, ProjectIssue, ProjectStats, ToolExecutor } from "./types.js";

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".venv",
  ".pytest_cache",
  ".turbo",
  ".vercel",
  "coverage",
]);

const CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".swift",
  ".c",
  ".cpp",
  ".h",
  ".cs",
  ".php",
  ".rb",
]);

export class DefaultProjectAnalyzer implements ProjectAnalyzer {
  constructor(private executeTool: ToolExecutor) {}
  async analyze(projectPath: string): Promise<ProjectStats> {
    const files: string[] = [];
    await this.walk(projectPath, projectPath, files);

    let totalLines = 0;
    let codeLines = 0;
    let commentLines = 0;
    let blankLines = 0;
    const languages: Record<string, number> = {};

    for (const file of files) {
      try {
        const { content } = await this.executeTool<{ filePath: string }, { path: string; content: string }>("filesystem:read", { filePath: file });
        const lines = content.split("\n");
        const ext = extname(file).toLowerCase();
        const language = languageName(ext);

        totalLines += lines.length;
        languages[language] = (languages[language] ?? 0) + lines.length;

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.length === 0) {
            blankLines += 1;
          } else if (isComment(trimmed, ext)) {
            commentLines += 1;
          } else {
            codeLines += 1;
          }
        }
      } catch {
        // File may have been deleted or become unreadable between listing and reading; skip it.
      }
    }

    return {
      totalFiles: files.length,
      totalLines,
      codeLines,
      commentLines,
      blankLines,
      languages,
      packages: await detectPackages(projectPath, this.executeTool),
    };
  }

  async findIssues(projectPath: string, stats: ProjectStats): Promise<ProjectIssue[]> {
    const issues: ProjectIssue[] = [];

    if (stats.totalFiles > 300) {
      issues.push({
        id: "issue-large-project",
        title: "Projekt roste nad rámec aktuální modularizace",
        description: `Projekt obsahuje ${stats.totalFiles} souborů. Zvažte další rozdělení do balíčků nebo modulů.`,
        severity: "medium",
        category: "clean-architecture",
        suggestedFix: "Proveďte architektonický audit a identifikujte hranice modulů.",
      });
    }

    const tsFiles = Object.entries(stats.languages).find(([lang]) => lang.includes("TypeScript"));
    if (tsFiles && stats.codeLines / (stats.totalFiles || 1) > 400) {
      issues.push({
        id: "issue-large-files",
        title: "Průměrná velikost souborů je vysoká",
        description: "Průměrný soubor má přes 400 řádků kódu. To může naznačovat příliš komplexní komponenty.",
        severity: "medium",
        category: "solid",
        suggestedFix: "Rozdělte velké soubory na menší, jednoúčelové moduly.",
      });
    }

    const jsIndex = Object.entries(stats.languages).find(([lang]) => lang === "JavaScript")?.[1] ?? 0;
    const tsIndex = Object.entries(stats.languages).find(([lang]) => lang.includes("TypeScript"))?.[1] ?? 0;
    if (jsIndex > tsIndex * 0.5 && tsIndex > 0) {
      issues.push({
        id: "issue-mixed-js",
        title: "Příliš mnoho JavaScriptu vedle TypeScriptu",
        description: "Projekt obsahuje významné množství .js souborů. Migrace na TypeScript zlepší type safety.",
        severity: "low",
        category: "type-safety",
        suggestedFix: "Postupně migrujte zbývající .js soubory na .ts/.tsx.",
      });
    }

    const duplicateIssues = await findDuplicateComponents(projectPath, this.executeTool);
    issues.push(...duplicateIssues);

    return issues;
  }

  private async walk(root: string, dir: string, files: string[]): Promise<void> {
    let entries: { path: string; isDirectory: boolean; size: number; modifiedAt: Date }[];
    try {
      entries = await this.executeTool<{ dirPath: string; recursive?: boolean }, { path: string; isDirectory: boolean; size: number; modifiedAt: Date }[]>("filesystem:list", { dirPath: dir });
    } catch {
      // Directory may be unreadable or may have been removed; skip it.
      return;
    }
    for (const entry of entries) {
      const fullPath = entry.path;
      const name = extname(fullPath) ? fullPath.split("/").pop() ?? "" : "";
      if (entry.isDirectory) {
        if (IGNORED_DIRS.has(name) || name.startsWith(".")) continue;
        await this.walk(root, fullPath, files);
      } else {
        const ext = extname(fullPath).toLowerCase();
        if (CODE_EXTENSIONS.has(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
}

async function findDuplicateComponents(projectPath: string, executeTool: ToolExecutor): Promise<ProjectIssue[]> {
  const issues: ProjectIssue[] = [];
  const componentNames = new Map<string, string[]>();

  async function scan(dir: string): Promise<void> {
    const entries = await executeTool<{ dirPath: string; recursive?: boolean }, { path: string; isDirectory: boolean; size: number; modifiedAt: Date }[]>("filesystem:list", { dirPath: dir }).catch(() => []);
    for (const entry of entries) {
      const fullPath = entry.path;
      const name = fullPath.split("/").pop() ?? "";
      if (entry.isDirectory && !IGNORED_DIRS.has(name) && !name.startsWith(".")) {
        await scan(fullPath);
      } else if (!entry.isDirectory && (name.endsWith(".tsx") || name.endsWith(".ts"))) {
        const componentName = name.replace(/\.(tsx|ts)$/, "");
        if (componentName === "page" || componentName === "layout" || componentName === "index" || componentName === "types") continue;
        const paths = componentNames.get(componentName) ?? [];
        paths.push(relative(projectPath, fullPath));
        componentNames.set(componentName, paths);
      }
    }
  }

  await scan(projectPath);

  for (const [name, paths] of componentNames.entries()) {
    if (paths.length > 1) {
      issues.push({
        id: `issue-duplicate-${name}`,
        title: `Duplicitní komponenta: ${name}`,
        description: `Komponenta '${name}' se nachází na ${paths.length} místech: ${paths.join(", ")}.`,
        severity: paths.length > 2 ? "high" : "medium",
        category: "duplication",
        suggestedFix: "Zvažte konsolidaci do sdílené knihovny nebo přejmenování pro jasnější účel.",
      });
    }
  }

  return issues;
}

async function detectPackages(projectPath: string, executeTool: ToolExecutor): Promise<string[]> {
  const packages: string[] = [];
  try {
    const { content: pkgContent } = await executeTool<{ filePath: string }, { path: string; content: string }>("filesystem:read", { filePath: join(projectPath, "package.json") });
    const pkg = JSON.parse(pkgContent) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    packages.push(...Object.keys(pkg.dependencies ?? {}));
    packages.push(...Object.keys(pkg.devDependencies ?? {}));
  } catch {
    // ignore
  }
  return packages.sort();
}

function languageName(ext: string): string {
  switch (ext) {
    case ".ts":
      return "TypeScript";
    case ".tsx":
      return "TypeScript React";
    case ".js":
      return "JavaScript";
    case ".jsx":
      return "JavaScript React";
    case ".py":
      return "Python";
    case ".go":
      return "Go";
    case ".rs":
      return "Rust";
    default:
      return ext || "Other";
  }
}

function isComment(line: string, ext: string): boolean {
  if (line.startsWith("//") || line.startsWith("/*") || line.startsWith("*")) return true;
  if ((ext === ".py" || ext === ".rb") && line.startsWith("#")) return true;
  return false;
}
