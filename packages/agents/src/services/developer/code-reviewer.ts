import { readFile, readdir } from "node:fs/promises";
import { join, extname } from "node:path";
import type { ArchitectureScore, CodeReviewFinding, CodeReviewer, IssueCategory, IssueSeverity } from "./types.js";

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

const TS_JS_EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);

export class DefaultCodeReviewer implements CodeReviewer {
  async review(projectPath: string): Promise<CodeReviewFinding[]> {
    const findings: CodeReviewFinding[] = [];
    const files: string[] = [];
    await this.walk(projectPath, files);

    for (const file of files) {
      const content = await readFile(file, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (!line) continue;

        const anyFinding =
          this.checkHardcodedSecrets(file, i + 1, line) ??
          this.checkConsoleLog(file, i + 1, line) ??
          this.checkLongFunction(file, i + 1, line, lines, i) ??
          this.checkTodoWithoutTicket(file, i + 1, line) ??
          this.checkAnyType(file, i + 1, line) ??
          this.checkImplicitAny(file, i + 1, line) ??
          this.checkCircularImportRisk(file, i + 1, line) ??
          this.checkPoorNaming(file, i + 1, line);

        if (anyFinding) {
          findings.push(anyFinding);
        }
      }

      this.checkFileLength(file, content, findings);
    }

    return findings;
  }

  scoreArchitecture(findings: CodeReviewFinding[]): ArchitectureScore {
    const byCategory = new Map<IssueCategory, number>();
    for (const finding of findings) {
      const weight = severityWeight(finding.severity);
      byCategory.set(finding.category, (byCategory.get(finding.category) ?? 0) + weight);
    }

    const score = (category: IssueCategory) => Math.max(0, 100 - (byCategory.get(category) ?? 0) * 10);

    return {
      overall: Math.round(
        (score("clean-architecture") +
          score("dry") +
          score("solid") +
          score("type-safety") +
          score("naming") +
          score("performance") +
          score("security")) /
          7,
      ),
      cleanArchitecture: score("clean-architecture"),
      dry: score("dry"),
      solid: score("solid"),
      typeSafety: score("type-safety"),
      naming: score("naming"),
      performance: score("performance"),
      security: score("security"),
    };
  }

