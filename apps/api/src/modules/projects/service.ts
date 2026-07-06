import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../../data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");

export interface Project {
  id: string;
  name: string;
  status: "active" | "on_hold" | "completed" | "archived";
  priority: "critical" | "important" | "low";
  lastActivity: string;
  openTasks: number;
  documents: number;
  description: string;
  color: string;
}

const defaultProjects: Project[] = [
  {
    id: "proj-tj",
    name: "TJ Krupka",
    status: "active",
    priority: "critical",
    lastActivity: "2026-07-03T08:30:00Z",
    openTasks: 5,
    documents: 12,
    description: "Právní a komunikační podpora TJ Krupka.",
    color: "bg-blue-500",
  },
  {
    id: "proj-milo",
    name: "MiLO_Core",
    status: "active",
    priority: "important",
    lastActivity: "2026-07-03T06:15:00Z",
    openTasks: 8,
    documents: 24,
    description: "Osobní operační systém.",
    color: "bg-purple-500",
  },
  {
    id: "proj-komarka",
    name: "Komárka",
    status: "active",
    priority: "important",
    lastActivity: "2026-07-02T14:20:00Z",
    openTasks: 3,
    documents: 6,
    description: "Web a marketing pro komárku.",
    color: "bg-emerald-500",
  },
  {
    id: "proj-ninja",
    name: "Ninja Týden",
    status: "on_hold",
    priority: "low",
    lastActivity: "2026-07-01T10:00:00Z",
    openTasks: 7,
    documents: 4,
    description: "Týdenní sportovní akce.",
    color: "bg-orange-500",
  },
  {
    id: "proj-obchod",
    name: "Obchodní příležitosti",
    status: "active",
    priority: "important",
    lastActivity: "2026-07-02T16:45:00Z",
    openTasks: 4,
    documents: 9,
    description: "Sledování nových zakázek a poptávek.",
    color: "bg-rose-500",
  },
];

const colorPalette = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-pink-500",
];

let cache: Project[] | null = null;

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

async function loadProjects(): Promise<Project[]> {
  if (cache) return cache;
  await ensureDataDir();
  try {
    const raw = await fs.readFile(PROJECTS_FILE, "utf-8");
    cache = JSON.parse(raw) as Project[];
  } catch {
    cache = defaultProjects;
    await saveProjects(cache);
  }
  return cache ?? defaultProjects;
}

async function saveProjects(projects: Project[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
  cache = projects;
}

function generateId(): string {
  return `proj-${Date.now()}`;
}

function pickColor(index: number): string {
  return colorPalette[index % colorPalette.length] ?? "bg-slate-500";
}

export async function listProjects(): Promise<Project[]> {
  return loadProjects();
}

export async function createProject(input: {
  name: string;
  description?: string;
  priority?: "critical" | "important" | "low";
  status?: "active" | "on_hold" | "completed" | "archived";
}): Promise<Project> {
  const projects = await loadProjects();
  const project: Project = {
    id: generateId(),
    name: input.name,
    description: input.description ?? "",
    priority: input.priority ?? "important",
    status: input.status ?? "active",
    lastActivity: new Date().toISOString(),
    openTasks: 0,
    documents: 0,
    color: pickColor(projects.length),
  };
  projects.unshift(project);
  await saveProjects(projects);
  return project;
}
