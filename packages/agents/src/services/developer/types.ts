export type IssueSeverity = "critical" | "high" | "medium" | "low";
export type IssueCategory =
  | "clean-architecture"
  | "dry"
  | "solid"
  | "type-safety"
  | "naming"
  | "performance"
  | "security"
  | "accessibility"
  | "duplication"
  | "technical-debt"
  | "test-coverage";

export interface ProjectIssue {
  id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  category: IssueCategory;
  filePath?: string;
  lineNumber?: number;
  suggestedFix?: string;
}

export interface CodeReviewFinding {
  id: string;
  rule: string;
  category: IssueCategory;
  severity: IssueSeverity;
  filePath: string;
  message: string;
  suggestion: string;
}

export interface ProjectStats {
  totalFiles: number;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  languages: Record<string, number>;
  packages: string[];
}

export interface GitInfo {
  branch: string;
  lastCommit: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
  lastMerge?: {
    hash: string;
    message: string;
    date: string;
  };
  commitCount: number;
  recentCommits: GitCommit[];
  branches: string[];
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface BuildResult {
  status: "success" | "failure" | "running" | "unknown";
  durationMs?: number;
  warnings: string[];
  errors: string[];
  timestamp?: string;
}

export interface TestResult {
  status: "success" | "failure" | "running" | "unknown";
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  coverage?: number;
  durationMs?: number;
  failedTestNames: string[];
  timestamp?: string;
}

export interface LintResult {
  status: "success" | "failure" | "running" | "unknown";
  warnings: string[];
  errors: string[];
  timestamp?: string;
}

export interface ArchitectureScore {
  overall: number;
  cleanArchitecture: number;
  dry: number;
  solid: number;
  typeSafety: number;
  naming: number;
  performance: number;
  security: number;
}

export interface DeveloperAgentState {
  projectPath: string;
  stats?: ProjectStats;
  git?: GitInfo;
  issues: ProjectIssue[];
  findings: CodeReviewFinding[];
  build?: BuildResult;
  tests?: TestResult;
  lint?: LintResult;
  architectureScore?: ArchitectureScore;
  technicalDebt: number;
  lastSyncedAt?: string;
  taskProgress: number;
}

export interface ProjectAnalyzer {
  analyze(projectPath: string): Promise<ProjectStats>;
  findIssues(projectPath: string, stats: ProjectStats): Promise<ProjectIssue[]>;
}

export interface CodeReviewer {
  review(projectPath: string): Promise<CodeReviewFinding[]>;
  scoreArchitecture(findings: CodeReviewFinding[]): ArchitectureScore;
}

export interface BuildRunner {
  runLint(projectPath: string): Promise<LintResult>;
  runBuild(projectPath: string): Promise<BuildResult>;
  runTests(projectPath: string): Promise<TestResult>;
}

export interface GitReader {
  getInfo(projectPath: string): Promise<GitInfo>;
}

export interface DeveloperService {
  getState(): DeveloperAgentState;
  sync(projectPath: string): Promise<void>;
  analyzeProject(projectPath: string): Promise<ProjectStats>;
  reviewCode(projectPath: string): Promise<CodeReviewFinding[]>;
  runBuild(projectPath: string): Promise<BuildResult>;
  runTests(projectPath: string): Promise<TestResult>;
  runLint(projectPath: string): Promise<LintResult>;
  getGitInfo(projectPath: string): Promise<GitInfo>;
}
