# MiLO_Core — Kompletní implementační plán: Živý operační systém

> **Pro Hermes:** Implementuj tento plán krok za krokem. Začni od Tasku 1.
> **Goal:** Proměnit MiLO_Core z architektonické skořápky na živý operační systém s fungujícími agenty,
> reálnými providery, LangGraph orchestrací, testy a live dashboardem aktivity.
> **Architecture:** Monorepo (pnpm) → API (Fastify:4000) → LangGraph (orchestrace) → Agenti (LLM) → Dashboard (Next.js 14)
> **Tech Stack:** TypeScript, Fastify 5, Next.js 14, LangGraph, Supabase, Redis/BullMQ, Gmail OAuth

---

## 📋 PŘEHLED 5 FÁZÍ

| Fáze | Oblast | Doba | Priorita |
|------|--------|------|----------|
| 1 | LangGraph orchestrace agentů | 3-5 dní | 🔴 |
| 2 | Provider-agnostic LLM vrstva | 2-3 dny | 🔴 |
| 3 | Reální providery (Gmail, Calendar) | 2-3 dny | 🔴 |
| 4 | Live Activity Dashboard | 3-4 dny | 🟡 |
| 5 | Testy (integrační + E2E) | 2-3 dny | 🟡 |

---

## FÁZE 1: LangGraph orchestrace agentů

### Cíl
Nahradit mock AgentManager za LangGraph workflow, kde každý agent je uzel v grafu.
Agenti se spouští jako LangGraph runy s checkpointy, retry a observabilitou.

### Architektura
```
[Chief of Staff] → plánuje → deleguje → [Agent 1..N]
                                      ↓
                               LangGraph StateGraph
                                      ↓
                            Checkpointy (Supabase)
                                      ↓
                            Dashboard (SSE stream)
```

---

### Task 1.1: Instalace a konfigurace LangGraph

**Cíl:** Přidat LangGraph do `packages/agents/`

**Soubory:**
- Modify: `packages/agents/package.json`
- Create: `packages/agents/src/orchestrator/index.ts`
- Create: `packages/agents/src/orchestrator/graph.ts`
- Create: `packages/agents/src/orchestrator/state.ts`

**Kroky:**
1. `cd /Users/mb/dev/MiLO_Core && pnpm --filter @milo/agents add @langchain/langgraph @langchain/core`
2. Vytvoř `packages/agents/src/orchestrator/state.ts`:
```ts
import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (curr, upd) => [...(curr ?? []), ...upd],
    default: () => [],
  }),
  currentAgent: Annotation<string>({
    reducer: (_, upd) => upd,
    default: () => "chief-of-staff",
  }),
  taskQueue: Annotation<string[]>({
    reducer: (curr, upd) => [...(curr ?? []), ...upd],
    default: () => [],
  }),
  completedTasks: Annotation<string[]>({
    reducer: (curr, upd) => [...(curr ?? []), ...upd],
    default: () => [],
  }),
  status: Annotation<string>({
    reducer: (_, upd) => upd,
    default: () => "idle",
  }),
  activityLog: Annotation<string[]>({
    reducer: (curr, upd) => [...(curr ?? []), ...upd],
    default: () => [],
  }),
});
```

3. Vytvoř `packages/agents/src/orchestrator/graph.ts` — LangGraph StateGraph s uzly pro každého agenta

4. Vytvoř `packages/agents/src/orchestrator/index.ts` — export

---

### Task 1.2: Agent jako LangGraph uzel

**Cíl:** Každý agent implementuje rozhraní pro LangGraph node.

**Soubory:**
- Modify: `packages/agents/src/agent.ts`
- Create: `packages/agents/src/orchestrator/nodes/chief-of-staff.ts`
- Create: `packages/agents/src/orchestrator/nodes/calendar-agent.ts`
- Create: `packages/agents/src/orchestrator/nodes/communication-agent.ts`
- Create: `packages/agents/src/orchestrator/nodes/research-agent.ts`
- Create: `packages/agents/src/orchestrator/nodes/knowledge-agent.ts`
- Create: `packages/agents/src/orchestrator/nodes/developer-agent.ts`
- Create: `packages/agents/src/orchestrator/nodes/legal-agent.ts`
- Create: `packages/agents/src/orchestrator/nodes/document-agent.ts`
- Create: `packages/agents/src/orchestrator/nodes/automation-agent.ts`

