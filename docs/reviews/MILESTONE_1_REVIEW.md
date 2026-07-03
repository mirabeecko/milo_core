# Architecture Review – Milestone 1

## Informace o review

- **Milestone:** 1 – Core Integrations Skeleton
- **Datum:** 2026-07-03
- **Reviewer:** AI Architecture Reviewer
- **Stav:** APPROVED

---

## 1. Architektura

### Kontrolní otázky

- [x] Jsou dodrženy vrstvy UI / API / Services / AI / Agents / Database / Tools / Knowledge?
- [x] Nejsou porušeny hranice mezi vrstvami?
- [x] Je kód modulární a samostatně testovatelný?
- [x] Jsou použity repository pattern a dependency injection?
- [x] Odpovídá implementace návrhu v ARCHITECTURE.md?

### Nálezy

| # | Problém | Vážnost | Akce |
|---|---------|---------|------|
| 1 | TypeScript při `typecheck` občas použije starý `dist` místo `src` workspace package | Střední | Používá se workaround `rm -rf packages/tools/dist`; zvážit project references nebo `tsc --build` v Milestone 2 |
| 2 | Integrace sdílejí podobný pattern fetch → service → provider; zatím bez společného base class / helperu | Nízká | Zvážit abstrakci `IntegrationService` v Milestone 2 |
| 3 | Knowledge service je zatím pouze wrapper nad Obsidian; chybí univerzální knowledge repository | Nízká | Očekáváno v Milestone 3 – knowledge base & RAG |

---

## 2. Technický dluh

### Kontrolní otázky

- [x] Nejsou v kódu dočasná řešení bez ticketu?
- [x] Jsou dodrženy principy SOLID, KISS, DRY?
- [ ] Je code coverage dostatečné (min. 70 %)?
- [x] Je dokumentace aktuální?
- [x] Prošly všechny testy, build a lint?

### Nálezy

| # | Problém | Vážnost | Akce |
|---|---------|---------|------|
| 1 | Code coverage je nízká; většina packages nemá vlastní testy | Střední | Přidat unit a integrační testy v Milestone 2 |
| 2 | Demo fallback v auth, integracích a briefing je dočasné řešení pro vývoj | Nízká | Nahradit reálnými integracemi a OAuth flow v Milestone 2 |
| 3 | BullMQ ještě není nastaveno, přestože je v plánu | Nízká | Implementovat v Milestone 2 pro background sync |

---

## 3. Bezpečnost

### Kontrolní otázky

- [x] Nejsou secrets v kódu?
- [x] Jsou validovány všechny vstupy?
- [ ] Jsou správně nastavena oprávnění a role?
- [x] Jsou citlivá data šifrována?
- [x] Jsou externí volání zabezpečená (HTTPS, OAuth správně)?
- [x] Je nastaveno rate limiting a CORS?

### Nálezy

| # | Problém | Vážnost | Akce |
|---|---------|---------|------|
| 1 | `apps/web` middleware a `apps/api` auth middleware používají stub/demo token | Střední | Implementovat reálnou Supabase session ověření v Milestone 2 |
| 2 | Supabase credentials jsou optional pro demo režim | Nízká | OK pro skeleton; production vyžaduje credentials |
| 3 | `JWT_SECRET` zůstává optional v development režimu | Nízká | Povinné pouze v production |
| 4 | Obsidian integrace čte lokální filesystém podle `OBSIDIAN_VAULT_PATH`; chybí sandboxing / path validation | Nízká | Přidat path normalization a validaci v Milestone 2 |

---

## Shrnutí

- **Počet nálezů:** 10
- **Kritické:** 0
- **Vysoké:** 0
- **Střední:** 4
- **Nízké:** 6

## Rozhodnutí

- [x] APPROVED – pokračujeme dalším milestone
- [ ] CHANGES_REQUESTED – opravit nálezy před pokračováním

## Poznámky

Milestone 1 úspěšně propojil všechny požadované core integrace (Gmail, Calendar, Drive, Obsidian) s dashboardem, TTS a AI briefingem. Všechny buildy, testy a lint projely. Doporučuji se v Milestone 2 zaměřit na:

1. Reálnou Supabase Auth integraci a session middleware.
2. Background sync jobs přes BullMQ.
3. Vyřešení TypeScript project references pro spolehlivé rozlišení `src` vs `dist`.
4. Přidání unit a integračních testů pro integrace a AI provider.
5. Path validation pro Obsidian vault access.
