# MiLO Framework Reuse Assessment v1.0

**Status:** Architektonické rozhodnutí (před ADR)
**Autor:** Chief Orchestrator
**Datum:** 2026-07-08

---

## Princip

MiLO nesmí znovu vynalézat orchestrační infrastrukturu, kterou již poskytují zralé agentní frameworky.

Co existuje → použij.
Co je unikátní pro MiLO → postav.

---

## Rozhodovací matice

| Schopnost | Postavit v MiLO? | Použít existující? | Odůvodnění |
|-----------|-----------------|-------------------|------------|
| Orchestrace (graph execution) | NE | ✅ LangGraph / Hermes | Zralé, testované, s checkpointy |
| Delegace (handoffs) | NE | ✅ OpenAI Agents SDK / Hermes | Standardní pattern, není důvod stavět |
| Paralelní exekuce | NE | ✅ LangGraph / CrewAI | Infrastrukturní, ne doménové |
| Retry a error handling | NE | ✅ Frameworky to mají vestavěné | Není přidaná hodnota MiLO |
| Checkpointy a state persistence | NE | ✅ LangGraph | Komplexní infrastruktura |
| Tracing a observabilita | NE | ✅ OpenAI / LangSmith / Hermes | Externí nástroje, ne MiLO |
| Plánování (scheduling) | NE | ✅ Frameworky / n8n / cron | Není unikátní pro MiLO |
| Tool calling (MCP) | NE | ✅ MCP protokol + existující servery | Standardizované, není důvod stavět |
| **Ústava (Constitution)** | ✅ POSTAVIT | — | **Unikátní pro MiLO** |
| **Organizační model** | ✅ POSTAVIT | — | **Unikátní pro MiLO** |
| **Executive Board a oddělení** | ✅ POSTAVIT | — | **Unikátní pro MiLO** |
| **Sémantika mise** | ✅ POSTAVIT | — | **Unikátní pro MiLO** |
| **Governance policies** | ✅ POSTAVIT | — | **Unikátní pro MiLO** |
| **Memory contracts** | ✅ POSTAVIT | — | Rozhraní, ne implementace |
| **Model routing policy** | ✅ POSTAVIT | — | Provider abstraction |
| **Style/rule system** | ✅ POSTAVIT | — | Existuje v MiLO_Agent, rozšířit |
| **Department ownership** | ✅ POSTAVIT | — | Organizační logika |
| **Decision Records** | ✅ POSTAVIT | — | Formát a proces |
| **Knowledge management** | ✅ POSTAVIT | — | Indexace, RAG, export |

---

## Architektonický model

```
┌─────────────────────────────────────────────────────────────┐
│                    MiLO UNIKÁTNÍ VRSTVA                     │
│                                                             │
│  Ústava │ Organizační model │ Mise │ Governance │ Paměť    │
│  Styly │ Pravidla │ Oddělení │ DR │ Lessons Learned       │
├─────────────────────────────────────────────────────────────┤
│                    MiLO ADAPTÉR                             │
│                                                             │
│  Překládá mise MiLO → úkoly frameworku                     │
│  Vynucuje governance před exekucí                           │
│  Routuje modely podle policy                                │
│  Zapouzdřuje provider abstraction                           │
├─────────────────────────────────────────────────────────────┤
│              EXISTUJÍCÍ ORCHESTRAČNÍ FRAMEWORK              │
│                                                             │
│  LangGraph / OpenAI Agents SDK / Hermes / CrewAI           │
│                                                             │
│  Orchestrace │ Delegace │ Paralelismus │ Retry │ Tracing   │
└─────────────────────────────────────────────────────────────┘
```

MiLO staví horní vrstvu. Frameworky poskytují spodní vrstvu. Adaptér je tenká vrstva mezi nimi.

---

## Doporučené přiřazení frameworků

### Primární volba: LangGraph