**Kroky:**
1. Upravit `AgentEntity` rozhraní v `agent.ts` — přidat metodu `asLangGraphNode()`
2. Pro každého agenta vytvoř node funkci, která:
   - Přijme `AgentState`
   - Zaloguje aktivitu do `activityLog`
   - Zavolá LLM (zatím mock — napojí se ve Fázi 2)
   - Vrátí nový stav
3. Přidat `explain()` výstup do activity logu

---

### Task 1.3: API endpointy pro orchestrátor

**Cíl:** REST API pro spouštění, pozastavení a monitorování agent workflow.

**Soubory:**
- Modify: `apps/api/src/modules/agents/routes.ts`
- Create: `apps/api/src/modules/agents/orchestrator-handler.ts`
- Modify: `apps/api/src/server.ts` (pokud třeba)

**Kroky:**
1. Přidat endpointy:
   - `POST /api/agents/run` — spustí Chief of Staff workflow
   - `POST /api/agents/:id/start` — spustí konkrétního agenta
   - `POST /api/agents/:id/pause` — pozastaví
   - `POST /api/agents/:id/resume` — obnoví
   - `GET /api/agents/:id/status` — stav + activity log
   - `GET /api/agents/activity/stream` — SSE stream aktivity
2. Implementovat `OrchestratorHandler` třídu, která obaluje LangGraph run

---

### Task 1.4: Checkpointy do Supabase

**Cíl:** LangGraph checkpointy ukládat do Supabase pro persistenci mezi restarty.

**Soubory:**
- Modify: `packages/agents/src/orchestrator/graph.ts`
- Modify: `packages/database/src/repositories/agent-repository.ts`

**Kroky:**
1. Přidat Supabase checkpoint saver do LangGraph grafu
2. Ukládat stav po každém kroku agenta
3. Při restartu API obnovit stav z checkpointu

---

## FÁZE 2: Provider-agnostic LLM vrstva

### Cíl
Agenti volají LLM přes jednotné rozhraní. Podpora: OpenAI, Anthropic, Ollama (lokální), DeepSeek.
Konfigurace přes environment proměnné.

---

### Task 2.1: LLM Provider rozhraní

**Cíl:** Abstraktní vrstva nad LLM providers.

**Soubory:**
- Create: `packages/ai/src/llm/provider.ts`
- Create: `packages/ai/src/llm/openai-provider.ts`
- Create: `packages/ai/src/llm/anthropic-provider.ts`
- Create: `packages/ai/src/llm/ollama-provider.ts`
- Create: `packages/ai/src/llm/factory.ts`
- Modify: `packages/ai/package.json` — přidat `@langchain/openai`, `@langchain/anthropic`

**Kroky:**
1. Definovat `LLMProvider` interface:
```ts
export interface LLMProvider {
  chat(messages: ChatMessage[], options?: LLMOptions): Promise<ChatResponse>;
  stream(messages: ChatMessage[], options?: LLMOptions): AsyncIterable<ChatResponse>;
}
```

2. Implementovat OpenAI provider (přes `@langchain/openai`)
3. Implementovat Anthropic provider (přes `@langchain/anthropic`)
4. Implementovat Ollama provider (přes `@langchain/community`)
5. Factory funkce `createLLMProvider()` — čte `LLM_PROVIDER` z env

---

### Task 2.2: Agent system prompty

**Cíl:** Každý agent má system prompt, který dostane při volání LLM.

**Soubory:**
- Create: `packages/agents/src/prompts/chief-of-staff.md`
- Create: `packages/agents/src/prompts/calendar-agent.md`
- Create: `packages/agents/src/prompts/communication-agent.md`
- Create: `packages/agents/src/prompts/developer-agent.md`
- Create: `packages/agents/src/prompts/research-agent.md`
- Create: `packages/agents/src/prompts/knowledge-agent.md`
- Create: `packages/agents/src/prompts/legal-agent.md`
- Create: `packages/agents/src/prompts/document-agent.md`
- Create: `packages/agents/src/prompts/automation-agent.md`
- Create: `packages/agents/src/prompts/index.ts` — loader

**Kroky:**
1. Pro každého agenta napsat Markdown system prompt dle jeho role
2. Vytvořit loader, který načítá .md soubory a vkládá je do LLM volání

---

### Task 2.3: Propojení agentů s LLM

**Cíl:** Každý LangGraph node volá LLM přes provider vrstvu.

**Soubory:**
- Modify: `packages/agents/src/orchestrator/nodes/*.ts` (všechny nody)

