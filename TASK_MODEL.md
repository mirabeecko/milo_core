# MiLO_Core – Task Model

## Co je úkol

Úkol je atomická jednotka práce v MiLO_Core. Každý úkol má jasného vlastníka, stav, prioritu, log a výsledek. Úkoly mohou být delegovány mezi agenty.

## Atributy úkolu

| Atribut | Typ | Popis |
|---------|-----|-------|
| `id` | string | Unikátní identifikátor |
| `title` | string | Název úkolu |
| `description` | string? | Detailní popis |
| `priority` | TaskPriority | `critical`, `high`, `normal`, `low` |
| `deadline` | string? | ISO datum deadline |
| `status` | TaskStatus | viz stavy níže |
| `ownerId` | string | ID vlastníka |
| `ownerType` | "agent" \| "user" | Typ vlastníka |
| `source` | string | Zdroj zadání (dashboard, cli, api, agent) |
| `createdAt` | string | Čas vytvoření |
| `startedAt` | string? | Čas spuštění |
| `completedAt` | string? | Čas dokončení |
| `estimateMs` | number? | Odhadovaná délka v ms |
| `actualTimeMs` | number? | Reálná délka v ms |
| `result` | TaskResult? | Výsledek úkolu |
| `log` | TaskLogEntry[] | Log úkolu |
| `toolsUsed` | string[] | Použité nástroje |
| `citations` | string[] | Citace / zdroje |
| `retryCount` | number | Počet retry |
| `parentTaskId` | string? | ID rodičovského úkolu |
| `delegatedFrom` | string? | ID agenta, od kterého byl delegován |

## Stavy úkolu

- `pending` – čeká na zpracování
- `queued` – ve frontě
- `running` – právě běží
- `waiting` – čeká na vstup / závislost
- `paused` – pozastaveno
- `completed` – dokončeno
- `failed` – selhalo
- `cancelled` – zrušeno

## Výsledek úkolu

```ts
interface TaskResult {
  output?: string;
  error?: string;
  citations?: string[];
  metadata?: Record<string, unknown>;
}
```

## Log úkolu

```ts
interface TaskLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  metadata?: Record<string, unknown>;
}
```

## Fronta úkolů

V produkci se úkoly ukládají do BullMQ fronty. Pro testy slouží in-memory fronta se stejným rozhraním.

## Spuštění úkolu

```ts
const task = await manager.delegate({
  title: "Připravit briefing",
  description: "...",
  priority: "critical",
  status: "pending",
  ownerId: "chief-of-staff",
  ownerType: "agent",
  source: "dashboard",
  log: [],
  toolsUsed: [],
  citations: [],
  retryCount: 0,
  estimateMs: 1500,
});
```

## Retry

Retry policy je definována v konfiguraci agenta:

```ts
retryPolicy: {
  maxRetries: 3,
  backoffMs: 1000,
}
```

## Delegace

Agenti mohou delegovat úkoly jiným agentům. Delegace je zaznamenána v atributu `delegatedFrom` a publikuje událost `agent:task:delegated`.
