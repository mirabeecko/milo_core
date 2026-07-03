export * from "./types.js";
export * from "./project-analyzer.js";
export * from "./code-reviewer.js";
export * from "./build-runner.js";
export * from "./git-reader.js";

import { DefaultProjectAnalyzer } from "./project-analyzer.js";
import { DefaultCodeReviewer } from "./code-reviewer.js";
import { DefaultBuildRunner } from "./build-runner.js";
import { DefaultGitReader } from "./git-reader.js";
import type {
  BuildResult,
  CodeReviewFinding,
  DeveloperAgentState,
  DeveloperService,
  GitInfo,
  LintResult,
  ProjectIssue,
  ProjectStats,
  TestResult,
  ToolExecutor,
} from "./types.js";

export class DefaultDeveloperService implements DeveloperService {
  private analyzer: DefaultProjectAnalyzer;
  private reviewer: DefaultCodeReviewer;
  private runner: DefaultBuildRunner;
  private git: DefaultGitReader;
  private state: DeveloperAgentState;

  constructor(projectPath: string, executeTool?: ToolExecutor) {
    const toolExecutor = executeTool ?? (() => { throw new Error("Tool executor not provided"); });
    this.analyzer = new DefaultProjectAnalyzer(toolExecutor);
    this.reviewer = new DefaultCodeReviewer(toolExecutor);
    this.runner = new DefaultBuildRunner(toolExecutor);
    this.git = new DefaultGitReader(toolExecutor);
    this.state = {
      projectPath,
      issues: [],
      findings: [],
      technicalDebt: 0,
      taskProgress: 0,
    };
  }

  getState(): DeveloperAgentState {
    return this.state;
  }

  async sync(projectPath: string): Promise<void> {
    this.state.projectPath = projectPath;
    this.state.taskProgress = 10;

    const stats = await this.analyzer.analyze(projectPath);
    const issues = await this.analyzer.findIssues(projectPath, stats);
    const findings = await this.reviewer.review(projectPath);
    const architectureScore = this.reviewer.scoreArchitecture(findings);

    this.state.stats = stats;
    this.state.issues = issues;
    this.state.findings = findings;
    this.state.architectureScore = architectureScore;
    this.state.technicalDebt = this.calculateTechnicalDebt(issues, findings, architectureScore.overall);
    this.state.lastSyncedAt = new Date().toISOString();
    this.state.taskProgress = 100;
  }

  async analyzeProject(projectPath: string): Promise<ProjectStats> {
    const stats = await this.analyzer.analyze(projectPath);
    this.state.stats = stats;
    return stats;
  }

  async reviewCode(projectPath: string): Promise<CodeReviewFinding[]> {
    const findings = await this.reviewer.review(projectPath);
    this.state.findings = findings;
    this.state.architectureScore = this.reviewer.scoreArchitecture(findings);
    return findings;
  }

  async runBuild(projectPath: string): Promise<BuildResult> {
    const result = await this.runner.runBuild(projectPath);
    this.state.build = result;
    return result;
  }

  async runTests(projectPath: string): Promise<TestResult> {
    const result = await this.runner.runTests(projectPath);
    this.state.tests = result;
    return result;
  }

  async runLint(projectPath: string): Promise<LintResult> {
    const result = await this.runner.runLint(projectPath);
    this.state.lint = result;
    return result;
  }

  async getGitInfo(projectPath: string): Promise<GitInfo> {
    const info = await this.git.getInfo(projectPath);
    this.state.git = info;
    return info;
  }

  private calculateTechnicalDebt(
    issues: ProjectIssue[],
    findings: CodeReviewFinding[],
    architectureOverall: number,
  ): number {
    const severityWeight = (s: ProjectIssue["severity"]) => {
      switch (s) {
        case "critical":
          return 10;
        case "high":
          return 6;
        case "medium":
          return 3;
        case "low":
          return 1;
        default:
          return 0;
      }
    };

    const issueScore = issues.reduce((sum, issue) => sum + severityWeight(issue.severity), 0);
    const findingScore = findings.reduce((sum, finding) => sum + severityWeight(finding.severity), 0);
    const architectureDebt = Math.max(0, 100 - architectureOverall);

    return Math.round(issueScore + findingScore + architectureDebt);
  }
}
