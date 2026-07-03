# MiLO_Core – MVP Audit

> Datum: 2026-07-03
> Verze: MVP s mock daty
> Cíl: Zhodnotit použitelnost, konzistenci a připravenost na reálná data bez zavádění nových funkcí.

---

## 1. Je Home skutečné command center?

### Stav: ČÁSTEČNĚ

Home obsahuje všechny požadované sekce:
- uvítací blok s datem, stavem systému a hlavním doporučením,
- „Dnešní 3 priority“ s progress barem,
- „Briefing snapshot“,
- „Čeká na moje rozhodnutí“,
- „Poslední aktivita“,
- velké command input pole.

### Problémy
- Command input pouze přesměruje na `/chat?prompt=...`. Není to skutečná command layer – nerozpoznává příkazy, nevolá agenty přímo z dashboardu.
- Doporučení a stav systému jsou hardcoded stringy, nikoliv dynamické na základě dat.
- Tlačítka „Otevřít prioritu“ a „Rozhodnout“ v decision cards nemají žádnou akci.
- Priorities nejsou interaktivní (nelze označit jako hotové).

### Verdikt
Home **vypadá jako command center**, ale zatím je to převážně prezentační stránka. Pro každodenní použití je to přijatelné, ale pro „skutečné command center“ chybí interaktivita a command processing.

---

## 2. Jsou stránky použitelné i s mock daty?

### Stav: ANO

- **Home**: Přehledný dashboard s reálně vypadajícími daty.
- **Today's Brief**: Generuje demo briefing, lze přehrát, zkopírovat, regenerovat.
- **Chat**: Funguje s mock odpověďmi, má loading state, příklady promptů.
- **Agents**: Přehled agentů s logy.
- **Projects**: Přehled projektů se stavem a prioritami.
- **Documents**: Vyhledávání a filtry fungují nad mock daty.
- **Settings**: Formuláře jsou interaktivní, i když zatím neukládají.

### Problémy
- Některá tlačítka jsou nefunkční (např. „Spustit vše“ v Agents, „Nový projekt“, „Nahrát dokument“, „Uložit nastavení“).
- Briefing sidebar má hardcoded schůzky a zprávy místo dat z mocků.
- Chat odpovědi jsou čistě textové, bez zdrojů/citací.

### Verdikt
Pro demo a každodenní „prohlížení“ použitelné. Pro reálnou práci je potřeba doplnit akce.

---

## 3. Je navigace logická?

### Stav: ANO

Sidebar obsahuje všechny hlavní sekce:
Home → Brief → Projects → Agents → Documents → Knowledge → Email → Calendar → Chat → Activity → Notifications → Settings.

### Problémy
- Sidebar je dlouhý a některé položky (Activity, Notifications) zatím nemají obsah.
- Aktivní stránka se zvýrazňuje pouze přesnou shodou pathname, což může selhat u vnořených cest.
- Chybí Command palette / Cmd+K pro rychlou navigaci, což je pro produkt úrovně Linear/Notion očekávané.

### Verdikt
Logická, ale ne premium. Pro MVP OK, pro produkt je potřeba zkrátit a přidat search/command palette.

---

## 4. Je UI konzistentní?

### Stav: PŘEVÁŽNĚ ANO

- Používáme shadcn/ui komponenty (Card, Button, Badge, Input, Switch).
- Dark mode je výchozí.
- Barvy a typografie jsou konzistentní.

### Problémy
- `FilterBadge` v Documents je vlastní tlačítko místo Badge komponenty – vizuálně podobné, ale jiná implementace.
- Některé card headery mají ikonu vlevo, jiné ne.
- `Progress` komponenta je vlastní, zatímco ostatní používají shadcn vzory.
- V některých místech se opakuje stejný layout kód (např. card s ikonou a popiskem) místo sdílené komponenty.
- Chybí jednotný empty state / loading state pattern.

### Verdikt
Konzistentní na první pohled, ale existují drobné nesrovnalosti a duplicitní kód.

---

## 5. Jsou komponenty znovupoužitelné?

### Stav: ČÁSTEČNĚ

- Základní UI komponenty (Button, Card, Badge, Input, Switch) jsou znovupoužitelné.
- `DashboardLayout`, `Sidebar`, `Header` jsou sdílené.
- `TtsPlayButton` a `TtsControls` jsou znovupoužitelné.

### Problémy
- Row komponenty (`PriorityRow`, `SnapshotItem`, `DecisionRow`, `ActivityItem`, `AgentCard`, `DocumentRow`, `FilterBadge`) jsou definovány lokálně v page/view souborech.
- `renderBriefLine` v BriefView je lokální a není testovatelný samostatně.
- `generateMockReply` v ChatPage je lokální a bude se muset přesunout/logicky nahradit API voláním.
- Chybí sdílené komponenty pro: PageHeader, EmptyState, LoadingState, StatusBadge, PriorityBadge.

### Verdikt
Základy jsou, ale pro scalabilitu je potřeba vytáhnout row/item komponenty do vlastních souborů.

---

## 6. Jsou mock data oddělená od UI?

### Stav: ANO

- Všechna mock data jsou v `apps/web/lib/mocks/index.ts`.
- Typy jsou v `apps/web/lib/types/index.ts`.
- Formátovací helpery jsou v `apps/web/lib/format.ts`.

### Problémy
- `demoBriefing` v `BriefView` je hardcoded string v komponentě, nikoliv v mock souboru.
- Kalendář dne a důležité zprávy v BriefView jsou hardcoded.
- `iconMap` v AgentsPage je lokální – měl by být spíš součástí dat nebo utility.
- Chat generuje odpovědi lokálně v komponentě.