**Kroky:**
1. V každém agent nodu nahradit mock odpovědi za volání `createLLMProvider().chat()`
2. Přidat tool calling: agent může volat nástroje (MCP) přes function calling
3. Přidat `explain()` výstup do activity logu s reálným obsahem

---

## FÁZE 3: Reální providery

### Cíl
Nahradit mock providery za reálné integrace. Začínáme Gmailem a Kalendářem (OAuth už je).

---

### Task 3.1: Gmail provider

**Cíl:** Communication Agent může číst a psát emaily přes Gmail API.

**Soubory:**
- Create: `apps/api/src/services/gmail-provider.ts`
- Modify: `apps/api/src/modules/email/routes.ts`
- Modify: `apps/api/src/modules/communication/` (pokud existuje)

**Poznámka:** OAuth token existuje v `~/.hermes/google_token.json`. Google API klient už funguje (viz dnešní e-mail summary).

**Kroky:**
1. Vytvořit `GmailProvider` třídu používající Google API
2. Napojit na Communication Agenta
3. Přidat endpoint `POST /api/email/send` a `GET /api/email/inbox`

---

### Task 3.2: Calendar provider

**Cíl:** Calendar Agent může číst a vytvářet události přes Google Calendar API.

**Soubory:**
- Create: `apps/api/src/services/calendar-provider.ts`
- Modify: `apps/api/src/modules/calendar/routes.ts`

**Kroky:**
1. Vytvořit `CalendarProvider` třídu
2. Napojit na Calendar Agenta
3. Přidat reálné CRUD operace

---

### Task 3.3: Hermes integrace přes MCP

**Cíl:** MiLO agenti mohou používat Hermes nástroje přes MCP protokol.

**Soubory:**
- Create: `apps/api/src/services/hermes-mcp-client.ts`
- Modify: `packages/tools/src/mcp/mcp-client.ts`

**Kroky:**
1. Vytvořit MCP klienta, který se připojí k Hermes MCP serveru
2. Agenti získají přístup k: file system, terminal, web search, browser, computer_use
3. Activity log zachytává volání Hermes nástrojů

---

## FÁZE 4: Live Activity Dashboard

### Cíl
Dashboard ukazuje v reálném čase:
- Co dělají agenti (stav, aktuální úkol, progress)
- Co dělá Hermes (tool calls, výsledky)
- Co se udělalo (activity history)
- Co je v plánu (task queue)
- Možnost spouštět/pozastavit/restartovat agenty

---

### Task 4.1: SSE stream z API

**Cíl:** API vysílá Server-Sent Events s aktivitou agentů.

**Soubory:**
- Create: `apps/api/src/modules/activity/sse-manager.ts`
- Create: `apps/api/src/modules/activity/routes.ts`
- Modify: `apps/api/src/server.ts` — registrovat activity routes

**Kroky:**
1. Vytvořit `SSEManager` — spravuje připojené klienty, broadcastuje události
2. Endpoint `GET /api/activity/stream` — SSE stream
3. Každý agent node posílá události do SSEManageru:
   - `agent:started` — agent začal pracovat
   - `agent:thinking` — agent přemýšlí (LLM volání)
   - `agent:tool_call` — agent volá nástroj
   - `agent:tool_result` — výsledek nástroje
   - `agent:completed` — agent dokončil úkol
   - `agent:error` — chyba
   - `hermes:tool_call` — Hermes nástroj volán
   - `hermes:tool_result` — výsledek Hermes nástroje

---

### Task 4.2: Activity Feed komponenta

**Cíl:** Dashboard komponenta zobrazující real-time stream aktivity.

**Soubory:**
- Create: `apps/web/components/activity/activity-feed.tsx`
- Create: `apps/web/components/activity/activity-item.tsx`
- Create: `apps/web/components/activity/agent-status-badge.tsx`
- Create: `apps/web/hooks/use-activity-stream.ts`

**Kroky:**
1. `useActivityStream` hook — připojí se k SSE endpointu, vrací pole událostí
2. `ActivityFeed` — scrollovatelný seznam s:
   - Časová osa (vertikální lajna)
   - Ikony podle typu agenta/akce
   - Barevné odlišení: agenti modře, Hermes zeleně, chyby červeně
   - Automatický scroll na nejnovější
3. `AgentStatusBadge` — malý badge s:
   - Stavem (idle/thinking/working/error)
   - Progress barem
   - Jménem agenta

---

### Task 4.3: Agent Control Panel

