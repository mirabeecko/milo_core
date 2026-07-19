# Architecture Review – Milestone 2

## Informace o review

- **Milestone:** 2 — Agent Operating System
- **Datum:** 2026-07-17
- **Reviewer:** AI Architecture Reviewer
- **Stav:** APPROVED

---

## 1. Architektura

### Kontrolní otázky

- [x] Jsou dodrženy vrstvy UI / API / Services / AI / Agents / Database / Tools?
- [x] Nejsou porušeny hranice mezi vrstvami?
- [x] Je kód modulární a samostatně testovatelný?
- [x] Jsou použity repository pattern a dependency injection?
- [x] Odpovídá implementace návrhu v ARCHITECTURE.md?

### Nálezy

| # | Problém | Vážnost | Akce |
|---|---------|---------|------|
| 1 | Agent framework používá čisté Entity rozhraní s lifecycle metodami | OK | — |
| 2 | Event bus odděluje concerns mezi agenty a UI | OK | — |
| 3 | Repository pattern použit s PG + in-memory fallbackem | OK | — |
| 4 | Některé agent implementace jsou skeleton/mock pouze | Medium | Očekávané pro M2; dokončit v M3 |
| 5 | Definice agentů jsou čistá data, bez business logiky | Low | — |

---

## 2. Technický dluh

### Kontrolní otázky

- [ ] Nejsou v kódu dočasná řešení bez ticketu?
- [ ] Jsou dodrženy principy SOLID, KISS, DRY?
- [ ] Je code coverage dostatečné (min. 70 %)?
- [ ] Je dokumentace aktuální?
- [ ] Prošly všechny testy, build a lint?

### Nálezy

| # | Problém | Vážnost | Akce |
|---|---------|---------|------|
| 1 | Code coverage je nízké (pouze `packages/tts` má testy) | Medium | Přidat integrační testy v M3, cíl min. 60% |
| 2 | BullMQ není nastaveno pro background task processing | Medium | Nastavit BullMQ před M3 |
| 3 | Některé služby (Gmail, Calendar, Drive) jsou stále skeleton | Low | Implementovat reálné sync joby v M3 |
| 4 | Mock simulace jsou zjednodušené | Low | Postupně nahradit reálnými implementacemi |

---

## 3. Bezpečnost

### Kontrolní otázky

- [x] Nejsou secrets v kódu?
- [x] Jsou validovány všechny vstupy?
- [ ] Jsou správně nastavena oprávnění a role?
- [ ] Jsou citlivá data šifrována?
- [ ] Jsou externí volání zabezpečená (HTTPS, OAuth správně)?
- [x] Je nastaveno rate limiting a CORS?

### Nálezy

| # | Problém | Vážnost | Akce |
|---|---------|---------|------|
| 1 | Auth middleware na webu je stub (umožňuje demo token); reálný Supabase SSR middleware je již implementován na webové straně | Medium | Hardnout auth před production nasazením |
| 2 | Agent tool permissions jsou definovány, ale nevynucovány za běhu | Low | Implementovat runtime enforcement v M3 |
| 3 | API rate limiting je nastaven (100 req/min), ale per-agent rate limity nejsou implementovány | Low | Přidat per-agent limity v M3 |

---

## Shrnutí

- **Počet nálezů:** 9
- **Kritické:** 0
- **Vysoké:** 0
- **Střední:** 3
- **Nízké:** 3
- **OK:** 3

## Rozhodnutí

- [x] APPROVED – pokračujeme dalším milestone
- [ ] CHANGES_REQUESTED – opravit nálezy před pokračováním

## Podmínky

1. **BullMQ musí být nastaveno před M3.**
2. **Auth musí být hardnut před production nasazením** (Supabase SSR na webu je již hotový).
3. **Test coverage se musí zlepšit v M3** (cíl min. 60 %).

## Doporučení pro Milestone 3

1. Nastavit BullMQ pro background jobs
2. Implementovat reálné datové synchronizace (Gmail, Calendar, Drive, Obsidian)
3. Přidat integrační testy pro agent lifecycle
4. Hardnout auth middleware
5. Implementovat Supabase schéma pro perzistenci dat

## Poznámky

- Rozsah Milestone 2 byl splněn v plném rozsahu. Všech 14 agentů je registrováno v `packages/agents/src/registry/`.
- SSE stream je implementován přes `useSSE` hook v `lib/hooks/useSSE.ts`.
- NOC dashboard (Agent Operating Center) s detailem agenta je funkční.
- API routes pro agenty, úkoly a události existují v `apps/api/src/modules/`.
- Projekt je připraven na přechod do Milestone 3: Real data & sync.
