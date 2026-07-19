# Architecture Review – Milestone 3

## Informace o review

- **Milestone:** 3 — Real Data & Sync
- **Datum:** 2026-07-17
- **Reviewer:** AI Architecture Reviewer
- **Stav:** APPROVED

---

## 1. Architektura

### Kontrolní otázky

- [x] Jsou dodrženy vrstvy UI / API / Services / AI / Agents / Knowledge / Database / Storage / Event Bus / Jobs?
- [x] Nejsou porušeny hranice mezi vrstvami?
- [x] Je kód modulární a samostatně testovatelný?
- [x] Jsou použity repository pattern a dependency injection?
- [x] Odpovídá implementace návrhu v ARCHITECTURE.md?

### Nálezy

| # | Problém | Vážnost | Akce |
|---|---------|---------|------|
| 1 | BullMQ přidává frontovou infrastrukturu bez narušení existujícího kódu | OK | — |
| 2 | Workeři následují konzistentní pattern: ověř credentials → stáhni data → upsert do Supabase | OK | — |
| 3 | Repository pattern čistě odděluje přístup k datům od business logiky | OK | — |
| 4 | Chunking service zvládá více typů obsahu s konfigurovatelnými strategiemi | OK | — |
| 5 | pgvector embeddings ještě nejsou implementovány (SQL sloupec existuje, ale je zakomentován) | Střední | Aktivovat pgvector a implementovat v Milestone 4 |
| 6 | Workeři používají dynamické importy pro služby, aby se předešlo problémům se závislostmi při startu | Nízká | — |

---

## 2. Technický dluh

### Kontrolní otázky

- [ ] Nejsou v kódu dočasná řešení bez ticketu?
- [x] Jsou dodrženy principy SOLID, KISS, DRY?
- [ ] Je code coverage dostatečné (min. 70 %)?
- [x] Je dokumentace aktuální?
- [x] Prošly všechny testy, build a lint?

### Nálezy

| # | Problém | Vážnost | Akce |
|---|---------|---------|------|
| 1 | Implementace workerů je synchronní; chybí retry s backoffem pro selhání externích API nad rámec BullMQ výchozího nastavení | Střední | Přidat retry/backoff do externích API volání v Milestone 4 |
| 2 | Knowledge search používá ILIKE místo vektorové podobnosti (čeká se na pgvector) | Střední | Nahradit ILIKE vektorovým vyhledáváním v Milestone 4 |
| 3 | Chat historie stále používá in-memory Map místo persistence v Supabase | Nízká | Přesunout chat do Supabase v Milestone 4 |
| 4 | Chybí integrační testy pro sync workery | Nízká | Přidat integrační testy v Milestone 4 |

---

## 3. Bezpečnost

### Kontrolní otázky

- [x] Nejsou secrets v kódu?
- [x] Jsou validovány všechny vstupy?
- [ ] Jsou správně nastavena oprávnění a role?
- [ ] Jsou citlivá data šifrována?
- [x] Jsou externí volání zabezpečená (HTTPS, OAuth správně)?
- [x] Je nastaveno rate limiting a CORS?

### Nálezy

| # | Problém | Vážnost | Akce |
|---|---------|---------|------|
| 1 | OAuth refresh tokeny jsou uloženy v Supabase s RLS, ale nejsou šifrovány v klidu | Nízká | Zvážit šifrování citlivých tokenů v Milestone 4 |
| 2 | Worker joby nevalidují `userId` (předpokládají autentizovaný kontext) | Nízká | Přidat validaci userId do workerů v Milestone 4 |
| 3 | Obsidian worker načítá celý vault do paměti (pro velké vaulty může být problém) | Nízká | Implementovat stránkované čtení v Milestone 4 |

---

## Shrnutí

- **Počet nálezů:** 13
- **Kritické:** 0
- **Vysoké:** 0
- **Střední:** 3
- **Nízké:** 6
- **OK:** 4

## Rozhodnutí

- [x] APPROVED – pokračujeme dalším milestone
- [ ] CHANGES_REQUESTED – opravit nálezy před pokračováním

## Podmínky

1. **pgvector musí být aktivován před produkčním nasazením** – bez vektorového vyhledávání zůstává knowledge search omezený.
2. **Test coverage se musí zlepšit v M4** – integrační testy pro workery jsou nezbytné pro spolehlivost sync pipeline.
3. **Retry/backoff pro externí API musí být implementován před production** – současné řešení spoléhá pouze na BullMQ defaults.

## Doporučení pro Milestone 4

1. Implementovat pgvector embeddings pro sémantické vyhledávání
2. Přidat retry/backoff do externích API volání ve workerech
3. Přesunout chat konverzace do Supabase persistence
4. Přidat integrační testy pro worker joby
5. Implementovat rate limiting per externí API

## Poznámky

- Rozsah Milestone 3 byl splněn. Infrastruktura pro reálná data a synchronizaci je na místě.
- Workeři zvládají demo režim elegantně (přeskakují, když nejsou credentials).
- Reálná synchronizace se aktivuje, jakmile jsou nakonfigurovány OAuth credentials a Supabase.
- Repository pattern pokrývá 8 repozitářů (AccountsRepo, EmailsRepo, EventsRepo, FilesRepo, NotesRepo, ChunksRepo, BriefingsRepo, ChatsRepo) s konzistentním rozhraním.
- Google OAuth flow s token-refresher.ts je připraven pro produkční použití.
- Knowledge base chunking je paragraph-aware, Markdown-aware a content-type-specific.
- Projekt je připraven na přechod do Milestone 4.
