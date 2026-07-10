# DR-2026-001: První Executive Board Meeting

**Status:** schváleno
**Datum:** 2026-07-08
**Předkladatel:** Chief Orchestrator
**Hlasování:** Jednomyslné (7/0/0) — všechny body konsensem

---

## Účastníci

| Agent | Oddělení | Status | Přítomen |
|-------|----------|--------|----------|
| Chief Orchestrator | OC | active | ✅ |
| Chief Architect | ARCH | active | ✅ |
| Chief Engineer | ENG | ready | ✅ |
| Chief Knowledge Officer | KNOW | active | ✅ |
| Chief Communications Officer | COMM | active | ✅ |
| Chief Operations Officer | OPS | ready | ✅ |
| Chief Quality Officer | QA | ready | ✅ |

## Agenda

1. Review Executive Backlogu
2. Identifikace blokátorů
3. Review navržených ADR
4. Potvrzení vlastnictví
5. První operativní mise

---

## Bod 1: Review Executive Backlogu

**Chief:** Předkládám Executive Backlog k revizi. Jsou v něm položky P0-P3 a nově navržené.

**ARCH:** P0-002 (ARCHITECTURE.md) je blokován absencí CONCEPTUAL_MODEL.md. Je hotový?

**KNOW:** CONCEPTUAL_MODEL.md je hotový. Předávám ARCH. Doporučuji ale nejdřív konzistenční review — já ho dělám jako svou první misi.

**ARCH:** Přijímám. Zařazuji P0-002 do aktivních misí.

**ENG:** P1-001 (OrchestrationProvider) čeká na P0-002. Bez architektury nemůžu stavět. Potřebuju minimálně kontrakty rozhraní.

**ARCH:** Souhlasím. Do ARCHITECTURE.md zahrnu OrchestrationProvider contract, MissionLifecycle contract a AgentRegistry contract jako první.

**QA:** P2-001 (testovací sada) závisí na P1-001. Bez implementace není co testovat. Navrhuji, abych zatím připravil testovací strategii a akceptační kritéria.

**OPS:** P1-004 a P1-005 (CI/CD, monitoring) nejsou blokované. Můžu začít hned — infrastructure-as-code, monitoring pipeline.

**COMM:** P0-004 (Telegram boty) není blokovaný. Začínám auditem.

**Rozhodnutí:** Backlog potvrzen bez změn. KNOW, COMM, OPS začínají okamžitě. ARCH začíná po KNOW review. ENG a QA čekají na ARCH.

---

## Bod 2: Identifikace blokátorů

| Blokátor | Blokuje | Řešení | Vlastník |
|----------|---------|--------|----------|
| CONCEPTUAL_MODEL.md — čeká na konzistenční review | ARCH | KNOW provede review do 48h | KNOW |
| ARCHITECTURE.md — čeká na KNOW review | ENG, QA | ARCH začne skeleton, doplní po KNOW | ARCH |
| OrchestrationProvider contract — čeká na ARCH | ENG | ARCH zahrne jako prioritu | ARCH |
| Žádný běžící agent runtime | Všechna oddělení | ENG po P1-001 | ENG |
| Dashboard tým potřebuje telemetrický kontrakt | Dashboard | OC definuje kontrakt (Phase 5) | OC |

**Neshoda:** Žádná. Všechna oddělení souhlasí s identifikovanými blokátory.

---

## Bod 3: Review navržených ADR

**Chief:** Na stole je 5 navržených ADR (0001-0005) a Framework Reuse Assessment (0011). Všechny jsou PROPOSED.

**ARCH:** Doporučuji schválit všechny jako PROPOSED — jsou konzistentní s Ústavou a Konceptuálním modelem. Formální APPROVED by měly dostat až po implementačním ověření.

**ENG:** ADR-0001 (monorepo) — stávající struktura už je pnpm workspace. Souhlasím. ADR-0003 (agent state machine) — stavový automat s 8 stavy. Existující typy v @milo/shared mají více stavů. Bude potřeba migrace nebo sladění.

