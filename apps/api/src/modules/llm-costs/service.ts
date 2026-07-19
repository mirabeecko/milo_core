import { existsSync, readFileSync, statSync } from "fs";
import { resolve } from "path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getConfig } from "../../services/config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LLM_CALLS_FILE = resolve(__dirname, "../../../llm_calls.json");

export type LlmCostPeriod = "day" | "week" | "month" | "year";

export interface LlmCallEntry {
  date: string;
  model: string;
  tokens?: number;
  tokens_input?: number;
  tokens_output?: number;
  cost?: number;
  agent?: string;
  project?: string;
  description?: string;
}

export interface ModelAggregate {
  model: string;
  cost: number;
  tokens: number;
  tokensInput: number;
  tokensOutput: number;
  calls: number;
  share: number;
}

export interface ProjectAggregate {
  project: string;
  cost: number;
  calls: number;
}

export interface SeriesBucket {
  label: string;
  total: number;
  byModel: Record<string, number>;
}

export interface LlmCostsSummary {
  period: LlmCostPeriod;
  from: string;
  to: string;
  generatedAt: string;
  currency: "USD";
  total: {
    cost: number;
    tokens: number;
    tokensInput: number;
    tokensOutput: number;
    calls: number;
  };
  prevPeriodCost: number;
  deltaPct: number | null;
  byModel: ModelAggregate[];
  byProject: ProjectAggregate[];
  series: SeriesBucket[];
  models: string[];
  recent: LlmCallEntry[];
  monthlyBudget: number;
  monthCost: number;
  source: { file: string; updatedAt: string | null; entries: number };
}

const DAY_LABELS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const MONTH_LABELS = ["Led", "Úno", "Bře", "Dub", "Kvě", "Čer", "Čvc", "Srp", "Zář", "Říj", "Lis", "Pro"];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Monday-based start of week. */
function startOfWeek(d: Date): Date {
  const day = startOfDay(d);
  const dow = (day.getDay() + 6) % 7; // Mon=0 … Sun=6
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() - dow);
}

function periodRange(period: LlmCostPeriod, now: Date): { from: Date; to: Date } {
  switch (period) {
    case "day":
      return { from: startOfDay(now), to: now };
    case "week":
      return { from: startOfWeek(now), to: now };
    case "month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    case "year":
      return { from: new Date(now.getFullYear(), 0, 1), to: now };
  }
}

function prevPeriodRange(period: LlmCostPeriod, now: Date): { from: Date; to: Date } {
  const { from } = periodRange(period, now);
  switch (period) {
    case "day":
      return { from: new Date(from.getFullYear(), from.getMonth(), from.getDate() - 1), to: from };
    case "week":
      return { from: new Date(from.getFullYear(), from.getMonth(), from.getDate() - 7), to: from };
    case "month":
      return { from: new Date(from.getFullYear(), from.getMonth() - 1, 1), to: from };
    case "year":
      return { from: new Date(from.getFullYear() - 1, 0, 1), to: from };
  }
}

function bucketCount(period: LlmCostPeriod, now: Date): number {
  switch (period) {
    case "day":
      return 24;
    case "week":
      return 7;
    case "month":
      return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    case "year":
      return 12;
  }
}

function bucketIndex(period: LlmCostPeriod, d: Date): number {
  switch (period) {
    case "day":
      return d.getHours();
    case "week":
      return (d.getDay() + 6) % 7;
    case "month":
      return d.getDate() - 1;
    case "year":
      return d.getMonth();
  }
}

function bucketLabel(period: LlmCostPeriod, index: number): string {
  switch (period) {
    case "day":
      return `${String(index).padStart(2, "0")}:00`;
    case "week":
      return DAY_LABELS[index];
    case "month":
      return String(index + 1);
    case "year":
      return MONTH_LABELS[index];
  }
}

function emptySummary(period: LlmCostPeriod, now: Date, updatedAt: string | null, entries: number): LlmCostsSummary {
  const { from, to } = periodRange(period, now);
  const cfg = getConfig();
  return {
    period,
    from: from.toISOString(),
    to: to.toISOString(),
    generatedAt: now.toISOString(),
    currency: "USD",
    total: { cost: 0, tokens: 0, tokensInput: 0, tokensOutput: 0, calls: 0 },
    prevPeriodCost: 0,
    deltaPct: null,
    byModel: [],
    byProject: [],
    series: [],
    models: [],
    recent: [],
    monthlyBudget: cfg.monthly_budget_total,
    monthCost: 0,
    source: { file: "llm_calls.json", updatedAt, entries },
  };
}

