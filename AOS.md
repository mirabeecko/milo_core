# MiLO_Core – Agent Operating System (AOS)

## Co je AOS

Agent Operating System je produkční framework pro běh digitálních zaměstnanců v MiLO_Core. Není to chatbot. Každý agent je samostatná entita se životním cyklem, pamětí, frontou úkolů, logem a transparentním vysvětlením své práce.

## Principy

- **Samostatné entity** – každý agent má vlastní identitu, konfiguraci a stav.
- **Transparentnost** – agent musí umět kdykoliv vysvětlit, co dělá, proč a co bude dál.
- **Spolehlivost** – retry, timeout, health check, heartbeat.
- **Modularita** – business logika se nepíše do frameworku, ale do konkrétních agentů.
- **Testovatelnost** – in-memory implementace pro unit testy, BullMQ/Redis pro produkci.

## Architektura

```
┌─────────────────────────────────────────────┐
│              Dashboard / CLI / API          │
├─────────────────────────────────────────────┤
│           AgentManager (centrální řízení)   │
├─────────────────────────────────────────────┤
│  AgentEntity  │  TaskQueue  │  EventBus     │
├─────────────────────────────────────────────┤
│  Repositories (PG / in-memory fallback)     │
├─────────────────────────────────────────────┤
│  Shared Types  │  Registry  │  Simulation   │
└─────────────────────────────────────────────┘
```

## Agent lifecycle

Každý agent implementuje jednotné rozhraní:

- `initialize()` – registrace agenta
- `start()` – přechod do stavu `idle`
- `stop()` – přechod do stavu `offline`
- `pause()` – pozastavení
- `resume()` – obnovení
- `restart()` – restart agenta (stop + start)
- `runTask(task)` – spuštění úkolu
- `cancelTask(taskId)` – zrušení úkolu
- `scheduleTask(task, when)` – naplánování úkolu
- `retry(taskId)` – retry úkolu
- `heartbeat()` – health check a metriky
- `report()` – report stavu
- `explain()` – lidsky čitelné vysvětlení práce
- `getTaskHistory()` – historie dokončených úkolů
- `getPendingQueue()` – fronta čekajících úkolů

## Stavy agenta

- `idle` – čeká na úkol
- `thinking` – analyzuje a přemýšlí o úkolu
- `planning` – plánuje postup a vybírá nástroje
- `delegating` – deleguje dílčí práci nebo načítá data
- `working` – pracuje na úkolu
- `waiting` – čeká na vstup / jiného agenta
- `reviewing` – kontroluje kvalitu výsledku
- `reporting` – předává výsledek uživateli
- `paused` – pozastaveno uživatelem
- `offline` – vypnuto
- `error` – chyba

## Task model

Každý úkol obsahuje:

- ID, název, popis
- prioritu, deadline, stav
- vlastníka (agent / user)
- čas vytvoření, spuštění, dokončení
- odhad a reálný čas
- zdroj zadání
- výsledek, log, použité nástroje, citace
- počet retry
- rodičovský úkol a delegování

Stavy úkolu: `pending`, `queued`, `running`, `waiting`, `paused`, `completed`, `failed`, `cancelled`.

## Event bus

Centrální message bus pro události:

- `agent:registered`
- `agent:status`
- `agent:heartbeat`
- `agent:log`
- `agent:explanation`
- `agent:task:created`
- `agent:task:started`
- `agent:task:completed`
- `agent:task:failed`
- `agent:task:cancelled`
- `agent:task:delegated`
- `agent:error`

Produkční implementace může používat Redis pub/sub, pro testy in-memory bus.

## Live work explanation

Každý agent průběžně vytváří lidsky čitelné vysvětlení:

- 🧠 Co právě dělám
- 🎯 Cíl
- ❓ Proč to dělám
- 🔍 Co jsem zatím zjistil
- 📂 Jaké důkazy používám
- 🔧 Jaké nástroje používám
- ➡ Co bude následovat
- ⏳ Odhad dokončení
- ⚠ Rizika
- 🙋 Co potřebuji od uživatele
- ✅ Poslední dokončený krok
- ⭐ Míra jistoty (confidence)
- 🔀 Alternativní postup
- 📜 Rozhodovací log

## Registry agentů

Výchozí agenti:

- Chief of Staff
- Developer Agent
- Research Agent
- Knowledge Agent
- Legal Agent
- Document Agent
- Calendar Agent
- Communication Agent
- Automation Agent

## Chief of Staff – první produkční agent

`ChiefOfStaffAgent` je první plně funkční agent s živou simulací:

- Každých 3–8 sekund mění stav mezi `thinking → planning → delegating → working → reviewing → reporting`.
- Postupně zvyšuje `taskProgress` od 10 % do 100 %.
- Generuje konkrétní lidsky čitelné vysvětlení práce včetně důkazů, nástrojů, rizik a rozhodovacího logu.
- Po dokončení úkolu ho uloží do historie a automaticky začne další.
- Lze ovládat z dashboardu, detailu agenta, API i CLI: `start`, `stop`, `pause`, `resume`, `restart`.

Simulace umožňuje otestovat celý AOS ještě před napojením na reálné služby.

## Simulace

`pnpm --filter @milo/agents simulate` spustí mock simulaci všech agentů pro testování AOS bez reálných služeb.

## Rozhraní

```ts
import { AgentManager, registerDefaultAgents } from "@milo/agents";

const manager = new AgentManager({ repositories: { ... } });
await registerDefaultAgents(manager);
await manager.startAll();
manager.startHeartbeat();

const task = await manager.delegate({
  title: "Připravit briefing",
  priority: "critical",
  ownerId: "chief-of-staff",
  ownerType: "agent",
  source: "dashboard",
  log: [],
  toolsUsed: [],
  citations: [],
  retryCount: 0,
});
```

## Další vývoj

- Napojení na BullMQ/Redis pro produkční fronty
- Plánování úkolů (cron, delay)
- Inter-agent messaging a delegation chain
- Tool registry a bezpečné volání nástrojů
- Persistentní paměť a knowledge retrieval
