# Agent Runtime Bugfix

## Reprodukce

1. Otevřít http://localhost:3000/agents.
2. Kliknout na **Start** u již běžícího agenta (server spouští agenty automaticky při startu).
3. Aplikace nezobrazí žádnou chybu, v konzoli prohlížeče se objeví `Unhandled Promise Rejection`.
4. Server log ukazuje `Invalid state transition: ... -> starting` s HTTP 500.
5. Live logy se neobnovují – `/api/events/stream` vrací 401, protože browserový `EventSource` neumí poslat `Authorization` header.

## Kořenové příčiny

- **SSE autentizace**: `/events/stream` vyžadoval `Authorization: Bearer` header. `EventSource` tento header nepodporuje, takže live update nefungoval.
- **API error handling**: endpointy `start/stop/pause/resume/restart` neměly `try/catch`. Neplatný stavový přechod vyhazoval 500 místo srozumitelné 409.
- **UI error handling**: `handleAction` nezachytával chyby a neobnovoval stav. Uživatel nedostal žádnou zpětnou vazbu.
- **Tlačítka**: Pause/Resume byla vidět i ve stavech, kde přechod není povolen (např. Pause u offline agenta).
- **Queue/History**: specializovaní agenti (`CalendarAgent`, `CommunicationAgent`, `DeveloperAgent`) uchovávali historii/frontu v interním stavu, ale nepřepisovali `getTaskHistory()`/`getPendingQueue()`.
- **Detailní komponenty**: `CalendarAgentDetail`, `CommunicationAgentDetail`, `DeveloperAgentDetail` se obnovovaly pouze při mountu, nikoliv při live SSE událostech.

## Opravy

### Backend

- `apps/api/src/modules/auth/middleware.ts` – akceptuje token i z query parametru `?token=...`, aby `EventSource` mohl procházet autentizací.
- `apps/api/src/modules/events/routes.ts` – SSE route nyní používá `reply.hijack()` a správně vrací odpověď bez dvojího odeslání hlaviček.
- `apps/api/src/modules/agents/routes.ts` – všechny akční endpointy (`start/stop/pause/resume/restart`) jsou obalené `try/catch` a vracejí **409 Conflict** s konkrétní chybovou zprávou.

### Frontend

- `apps/web/lib/api/client.ts` – export `getAccessToken()` pro použití v `EventSource` URL.
- `apps/web/app/agents/page.tsx` – `EventSource` posílá token v query, `handleAction` má `try/catch`, toast notifikace, loading stavy a **Spustit vše** opravdu spustí všechny offline agenty.
- `apps/web/app/agents/[id]/page.tsx` – stejné vylepšení error handlingu, loading stavů a disabled tlačítek podle stavu agenta.
- `apps/web/components/agent/agent-card.tsx` – tlačítka Start/Stop/Pause/Resume/Restart se zobrazují pouze v povolených stavech; aktivní akce ukazuje spinner.
- `packages/agents/src/agents/{calendar,communication,developer}.ts` – přidány `getTaskHistory()` a `getPendingQueue()`.
- `apps/web/components/agent/{calendar,communication,developer}-agent-detail.tsx` – obnova specializovaného stavu při změně `agent.state.lastActivityAt` (SSE).
- `apps/web/app/agents/error.tsx` a `apps/web/app/agents/[id]/error.tsx` – Next.js error boundaries s tlačítkem retry.
- `apps/web/app/layout.tsx` – přidán `<Toaster />` z `sonner`.
- `apps/web/lib/api/types.ts` – `ApiError.message` nyní obsahuje tělo odpovědi, aby se v UI zobrazila konkrétní chyba.

### Testy

- `apps/web/lib/api/agents.api.test.ts` – testy pro všechny agent action endpointy a chybové odpovědi.
- `apps/web/components/agent/agent-card.test.tsx` – testy pro viditelnost tlačítek podle stavu a volání callbacků.
- Přidán Vitest + Testing Library do `apps/web`.

## Výsledek

- Start/Pause/Resume/Stop/Restart nyní správně mění stav agenta a zobrazují toast.
- Detail agenta se otevírá a obnovuje při live událostech.
- Chybné akce vracejí konkrétní zprávu, ne obecnou chybu.
- Live logy a progress se aktualizují přes SSE.
- Historie/fronta se zobrazuje i pro specializované agenty.