**ARCH:** Zaznamenáno. ADR-0003 bude revidováno při implementaci — možná rozšíření stavů nebo mapování.

**KNOW:** ADR-0004 (Supabase) — už existuje Supabase projekt. Není to nové rozhodnutí, spíš potvrzení existujícího. Souhlasím.

**COMM:** ADR-0005 (MCP protokol) — MiLO_ISDS_MCP už je MCP server, google-docs-mcp taky. Praxe potvrzuje návrh. Souhlasím.

**QA:** ADR-0011 (framework reuse) je klíčové. Nestavíme orchestrátor od nuly. To zásadně mění ENG misi. Souhlasím.

**Rozhodnutí:** Všech 5 ADR + 0011 zůstávají PROPOSED. Board je jednomyslně podporuje. ARCH je převede na APPROVED po prvním implementačním ověření (P1-001 hotovo + QA validace).

---

## Bod 4: Potvrzení vlastnictví

| Doména | Vlastník | Potvrzeno |
|--------|----------|-----------|
| CONSTITUTION.md | Chief Architect (dozor) | ✅ |
| ORGANIZATION_CONSTITUTION.md | OC | ✅ |
| CONCEPTUAL_MODEL.md | KNOW | ✅ |
| ARCHITECTURE.md | ARCH | ✅ |
| ADR registr | ARCH | ✅ |
| organization-registry.json | ARCH | ✅ |
| Executive Backlog | OC | ✅ |
| Komunikační kanály | COMM | ✅ |
| Infrastruktura | OPS | ✅ |
| Kvalita a testy | QA | ✅ |
| Implementace | ENG | ✅ |

**Neshoda:** Žádná.

---

## Bod 5: První operativní mise

**Chief:** Navrhuji přiřadit první mise:

| ID | Název | Oddělení | Deadline |
|----|-------|----------|----------|
| M-KNOW-001 | Katalogizovat dokumenty + konzistenční review | KNOW | +7 dní |
| M-COMM-001 | Audit Telegram implementací | COMM | +7 dní |
| M-OPS-001 | Připravit infrastrukturu pro POC | OPS | +14 dní |
| M-ARCH-001 | Minimum architektury pro POC | ARCH | +14 dní |
| M-QA-001 | Akceptační kritéria pro POC | QA | +14 dní |
| M-ENG-001 | Připravit POC — bez exekuce | ENG | +21 dní |

**ENG:** M-ENG-001 — "připravit, nevykonat". To znamená jen specifikaci a návrh, žádná implementace?

**Chief:** Přesně. POC plán, kontrakty, závislosti. Implementace až po schválení Vlastníkem.

**QA:** M-QA-001 — akceptační kritéria. Potřebuju k tomu specifikaci od ENG a ARCH. Bez nich nemám proti čemu testovat.

**ARCH:** M-ARCH-001 doručí kontrakty do 14 dní. QA může začít paralelně s předběžnými kritérii.

**Rozhodnutí:** Všech 6 misí schváleno. Detailní specifikace misí budou vytvořeny Chiefem do 24h.

---

## Shrnutí rozhodnutí

1. Executive Backlog potvrzen beze změn.
2. KNOW, COMM, OPS začínají okamžitě. ARCH po KNOW review. ENG, QA po ARCH.
3. Všech 6 ADR zůstává PROPOSED s podporou Boardu.
4. Vlastnictví domén potvrzeno bez neshod.
5. 6 prvních misí přiřazeno.

## Otevřené otázky

1. **Migrace existujících stavů agenta** — @milo/shared má 25+ stavů, ADR-0003 navrhuje 8. ARCH + ENG musí vyřešit před implementací.
2. **Dashboard tým** — potřebuje telemetrický kontrakt. OC ho vytvoří jako samostatnou misi.
3. **OWNER APPROVAL** — všechny mise jsou read-only, žádná nemodifikuje kód. Přesto první file-modifying mise musí projít Owner approval.

## Příští meeting

Datum: +7 dní (2026-07-15)
Agenda: Status prvních misí, KNOW report, COMM audit report.

---

*Zapsal: Chief Orchestrator. Schváleno všemi členy Boardu.*