  private async walk(dir: string, files: string[]): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        await this.walk(fullPath, files);
      } else if (entry.isFile() && TS_JS_EXTS.has(extname(entry.name).toLowerCase())) {
        files.push(fullPath);
      }
    }
  }

  private checkHardcodedSecrets(file: string, line: number, content: string): CodeReviewFinding | null {
    const patterns = [
      /password\s*[:=]\s*["'][^"']+["']/i,
      /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
      /secret\s*[:=]\s*["'][^"']+["']/i,
      /token\s*[:=]\s*["'][^"']+["']/i,
    ];
    for (const pattern of patterns) {
      if (pattern.test(content) && !content.includes("process.env") && !content.includes("example")) {
        return {
          id: `finding-secret-${file}-${line}`,
          rule: "no-hardcoded-secrets",
          category: "security",
          severity: "critical",
          filePath: file,
          message: "Možný hardcoded secret v kódu.",
          suggestion: "Použijte environment variables nebo secure vault.",
        };
      }
    }
    return null;
  }

  private checkConsoleLog(file: string, line: number, content: string): CodeReviewFinding | null {
    if (/console\.(log|warn|error|info)\(/.test(content) && !content.includes("// ")) {
      return {
        id: `finding-console-${file}-${line}`,
        rule: "no-console-in-production",
        category: "performance",
        severity: "low",
        filePath: file,
        message: "Nalezen console.log, který by neměl být v produkčním kódu.",
        suggestion: "Použijte strukturovaný logger (např. Pino) nebo odstraňte logování.",
      };
    }
    return null;
  }

  private checkLongFunction(file: string, line: number, content: string, lines: string[], startIndex: number): CodeReviewFinding | null {
    if (!/function\s+\w+\s*\(/.test(content) && !/\w+\s*\([^)]*\)\s*\{/.test(content)) return null;

    let braceCount = 0;
    let started = false;
    let functionLines = 0;
    for (let i = startIndex; i < lines.length; i += 1) {
      const currentLine = lines[i] ?? "";
      for (const char of currentLine) {
        if (char === "{") {
          started = true;
          braceCount += 1;
        } else if (char === "}") {
          braceCount -= 1;
        }
      }
      if (started) functionLines += 1;
      if (started && braceCount === 0) break;
    }

    if (functionLines > 50) {
      return {
        id: `finding-long-function-${file}-${line}`,
        rule: "function-too-long",
        category: "solid",
        severity: functionLines > 80 ? "high" : "medium",
        filePath: file,
        message: `Funkce má přibližně ${functionLines} řádků.`,
        suggestion: "Rozdělte funkci na menší pomocné funkce podle jedné odpovědnosti.",
      };
    }
    return null;
  }

  private checkTodoWithoutTicket(file: string, line: number, content: string): CodeReviewFinding | null {
    if (/\/\/\s*TODO/.test(content) && !/#[0-9]+/.test(content)) {
      return {
        id: `finding-todo-${file}-${line}`,
        rule: "todo-needs-ticket",
        category: "technical-debt",
        severity: "low",
        filePath: file,
        message: "TODO bez odkazu na ticket nebo issue.",
        suggestion: "Přidejte odkaz na ticket (např. TODO #123) nebo vytvořte issue.",
      };
    }
    return null;
  }

  private checkAnyType(file: string, line: number, content: string): CodeReviewFinding | null {
    if (/: any\b/.test(content) || /as any\b/.test(content)) {
      return {
        id: `finding-any-${file}-${line}`,
        rule: "no-explicit-any",
        category: "type-safety",
        severity: "medium",
        filePath: file,
        message: "Použití explicitního 'any' typu.",
        suggestion: "Nahraďte 'any' konkrétním typem nebo 'unknown' s následnou validací.",
      };
    }
    return null;
  }

  private checkImplicitAny(file: string, line: number, content: string): CodeReviewFinding | null {
    if (/function\s+\w+\s*\([^)]*\)\s*{/.test(content) && !/:\s*\w+/.test(content)) {
      return {
        id: `finding-implicit-any-${file}-${line}`,
        rule: "explicit-return-type",
        category: "type-safety",
        severity: "low",
        filePath: file,
        message: "Funkce nemá explicitní návratový typ.",
        suggestion: "Přidejte explicitní návratový typ pro lepší type safety.",
      };
    }
    return null;
  }

  private checkCircularImportRisk(file: string, line: number, content: string): CodeReviewFinding | null {
    if (/import\s+.*from\s*["']\.\.?\//.test(content) && content.includes("index")) {
      return {
        id: `finding-circular-${file}-${line}`,
        rule: "circular-import-risk",
        category: "clean-architecture",
        severity: "low",
        filePath: file,
        message: "Import z index souboru může vést k cyklickým závislostem.",
        suggestion: "Importujte přímo z konkrétního modulu místo z index souboru.",
      };
    }
    return null;
  }

  private checkPoorNaming(file: string, line: number, content: string): CodeReviewFinding | null {
    const badNames = ["data", "info", "result", "value", "temp", "tmp", "obj"];
    const declaration = /(?:const|let|var|function)\s+(\w+)/.exec(content);
    if (declaration && badNames.includes(declaration[1].toLowerCase())) {
      return {
        id: `finding-naming-${file}-${line}`,
        rule: "poor-naming",
        category: "naming",
        severity: "low",
        filePath: file,
        message: `Název '${declaration[1]}' je příliš obecný.`,
        suggestion: "Použijte popisnější název, který odhalí účel proměnné/funkce.",
      };
    }
    return null;
  }

  private checkFileLength(file: string, content: string, findings: CodeReviewFinding[]): void {
    const lines = content.split("\n").length;
    if (lines > 400) {
      findings.push({
        id: `finding-file-length-${file}`,
        rule: "file-too-long",
        category: "solid",
        severity: lines > 600 ? "high" : "medium",
        filePath: file,
        message: `Soubor má ${lines} řádků.`,
        suggestion: "Rozdělte soubor na menší moduly podle odpovědnosti.",
      });
    }
  }
}

function severityWeight(severity: IssueSeverity): number {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 0.5;
    default:
      return 0;
  }
}
