# A — INFO ABOUT — ALL DOCUMENTS

**Centrální registr veškeré dokumentace ekosystému MiLO.**
**Tento soubor je zdrojem pravdy o stavu dokumentace.**
**Každý nový dokument MUSÍ být zaregistrován zde.**

> Naposledy aktualizováno: 2026-07-08
> Verze registru: 1.0
> SHA256 tohoto souboru při poslední validaci: (spustit `scripts/validate-docs.sh`)

---

## Jak zajistit, aby byl tento registr vždy aktuální

### Mechanismus č. 1 — Pre-commit hook (automatický)

Soubor `scripts/validate-docs.sh` porovnává tento registr se skutečným obsahem `/docs`.
Hook `pre-commit` ho spouští automaticky.

Pokud registr neodpovídá skutečnosti, commit je odmítnut s přesnou zprávou, co chybí.

Instalace:

```bash
cp scripts/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### Mechanismus č. 2 — CI kontrola (blokující)

GitHub Actions workflow `.github/workflows/docs-validation.yml` spouští validaci při každém push.

Pokud registr neodpovídá, build selže s červenou vlajkou. Není možné merge-nout PR, který přidává soubor do `/docs` bez registrace.

### Mechanismus č. 3 — Konvence (lidská)

Každý, kdo vytvoří nový dokument v `/docs`, přidá řádek do tohoto registru ve stejném commitu.

Každý, kdo smaže dokument z `/docs`, smaže odpovídající řádek z tohoto registru ve stejném commitu.

Pull request, který mění `/docs` ale nemění tento soubor, je automaticky označen jako nekompletní.

### Co se stane, když registr zastará

1. Pre-commit hook odmítne commit.
2. CI pipeline selže.
3. PR nemůže být merge-nut.
4. Pokud i přesto dojde k desynchronizaci, `scripts/validate-docs.sh --fix` vygeneruje diff ukazující, co přesně se změnilo.

---

## Kategorizace dokumentů

Každý dokument má jeden z těchto statusů:

| Status | Význam |
|--------|--------|
| ✅ HOTOVO | Dokument existuje a odpovídá aktuálnímu stavu systému. |
| 🔨 ROZPRACOVÁNO | Dokument se píše, není finální. |
| 📋 PLÁNOVÁNO | Dokument je navržen v architektuře dokumentace, ještě nevznikl. |
| ⚠️ ZASTARALÉ | Dokument existuje, ale neodpovídá aktuálnímu stavu. Je třeba ho aktualizovat nebo archivovat. |
| 🗄️ ARCHIVOVÁNO | Dokument byl vyřazen, ale zůstává dostupný pro historické účely. |

---

## Přehled všech dokumentů

### Úroveň 0 — Ústava

| # | Dokument | Cesta | Status | Poslední změna | SHA256 |
|---|----------|-------|--------|---------------|--------|
| 1 | Ústava MiLO v1.0 | `CONSTITUTION.md` | ✅ HOTOVO | 2026-07-08 | — |

| Vlastnost | Hodnota |
|-----------|---------|
| Účel | Nejvyšší autorita ekosystému. Definuje CO a PROČ. |
| Publikum | Všichni — vývojáři, architekti, vlastník. |
| Závislosti | Žádné. |
| Správce | Chief Architect |
| Frekvence změn | ≤ 1× za 5 let. Příští revize: ≤ 2031. |
| Typ | Normativní |
| Autorita | Vítězí nad všemi ostatními dokumenty. |
| Formát | Markdown (EN: CZ) |

---

### Úroveň 1 — Konceptuální model

| # | Dokument | Cesta | Status | Poslední změna | SHA256 |
|---|----------|-------|--------|---------------|--------|
| 2 | Konceptuální model MiLO | `CONCEPTUAL_MODEL.md` | 📋 PLÁNOVÁNO | — | — |

| Vlastnost | Hodnota |
|-----------|---------|
| Účel | Definuje doménový jazyk — entity, bounded contexts, vztahy, stavové diagramy. Je to slovník a mapa domény. |
| Publikum | Architekti, vývojáři. |
| Závislosti | CONSTITUTION.md (kapitoly 1, 3, 4, 9, 10, 11) |
| Správce | Chief Architect |
| Frekvence změn | ≤ 1× ročně |
| Typ | Normativní |
| Autorita | Vítězí nad ARCHITECTURE.md. Prohrává s CONSTITUTION.md. |
| Formát | Markdown + Mermaid diagramy (EN: CZ) |
| Předpoklady | Konsolidační plán, identifikace bounded contexts, rozhodnutí o primárním jazyce modelu |

---

### Úroveň 2 — Architektonická specifikace

| # | Dokument | Cesta | Status | Poslední změna | SHA256 |
|---|----------|-------|--------|---------------|--------|
| 3 | Architektonická specifikace | `ARCHITECTURE.md` | 📋 PLÁNOVÁNO | — | — |

| Vlastnost | Hodnota |
|-----------|---------|
| Účel | Rozpracovává Ústavu do konkrétní architektury — vrstvy, rozhraní, komunikační vzory, perzistence, bezpečnostní model, cílové hodnoty metrik. |
| Publikum | Architekti, senior vývojáři. |
| Závislosti | CONSTITUTION.md, CONCEPTUAL_MODEL.md |
| Správce | Chief Architect + kdokoli s ADR schvalovacím právem |
| Frekvence změn | ≤ 2× ročně (pouze přes ADR proces) |
| Typ | Normativní |
| Autorita | Vítězí nad implementační dokumentací. Prohrává s CONCEPTUAL_MODEL.md. |
| Formát | Markdown + Mermaid (EN: CZ) |

---

### Úroveň 2 — ADR (Architecture Decision Records)

| # | Dokument | Cesta | Status | Poslední změna | SHA256 |
|---|----------|-------|--------|---------------|--------|
| — | ADR index | `docs/adr/README.md` | 📋 PLÁNOVÁNO | — | — |
| — | ADR-0001: Struktura monorepa | `docs/adr/0001-monorepo-structure.md` | 📋 PLÁNOVÁNO | — | — |
| — | ADR-0002: DDD + hexagonální | `docs/adr/0002-ddd-hexagonal.md` | 📋 PLÁNOVÁNO | — | — |
| — | ADR-0003: Agent state machine | `docs/adr/0003-agent-state-machine.md` | 📋 PLÁNOVÁNO | — | — |
| — | ADR-0004: Supabase jako sdílená DB | `docs/adr/0004-supabase-shared-db.md` | 📋 PLÁNOVÁNO | — | — |
| — | ADR-0005: MCP jako protokol nástrojů | `docs/adr/0005-mcp-tool-protocol.md` | 📋 PLÁNOVÁNO | — | — |
| — | ADR-0006: Telegram jako primární UI | `docs/adr/0006-telegram-primary-ui.md` | 📋 PLÁNOVÁNO | — | — |
| — | ADR-0007: Čeština jako primární jazyk | `docs/adr/0007-czech-primary-language.md` | 📋 PLÁNOVÁNO | — | — |
| — | ADR-0008: Provider abstraction | `docs/adr/0008-provider-abstraction.md` | 📋 PLÁNOVÁNO | — | — |
| — | ADR-0009: Prompt composition model | `docs/adr/0009-prompt-composition.md` | 📋 PLÁNOVÁNO | — | — |
| — | ADR-0010: Event sourcing pro audit | `docs/adr/0010-event-sourcing-audit.md` | 📋 PLÁNOVÁNO | — | — |

| Vlastnost | Hodnota |
|-----------|---------|
| Účel | Zaznamenat jedno architektonické rozhodnutí — problém, volbu, alternativy, důsledky, datum revize. |
| Publikum | Architekti, vývojáři. |
| Závislosti | ARCHITECTURE.md, CONCEPTUAL_MODEL.md |
| Správce | Autor ADR |
| Frekvence změn | Neměnné po schválení. Revize vytváří nové ADR. |
| Typ | Normativní |
| Autorita | Novější ADR vítězí nad starší verzí ARCHITECTURE.md. |
| Formát | Markdown (EN: CZ), šablona: `docs/adr/TEMPLATE.md` |

---

### Úroveň 2 — RFC (Request for Comments)

| # | Dokument | Cesta | Status | Poslední změna | SHA256 |
|---|----------|-------|--------|---------------|--------|
| — | RFC index | `docs/rfc/README.md` | 📋 PLÁNOVÁNO | — | — |

| Vlastnost | Hodnota |
|-----------|---------|
| Účel | Navrhnout změnu architektury před schválením. Po schválení → ADR. Po zamítnutí → archiv. |
| Publikum | Architekti, vývojáři. |
| Závislosti | ARCHITECTURE.md |
| Správce | Autor RFC |
| Frekvence změn | Aktivní během diskuse, zmrazené po rozhodnutí. |
| Typ | Dočasné — nikdy normativní. |
| Autorita | Žádná. RFC je návrh, ne pravidlo. |
| Formát | Markdown (EN: CZ) |

---

### Úroveň 3 — Implementační dokumentace

| # | Dokument | Cesta | Status | Poslední změna | SHA256 |
|---|----------|-------|--------|---------------|--------|
| 4 | API dokumentace — REST | `docs/api/rest-api.md` | 📋 PLÁNOVÁNO | — | — |
| 5 | API dokumentace — MCP nástroje | `docs/api/mcp-tools.md` | 📋 PLÁNOVÁNO | — | — |
| 6 | API dokumentace — WebSocket | `docs/api/websocket.md` | 📋 PLÁNOVÁNO | — | — |
| 7 | Bezpečnostní model | `docs/security/threat-model.md` | 📋 PLÁNOVÁNO | — | — |
| 8 | Incident response | `docs/security/incident-response.md` | 📋 PLÁNOVÁNO | — | — |
| 9 | Handling citlivých dat | `docs/security/data-handling.md` | 📋 PLÁNOVÁNO | — | — |
| 10 | Monitoring a alerting | `docs/operations/monitoring.md` | 📋 PLÁNOVÁNO | — | — |
| 11 | Zálohování a disaster recovery | `docs/operations/backup-recovery.md` | 📋 PLÁNOVÁNO | — | — |
| 12 | Deployment cíle a konfigurace | `docs/operations/deployment-targets.md` | 📋 PLÁNOVÁNO | — | — |
| 13 | Testovací strategie | `docs/testing/strategy.md` | 📋 PLÁNOVÁNO | — | — |
| 14 | Kódovací standardy — TypeScript | `docs/coding-standards/typescript.md` | 📋 PLÁNOVÁNO | — | — |
| 15 | Kódovací standardy — Python | `docs/coding-standards/python.md` | 📋 PLÁNOVÁNO | — | — |
| 16 | Kódovací standardy — Git | `docs/coding-standards/git.md` | 📋 PLÁNOVÁNO | — | — |

| Vlastnost (API) | Hodnota |
|-----------------|---------|
| Účel | Popis všech endpointů, MCP nástrojů, formátů zpráv, autentizace. |
| Publikum | Vývojáři, integrátoři. |
| Správce | Vývojáři (generováno z kódu kde to jde). |
| Typ | Informativní (popisuje stav, neurčuje ho). |

| Vlastnost (Bezpečnost) | Hodnota |
|------------------------|---------|
| Účel | Bezpečnostní model, hrozby, audity, OAuth, handling tajemství. |
| Publikum | Vývojáři, auditoři. |
| Správce | Security owner. |
| Typ | Normativní pro bezpečnostní praxi. |

| Vlastnost (Provozní) | Hodnota |
|----------------------|---------|
| Účel | Monitoring, zálohování, disaster recovery, konkrétní cíle metrik. |
| Publikum | Operations, vývojáři. |
| Správce | Operations owner. |
| Typ | Normativní pro provozní praxi. |

| Vlastnost (Testování) | Hodnota |
|-----------------------|---------|
| Účel | Úrovně testování, nástroje, coverage cíle, testovací data, CI/CD. |
| Publikum | Vývojáři. |
| Správce | Tech Lead. |
| Typ | Normativní pro testovací praxi. |

| Vlastnost (Standardy) | Hodnota |
|-----------------------|---------|
| Účel | Konvence pro jazyky, commity, review. |
| Publikum | Vývojáři. |
| Správce | Tech Lead. |
| Typ | Normativní. |

---

### Úroveň 3 — Vývojářské příručky

| # | Dokument | Cesta | Status | Poslední změna | SHA256 |
|---|----------|-------|--------|---------------|--------|
| 17 | Vývojářská příručka — setup | `docs/developer-guide/setup.md` | 📋 PLÁNOVÁNO | — | — |
| 18 | Vývojářská příručka — přidání agenta | `docs/developer-guide/adding-agent.md` | 📋 PLÁNOVÁNO | — | — |
| 19 | Vývojářská příručka — přidání nástroje | `docs/developer-guide/adding-tool.md` | 📋 PLÁNOVÁNO | — | — |
| 20 | Deployment — macOS | `docs/deployment/macos.md` | 📋 PLÁNOVÁNO | — | — |
| 21 | Deployment — Docker | `docs/deployment/docker.md` | 📋 PLÁNOVÁNO | — | — |
| 22 | Deployment — Ubuntu VPS | `docs/deployment/vps.md` | 📋 PLÁNOVÁNO | — | — |

| Vlastnost | Hodnota |
|-----------|---------|
| Účel | Praktické návody pro vývojáře. |
| Publikum | Vývojáři. |
| Správce | Kdokoli (průběžně). |
| Typ | Informativní. |

---

### Úroveň 4 — Uživatelská dokumentace

| # | Dokument | Cesta | Status | Poslední změna | SHA256 |
|---|----------|-------|--------|---------------|--------|
| 23 | Uživatelská příručka — Telegram | `docs/user-guide/telegram.md` | 📋 PLÁNOVÁNO | — | — |
| 24 | Uživatelská příručka — Hlas | `docs/user-guide/voice.md` | 📋 PLÁNOVÁNO | — | — |
| 25 | Uživatelská příručka — Dashboard | `docs/user-guide/dashboard.md` | 📋 PLÁNOVÁNO | — | — |

| Vlastnost | Hodnota |
|-----------|---------|
| Účel | Jak používat MiLO — Telegram, hlas, dashboard, konfigurace agentů, autonomie. |
| Publikum | Vlastník. |
| Správce | Kdokoli. |
| Typ | Informativní. |

---

## Existující dokumenty (před registrem)

Tyto dokumenty existovaly v MiLO_Core před zavedením registru. Budou absorbovány do nové struktury nebo archivovány.

| Dokument | Cesta | Status | Poznámka |
|----------|-------|--------|----------|
| Agent Safety Rules | `docs/AGENT_SAFETY_RULES.md` | ⚠️ ZASTARALÉ | Pravidla pro agenty. Bude absorbováno do `docs/security/`. |
| Milestone 0 Review | `docs/reviews/MILESTONE_0_REVIEW.md` | 🗄️ ARCHIVOVÁNO | Historický dokument, zachovat pro referenci. |
| Milestone 1 Review | `docs/reviews/MILESTONE_1_REVIEW.md` | 🗄️ ARCHIVOVÁNO | Historický dokument, zachovat pro referenci. |

---

## Externí dokumenty (mimo MiLO_Core)

Tyto dokumenty existují v jiných repozitářích, ale jsou součástí ekosystému MiLO.

| Dokument | Repozitář | Status | Poznámka |
|----------|-----------|--------|----------|
| MiLO_ISDS_MCP README | MiLO_ISDS_MCP | ✅ HOTOVO | MCP server pro datové schránky |
| google-docs-mcp README | google-docs-mcp | ✅ HOTOVO | Externí MCP server (npm balíček) |
| milo-os AGENTS.md | milo-os | ⚠️ ZASTARALÉ | Bude absorbováno do ARCHITECTURE.md |
| executive-ai README | executive-ai | ⚠️ ZASTARALÉ | Bude absorbováno |
| voice-ai-terminal README | voice-ai-terminal | ⚠️ ZASTARALÉ | Bude absorbováno |
| ai-project-manager README | ai-project-manager | ⚠️ ZASTARALÉ | Bude absorbováno |
| n8n workflows README | n8n | ✅ HOTOVO | Architektura agentic-os |
| obcanai README | obcanai | ✅ HOTOVO | Samostatný projekt, jiné publikum |

---

## Validační skript

Tento registr je validován skriptem `scripts/validate-docs.sh`.

Skript kontroluje:
1. Každý soubor uvedený v registru jako ✅ HOTOVO existuje na disku.
2. Každý soubor v `/docs`, který NENÍ v registru, je nahlášen jako neregistrovaný.
3. SHA256 hodnoty odpovídají (pokud jsou vyplněny).
4. Časová razítka poslední změny odpovídají git logu.

Spuštění:
```bash
./scripts/validate-docs.sh          # Kontrola
./scripts/validate-docs.sh --fix    # Vygeneruje diff ukazující, co změnit
./scripts/validate-docs.sh --update # Aktualizuje SHA256 a časová razítka
```

---

## Šablony

| Šablona | Cesta |
|---------|-------|
| ADR šablona | `docs/adr/TEMPLATE.md` |
| RFC šablona | `docs/rfc/TEMPLATE.md` |

---

*Tento registr je spravován automaticky (pre-commit + CI) a ručně (konvence).*
*Poslední validace registru: 2026-07-08.*