### Verdikt
Data struktura je správně oddělená, ale některé stránky stále obsahují hardcoded obsah.

---

## 7. Jsou typy připravené na budoucí API?

### Stav: ČÁSTEČNĚ

- `PriorityItem`, `Agent`, `Project`, `Document`, `ChatMessage`, atd. jsou dobře definované.
- Typy pokrývají základní entity.

### Problémy
- Chybí API response typy (např. `ApiResponse<T>`, `PaginatedResponse<T>`).
- Chybí loading / error stavy v typech.
- `BriefingSnapshot` je objekt, ne interface exportovaný z types.
- `Agent.icon` je `string`, místo konkrétního union typu.
- `Document.type` je `string`, místo unionu.
- `DecisionItem.source` je `string`, místo `AgentId` nebo podobně.
- `ActivityLogItem.type` je union, ale chybí rozlišení detailu.

### Verdikt
Základní entity jsou pokryté, ale pro napojení API je potřeba doplnit response/error typy a zpřísnit některé stringy.

---

## 8. Je připravená command layer pro chat, dashboard, CLI a později hlas?

### Stav: NE

- Command input na Home přesměruje jen na Chat.
- Chat používá lokální `generateMockReply`, nikoliv API.
- CLI (`apps/cli`) má vlastní logiku, která není sdílená s webem.
- Hlasový vstup není v MVP, ale command layer by měla být agnostická vůči vstupu.

### Problémy
- Chybí centrální `CommandProcessor` nebo `AgentRuntime` abstrakce volatelná z UI, CLI i budoucího hlasu.
- Chat, Dashboard a CLI by měly používat stejnou service vrstvu.
- Neexistuje API endpoint pro obecné dotazy (`/api/chat`).

### Verdikt
Není připravená. Před reálnými daty je to jedna z nejdůležitějších věcí k opravě.

---

## 9. Funguje build, lint a testy?

### Stav: ANO

```bash
pnpm typecheck  # ✅
pnpm lint       # ✅
pnpm test       # ✅
pnpm build      # ✅
```

### Problémy
- Test coverage je velmi nízká (pouze `packages/tts` má testy).
- `passWithNoTests` maskuje absence testů v ostatních packages.
- Build má warningy ohledně Node.js 20 a Supabase, ale nejsou blokující.

### Verdikt
CI prochází, ale kvalita testů je slabá.

---

## 10. Co je technický dluh?

### Kritický dluh (řešit před reálnými daty)

1. **Chybí centrální API/Data layer**
   - Webové stránky přímo importují mock data nebo volají endpointy ad-hoc.
   - Není definovaný pattern pro fetch, cache, loading, error.

2. **Backend services nejsou připraveny na demo režim konzistentně**
   - `EmailService`, `CalendarService`, `DocumentsService` hážou chybu v constructoru při chybějících credentials.
   - `AuthService` a `BriefingService` mají lokální demo fallback.
   - Není konzistentní strategie „demo vs reálná data“.

3. **Chybí command layer / chat API**
   - Chat je lokální simulace.
   - Dashboard command input neprovádí žádnou logiku.

### Střední dluh

4. **Příliš mnoho client komponentů**
   - Celé page soubory jsou `"use client"`, i když část by mohla být serverová.
   - To komplikuje SSR, SEO a pozdější napojení na API.

5. **Duplicitní a lokální komponenty**
   - Row/item komponenty by měly být extrahovány.
   - Chybí sdílené PageHeader, EmptyState, LoadingState.

6. **Hardcoded obsah v komponentách**
   - `demoBriefing`, kalendář a zprávy v BriefView.
   - `chatSuggestions`, `initialChatMessages` v mock jsou OK, ale odpovědi ne.

7. **TTS store side effect při inicializaci**
   - `refreshAvailability` se volá při vytvoření store, což je OK pro browser, ale není idiomatické.

8. **Auth middleware je stub**
   - Web middleware povoluje vše.
   - API middleware používá `demo-token` fallback.

9. **Chybí error boundaries a loading stavy**
   - Stránky nemají `<ErrorBoundary>`.
   - Skeletony jsou jen v BriefView a ChatSkeleton.

10. **Chybí validace environment proměnných v runtime**
    - Config používá Zod, ale některé services selhávají na úrovni constructoru.

---

## Shrnutí

| Oblast | Stav | Poznámka |
|--------|------|----------|
| Home jako command center | ⚠️ | Vypadá dobře, chybí interaktivita |
| Použitelnost s mock daty | ✅ | Použitelné pro demo |
| Logická navigace | ⚠️ | Dlouhý sidebar, chybí Cmd+K |
| Konzistentní UI | ⚠️ | Drobné nesrovnalosti |
| Znovupoužitelné komponenty | ⚠️ | Row komponenty lokálně |
| Oddělená mock data | ✅ | Dobrá struktura |
| Typy pro API | ⚠️ | Základ OK, chybí response typy |
| Command layer | ❌ | Není připravená |
| Build/lint/testy | ✅ | Prochází, nízká coverage |
| Technický dluh | ⚠️ | Kritické: data layer, demo strategie, chat API |

### Celkový verdikt

MVP je **použitelné a vizuálně přesvědčivé**, ale před napojením reálných dat je nutné:
1. Vytvořit centrální data/API layer.
2. Sjednotit demo fallback strategii na backendu.
3. Vytvořit `/api/chat` endpoint a command processor.
4. Extrahovat znovupoužitelné komponenty.
5. Přidat loading/error stavy a error boundaries.