**Cíl:** Panel pro ovládání agentů — start, stop, pause, resume.

**Soubory:**
- Create: `apps/web/components/agents/agent-control-panel.tsx`
- Create: `apps/web/components/agents/agent-card.tsx`
- Create: `apps/web/hooks/use-agents.ts`

**Kroky:**
1. `useAgents` hook — fetch stavu všech agentů z API, polling nebo SSE
2. `AgentCard` — karta agenta s:
   - Jméno, role, stav
   - Progress bar aktuálního úkolu
   - Poslední aktivita (timestamp + text)
   - Tlačítka: Start, Pause, Resume, Stop
3. `AgentControlPanel` — grid karet všech 9 agentů

---

### Task 4.4: Task Queue a History

**Cíl:** Zobrazit frontu úkolů a historii dokončených.

**Soubory:**
- Create: `apps/web/components/tasks/task-queue.tsx`
- Create: `apps/web/components/tasks/task-history.tsx`
- Create: `apps/web/hooks/use-tasks.ts`

**Kroky:**
1. API endpoint `GET /api/tasks/queue` — fronta úkolů
2. API endpoint `GET /api/tasks/history` — historie
3. `TaskQueue` komponenta — seznam čekajících úkolů s prioritou
4. `TaskHistory` — seznam dokončených s výsledkem
5. Možnost přidat úkol: `POST /api/tasks`

---

### Task 4.5: Integrace do hlavního dashboardu

**Cíl:** Všechny nové komponenty zapojit do existujícího dashboard layoutu.

**Soubory:**
- Modify: `apps/web/app/executive/control/agents/page.tsx` — přidat Activity Feed
- Create: `apps/web/app/executive/activity/page.tsx` — nová stránka s plným activity feedem
- Modify: `apps/web/components/views/home-view.tsx` — přidat přehledový widget

**Kroky:**
1. Upravit Agent Control Center stránku — přidat activity stream pod karty agentů
2. Vytvořit samostatnou stránku `/executive/activity` s plnou historií
3. Na homepage přidat widget "Aktuální dění" s posledními 5 událostmi

---

## FÁZE 5: Testy

### Cíl
Integrační testy pro API, unit testy pro agenty a providery.

---

### Task 5.1: Testy pro LLM Provider vrstvu

**Cíl:** Unit testy pro provider factory a jednotlivé providery.

**Soubory:**
- Create: `packages/ai/src/llm/__tests__/factory.test.ts`
- Create: `packages/ai/src/llm/__tests__/openai-provider.test.ts`
- Create: `packages/ai/src/llm/__tests__/anthropic-provider.test.ts`

**Kroky:**
1. Test factory — správný provider podle env
2. Test OpenAI provider — mock API response
3. Test Anthropic provider — mock API response

---

### Task 5.2: Testy pro agenty

**Cíl:** Testy pro AgentManager, definice agentů, a LangGraph nody.

**Soubory:**
- Create: `packages/agents/src/__tests__/agent-manager.test.ts`
- Create: `packages/agents/src/__tests__/agent-definitions.test.ts`
- Create: `packages/agents/src/orchestrator/__tests__/graph.test.ts`

**Kroky:**
1. Test AgentManager — registrace, start, stop
2. Test definic — validace struktury
3. Test LangGraph grafu — průchod grafem s mock LLM

---

### Task 5.3: Integrační testy API

**Cíl:** Testy API endpointů s mock providery.

**Soubory:**
- Create: `apps/api/tests/agents.test.ts`
- Create: `apps/api/tests/activity.test.ts`
- Create: `apps/api/tests/email.test.ts`

**Kroky:**
1. Test `GET /api/agents` — vrací seznam agentů
2. Test `POST /api/agents/:id/start` — spustí agenta
3. Test `GET /api/activity/stream` — SSE stream
4. Test `POST /api/email/send` — odeslání emailu (mock)

---

## ✅ Verifikační checklist

- [ ] `pnpm test` projde všechny testy
- [ ] `pnpm dev` spustí API i dashboard
- [ ] Dashboard na `localhost:3000` zobrazuje live activity
- [ ] Agent Control Panel umí start/stop/pause agenty
- [ ] Activity feed ukazuje reálné události z agentů a Hermes
- [ ] Gmail provider posílá emaily (test s mock)
- [ ] Calendar provider vytváří události (test s mock)
- [ ] LangGraph checkpointy persistují do Supabase
- [ ] CONSTITUTION.md nebyl porušen žádnou změnou