export function aggregateLlmCosts(
  entries: LlmCallEntry[],
  period: LlmCostPeriod,
  now: Date = new Date(),
  source: { updatedAt: string | null; entries: number } = { updatedAt: null, entries: entries.length },
): LlmCostsSummary {
  const valid = entries
    .map((e) => ({ ...e, ts: new Date(e.date) }))
    .filter((e) => !Number.isNaN(e.ts.getTime()));

  if (valid.length === 0) {
    return emptySummary(period, now, source.updatedAt, source.entries);
  }

  const { from, to } = periodRange(period, now);
  const prev = prevPeriodRange(period, now);

  const inPeriod = valid.filter((e) => e.ts >= from && e.ts <= to);
  const prevCost = valid
    .filter((e) => e.ts >= prev.from && e.ts < prev.to)
    .reduce((s, e) => s + (e.cost ?? 0), 0);

  const monthFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthCost = valid
    .filter((e) => e.ts >= monthFrom && e.ts <= now)
    .reduce((s, e) => s + (e.cost ?? 0), 0);

  // --- per model ---
  const modelMap = new Map<string, ModelAggregate>();
  let totalCost = 0;
  let totalTokens = 0;
  let totalIn = 0;
  let totalOut = 0;

  for (const e of inPeriod) {
    const model = e.model || "unknown";
    if (!modelMap.has(model)) {
      modelMap.set(model, { model, cost: 0, tokens: 0, tokensInput: 0, tokensOutput: 0, calls: 0, share: 0 });
    }
    const m = modelMap.get(model)!;
    const cost = e.cost ?? 0;
    const tIn = e.tokens_input ?? 0;
    const tOut = e.tokens_output ?? 0;
    m.cost += cost;
    m.tokensInput += tIn;
    m.tokensOutput += tOut;
    m.tokens += e.tokens ?? tIn + tOut;
    m.calls += 1;
    totalCost += cost;
    totalTokens += e.tokens ?? tIn + tOut;
    totalIn += tIn;
    totalOut += tOut;
  }

  const byModel = [...modelMap.values()]
    .map((m) => ({ ...m, cost: round2(m.cost), share: totalCost > 0 ? round2((m.cost / totalCost) * 100) : 0 }))
    .sort((a, b) => b.cost - a.cost);

  // --- per project ---
  const projectMap = new Map<string, ProjectAggregate>();
  for (const e of inPeriod) {
    const project = e.project || "—";
    if (!projectMap.has(project)) projectMap.set(project, { project, cost: 0, calls: 0 });
    const p = projectMap.get(project)!;
    p.cost += e.cost ?? 0;
    p.calls += 1;
  }
  const byProject = [...projectMap.values()]
    .map((p) => ({ ...p, cost: round2(p.cost) }))
    .sort((a, b) => b.cost - a.cost);

  // --- series ---
  const count = bucketCount(period, now);
  const series: SeriesBucket[] = Array.from({ length: count }, (_, i) => ({
    label: bucketLabel(period, i),
    total: 0,
    byModel: {},
  }));
  for (const e of inPeriod) {
    const idx = bucketIndex(period, e.ts);
    if (idx < 0 || idx >= count) continue;
    const cost = e.cost ?? 0;
    const model = e.model || "unknown";
    series[idx].total += cost;
    series[idx].byModel[model] = (series[idx].byModel[model] ?? 0) + cost;
  }
  for (const b of series) b.total = round2(b.total);

  // --- recent calls in period ---
  const recent = inPeriod
    .sort((a, b) => b.ts.getTime() - a.ts.getTime())
    .slice(0, 12)
    .map(({ ts: _ts, ...rest }) => rest);

  const cfg = getConfig();

  return {
    period,
    from: from.toISOString(),
    to: to.toISOString(),
    generatedAt: now.toISOString(),
    currency: "USD",
    total: {
      cost: round2(totalCost),
      tokens: totalTokens,
      tokensInput: totalIn,
      tokensOutput: totalOut,
      calls: inPeriod.length,
    },
    prevPeriodCost: round2(prevCost),
    deltaPct: prevCost > 0 ? round2(((totalCost - prevCost) / prevCost) * 100) : null,
    byModel,
    byProject,
    series,
    models: byModel.map((m) => m.model),
    recent,
    monthlyBudget: cfg.monthly_budget_total,
    monthCost: round2(monthCost),
    source: { file: "llm_calls.json", updatedAt: source.updatedAt, entries: source.entries },
  };
}

export async function getLlmCostsSummary(period: LlmCostPeriod): Promise<LlmCostsSummary> {
  if (!existsSync(LLM_CALLS_FILE)) {
    return emptySummary(period, new Date(), null, 0);
  }

  let entries: LlmCallEntry[] = [];
  try {
    const raw = readFileSync(LLM_CALLS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) entries = parsed as LlmCallEntry[];
  } catch (error) {
    console.error(`Failed to read ${LLM_CALLS_FILE}:`, error);
    return emptySummary(period, new Date(), null, 0);
  }

  const updatedAt = statSync(LLM_CALLS_FILE).mtime.toISOString();
  return aggregateLlmCosts(entries, period, new Date(), { updatedAt, entries: entries.length });
}