**Proč:**
- Graph-based execution — přirozeně mapuje mise jako grafy úkolů
- Checkpointy — každý stav mise lze persistovat
- Human-in-the-loop — nativní podpora pro schvalovací kroky (Úroveň autonomie 1-3)
- Subgraphs — oddělení jako subgrafy
- LangSmith — tracing, observabilita

**Co MiLO přidává nad LangGraph:**
- Mission semantics (plánování, zhodnocení, poučení)
- Constitutional validation před každým krokem
- Department ownership — který agent smí vykonat který krok
- Model routing — který LLM pro který krok
- Decision Records — automatický záznam rozhodnutí

### Sekundární volba: Hermes nativní orchestrace

**Proč:**
- Už běží v prostředí Vlastníka
- Delegace, cron, background processing jsou vestavěné
- Není potřeba další infrastruktura

**Omezení:**
- MiLO nesmí být závislý na Hermes (Ústava, kapitola 4)
- Hermes je provider, ne platforma
- Architektura musí umožňovat výměnu

### Strategie: Abstrakce přes rozhraní

MiLO definuje `OrchestrationProvider` interface:

```typescript
interface OrchestrationProvider {
  executeMission(mission: Mission): Promise<MissionResult>;
  delegateTask(task: Task, agent: AgentId): Promise<TaskResult>;
  checkpoint(state: MissionState): Promise<void>;
  scheduleWork(spec: ScheduleSpec): Promise<void>;
  trace(span: TraceSpan): void;
}
```

Implementace:
- `LangGraphOrchestrationProvider` — pro produkční nasazení
- `HermesOrchestrationProvider` — pro lokální vývoj
- `DirectOrchestrationProvider` — pro testování (žádný framework)

Výměna provideru = jedna konfigurační změna. Přesně podle Ústavy, kapitola 4.

---

## Co MiLO NESTAVÍ (a proč)

### Agent loop
Existuje v každém frameworku. MiLO přidává jen governance hook před každou iterací.

### Tool registry
MCP to řeší standardizovaně. MiLO přidává jen department-based access control.

### Message passing mezi agenty
Frameworky to řeší nativně. MiLO přidává jen formát zpráv (Decision Record, IDR).

### State persistence
LangGraph checkpointy. MiLO přidává jen sémantiku mise do state objektu.

### Scheduling
Cron / n8n / framework schedulers. MiLO přidává jen mission semantics (proč se to spouští).

---

## Dopad na roadmapu

### Původní předpoklad (před korekcí)

ENG staví kompletní Agent Runtime od nuly. 45 dní.

### Nový předpoklad (po korekci)

ENG integruje existující framework a staví MiLO-specifickou vrstvu.

**Upravená mise ENG-001:**

**Cíl:** Integrovat orchestrační framework a postavit MiLO adaptér.

**Výstupy:**
- `OrchestrationProvider` interface
- `LangGraphOrchestrationProvider` (primární implementace)
- `ConstitutionalValidationHook` — kontroluje každý krok proti Ústavě
- `DepartmentAccessControl` — oddělení vlastní své agenty
- `MissionSemantics` — plánování, zhodnocení, poučení
- `ModelRouter` — provider abstraction s policy-based routing

**Nový termín:** 30 dní (místo 45 — stavíme míň).

---

## Shrnutí

| Kategorie | MiLO staví | Používá existující |
|-----------|-----------|-------------------|
| Orchestrace | 0 % | 100 % (LangGraph / Hermes) |
| Tool calling | 0 % | 100 % (MCP) |
| Governance | 100 % | 0 % |
| Organizační model | 100 % | 0 % |
| Paměť / znalosti | 80 % | 20 % (pgvector, Whoosh) |
| Komunikace | 30 % | 70 % (Telegram API, Gmail API) |
| Monitoring | 10 % | 90 % (LangSmith, existující nástroje) |

MiLO staví to, co ho dělá MiLO. Zbytek bere z existujícího ekosystému.

---

*Tento dokument bude převeden na ADR-0011 po schválení Executive Boardem.*
