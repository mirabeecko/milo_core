# MiLO_Core – Refactor Plan

> Cíl: Připravit MVP na napojení reálných dat a externích služeb.
> Filozofie: Žádné nové funkce, jen strukturální vylepšení, která umožní bezpečný přechod z mocků na API.

---

## Refaktor #1: Vytvořit centrální data / API layer na frontendu

### Proč

Aktuálně webové stránky přímo importují `lib/mocks` nebo volají endpointy ad-hoc (`/api/briefing`, `/api/email`). Při napojení reálných dat bychom museli měnit každou stránku zvlášť.

### Co udělat

1. Vytvořit `apps/web/lib/api/` adresář:
   - `client.ts` – tenký wrapper nad `fetch` s base URL, auth header a JSON handling.
   - `types.ts` – `ApiResponse<T>`, `ApiError`, `PaginatedResponse<T>`.
   - `hooks.ts` – základní React hooky `useQuery`, `useMutation` (nebo integrace TanStack Query, pokud je rozhodnuto).
2. Vytvořit API služby podle domén:
   - `briefing.api.ts`
   - `documents.api.ts`
   - `agents.api.ts`
   - `projects.api.ts`
   - `chat.api.ts`
3. Každá služba musí podporovat **mock režim** i **API režim** přepínatelný přes feature flag nebo environment.

### Příklad rozhraní

```ts
// apps/web/lib/api/client.ts
export async function apiClient<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...options?.headers,
    },
  });
  if (!response.ok) {
    throw new ApiError(response.status, await response.text());
  }
  return response.json() as Promise<T>;
}
```

### Přijatelný výsledek

- Všechny stránky používají API služby místo přímého importu mock dat.
- Mock data jsou stále použitelná přes `USE_MOCK_DATA=true` bez změn v komponentách.
- Build a testy procházejí.

---

## Refaktor #2: Sjednotit demo / reálná data strategii na backendu

### Proč

Některé services (`AuthService`, `BriefingService`) mají interní demo fallback, zatímco jiné (`EmailService`, `CalendarService`, `DocumentsService`) hážou chybu v constructoru při chybějících credentials. To vede k nekonzistentnímu chování a komplikuje vývoj.

### Co udělat

1. Zavést globální config flag `DEMO_MODE=true|false`.
2. Každá service implementuje rozhraní:
   ```ts
   interface IntegrationService<T> {
     isConfigured(): boolean;
     isDemo(): boolean;
     list(...args): Promise<T[]>;
     generateDemoData(): T[];
   }
   ```
3. V route handleru se volá `service.list()`. Pokud není nakonfigurováno, service automaticky vrátí `generateDemoData()` a označí response flag `demo: true`.
4. Odstranit `throw new Error(...)` z constructorů services.

### Přijatelný výsledek

- Backend spustitelný bez credentials vrací demo data konzistentně.
- Frontend dostává vždy stejný response shape bez ohledu na demo/reál.
- Žádné kaskádové chyby při startu API.

---

## Refaktor #3: Vytvořit `/api/chat` endpoint a command processor

### Proč

Chat je aktuálně lokální simulace v `app/chat/page.tsx`. Pro reálné použití potřebujeme endpoint, který zpracuje příkaz, vybere agenta/tools a vrátí odpověď. Tento endpoint bude sdílený pro UI, CLI i budoucí hlas.

### Co udělat

1. Vytvořit `apps/api/src/modules/chat/`:
   - `service.ts` – `ChatService` s `sendMessage(userId, conversationId, message)`.
   - `routes.ts` – POST `/chat`, GET `/chat/:id/history`.
   - `types.ts` – `ChatRequest`, `ChatResponse`, `ChatMessage`.
2. Vytvořit `CommandProcessor` v `packages/agents` nebo `apps/api`:
   - Rozpozná intent zprávy.
   - Volá příslušné nástroje (později Gmail, Calendar, Drive, Obsidian).
   - Vrací strukturovanou odpověď `{ text, sources[], suggestedActions[] }`.
3. Pro MVP může `CommandProcessor` vracet mock odpovědi podle klíčových slov, ale musí mít stejný interface jako pozdější LLM verze.
4. Přesunout `generateMockReply` logiku z frontendu do backendu.

### Přijatelný výsledek

- Chat UI volá POST `/api/chat`.
- CLI může použít stejný endpoint (sdílený HTTP client).
- Command input na Home může volat `/api/chat` místo přesměrování.

---

## Refaktor #4: Extrahovat znovupoužitelné UI komponenty

### Proč

Row/item komponenty jsou lokální v každé stránce. To ztěžuje údržbu, testování a konzistenci.

### Co udělat

1. Vytvořit `apps/web/components/common/`:
   - `page-header.tsx` – nadpis stránky + popis + akční tlačítka.
   - `empty-state.tsx` – jednotný prázdný stav.
   - `loading-state.tsx` – skeletony pro listy.
   - `status-badge.tsx` – wrapper nad Badge pro priority a statusy.
   - `entity-card.tsx` – obecná karta s ikonou, nadpisem a metadata.
2. Vytvořit domain-specific komponenty:
   - `components/priority/priority-row.tsx`
   - `components/decision/decision-row.tsx`
   - `components/document/document-row.tsx`
   - `components/agent/agent-card.tsx`
   - `components/project/project-card.tsx`
3. Nahradit lokální definice v page souborech těmito komponentami.

### Přijatelný výsledek

- Žádná duplicitní row komponenta v page souborech.
- Komponenty jsou testovatelné samostatně.
- UI zůstává vizuálně stejné.

---

## Refaktor #5: Přidat loading, error a empty stavy

### Proč

Aktuálně většina stránek nemá loading ani error handling. Při napojení na API to povede k špatné UX.

### Co udělat

1. Každá stránka, která načítá data, musí mít:
   - `isLoading` stav s `<LoadingState />`.
   - `error` stav s `<EmptyState variant="error" />`.
   - `empty` stav s `<EmptyState />`.
2. Přidat Error Boundary pro celou aplikaci (`app/error.tsx` v Next.js).
3. Přidat `Suspense` boundaries kolem async komponent (pokud přejdeme na serverové načítání).

### Přijatelný výsledek

- Uživatel vidí feedback při načítání i při chybě.
- Aplikace nespadne na neočekávanou chybu.

---

## Další menší úpravy (nižší priorita)

- Přesunout `demoBriefing` a hardcoded obsah z BriefView do `lib/mocks`.
- Zpřísnit typy: `Agent.icon`, `Document.type`, `DecisionItem.source`.
- Zkrátit sidebar nebo přidat collapsible sekce.
- Přidat Command palette (Cmd+K) pro rychlou navigaci.
- Přidat základní unit testy pro API client a common komponenty.
- Refaktorovat TTS store – oddělit inicializaci od definice store.

---

## Pořadí implementace

1. **Refaktor #2** – sjednotit demo strategii (backend musí být stabilní).
2. **Refaktor #1** – vytvořit frontend data layer.
3. **Refaktor #3** – `/api/chat` a command processor.
4. **Refaktor #4** – extrahovat UI komponenty.
5. **Refaktor #5** – loading/error stavy.

---

## Jak měřit úspěch

- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` prochází.
- Žádná stránka nepoužívá přímý import z `lib/mocks` (kromě API služeb v demo režimu).
- Chat volá `/api/chat`.
- Backend vrací konzistentní demo data bez credentials.
- Code coverage se zvýší (alespoň API client a common komponenty mají testy).
