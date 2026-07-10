# MiLO Organizational Bootstrap & Roadmap v1.0

**Status:** Strategický plán
**Autor:** Chief Orchestrator
**Datum:** 2026-07-08

---

## ČÁST 1: ORGANIZATIONAL BOOTSTRAP

### Bootstrap proces

Organizace MiLO je nyní definována. Existuje na papíře. Musí začít existovat v realitě.

Bootstrap probíhá v šesti vlnách:

#### Vlna 0 — Chief aktivuje první oddělení

**Co se děje:** Chief (momentálně vykonávaný Chief Orchestratorem — lidskou rolí, později agentem) aktivuje první tři oddělení v minimálním režimu.

**Oddělení ve vlně 0:**
- **ARCH** — vytvoří ARCHITECTURE.md, první sadu ADR
- **KNOW** — vytvoří CONCEPTUAL_MODEL.md, zaindexuje existující dokumenty
- **COMM** — převezme existující Telegram boty a sjednotí je

**Kritérium dokončení:** Každé oddělení má alespoň jednoho specialistu a dokončilo svůj první výstup.

#### Vlna 1 — Technický základ

**Co se děje:** ENG a OPS jsou aktivovány. ARCH předává specifikaci.

**Oddělení ve vlně 1:**
- **ENG** — implementuje core agent runtime (z MiLO_Core packages/agents)
- **OPS** — nastaví infrastrukturu, monitoring, zálohování

**Kritérium dokončení:** MiLO_Core monorepo běží, agent runtime je funkční, CI/CD pipeline aktivní.

#### Vlna 2 — Kvalita a integrace

**Co se děje:** QA je aktivováno. Všechna oddělení začínají spolupracovat.

**Oddělení ve vlně 2:**
- **QA** — definuje testovací strategii, spouští první testy
- **Všechna oddělení** — začínají používat IDR (Inter-Department Request)

**Kritérium dokončení:** První plně integrovaný release prošel QA a je nasazen OPS.

#### Vlna 3 — Oddělení vytvářejí specialisty

**Co se děje:** Každé oddělení vytváří své Specialist Agents podle specifikace v EXECUTIVE_BOARD_AND_DEPARTMENTS.md.

**Kritérium dokončení:** Každé oddělení má alespoň 2 specialisty. Department Lead deleguje >50 % práce.

#### Vlna 4 — Autonomie oddělení

**Co se děje:** Oddělení operují autonomně. Chief přechází z operativního řízení na strategické.

**Kritérium dokončení:** Chief řeší pouze eskalační případy (<5 % misí). Board meetingy jsou týdenní, ne denní.

#### Vlna 5 — Sebe-řízení

**Co se děje:** Organizace funguje samostatně. Chief je agent, ne člověk.

**Kritérium dokončení:** Vlastník zasahuje pouze při změně Ústavy nebo strategických cílech.

---

## ČÁST 2: INITIAL MISSIONS

### První mise pro každé oddělení

Každé oddělení dostává první misi. Splnění mise je podmínkou pro přechod do další vlny bootstrapu.

---

#### Mise ARCH-001: Vytvořit ARCHITECTURE.md

**Zadavatel:** Chief (Vlna 0)
**Vlastník:** ARCH Lead
**Cíl:** Vytvořit první verzi Architektonické specifikace MiLO.
**Výstupy:**
- ARCHITECTURE.md — minimálně kapitoly 1-6 podle struktury dokumentační architektury
- ADR-0001 až ADR-0005 — první architektonická rozhodnutí
- Technology Selection Report — výběr poskytovatelů pro LLM, databázi, MCP
**Termín:** 30 dní od aktivace
**Akceptační kritéria:** Dokumentace odpovídá Ústavě. Každá ADR má všechny povinné sekce.

---

#### Mise KNOW-001: Vytvořit CONCEPTUAL_MODEL.md

**Zadavatel:** Chief (Vlna 0)
**Vlastník:** KNOW Lead
**Cíl:** Vytvořit Konceptuální model MiLO — doménový jazyk, bounded contexts, vztahy entit.
**Výstupy:**
- CONCEPTUAL_MODEL.md — kompletní doménový model
- Zaindexované existující dokumenty (CONSTITUTION.md, ORGANIZATION_CONSTITUTION.md, EXECUTIVE_BOARD_AND_DEPARTMENTS.md)
- První verze Lessons Learned logu
**Termín:** 21 dní od aktivace
**Akceptační kritéria:** Každý termín z Ústavy je definován. Každý bounded context má jasné hranice.

---

#### Mise COMM-001: Sjednotit komunikační kanály

**Zadavatel:** Chief (Vlna 0)
**Vlastník:** COMM Lead
**Cíl:** Přejmout existující Telegram boty a sjednotit je pod jeden komunikační framework.
**Výstupy:**
- Audit existujících botů (MiLO_Agent, executive-ai, voice-ai-terminal)
- Plán migrace na jednotný komunikační framework
- Aktivní Telegram bot, přes kterého Vlastník komunikuje s MiLO
**Termín:** 14 dní od aktivace
**Akceptační kritéria:** Vlastník píše na jednoho bota. Zprávy jsou routovány správným oddělením.

---

#### Mise ENG-001: Integrovat orchestrační framework a postavit MiLO adaptér

**Zadavatel:** Chief (Vlna 1)
**Vlastník:** ENG Lead
**Cíl:** Integrovat existující orchestrační framework (LangGraph) a postavit MiLO-specifickou vrstvu — ne stavět orchestrátor od nuly.
**Výstupy:**
- `OrchestrationProvider` interface (abstrakce nad frameworkem)
- `LangGraphOrchestrationProvider` (primární implementace)
- `ConstitutionalValidationHook` — validace každého kroku proti Ústavě
- `DepartmentAccessControl` — oddělení vlastní své agenty, řízení přístupu
- `MissionSemantics` — plánování, zhodnocení, poučení (fáze mise)
- `ModelRouter` — provider abstraction s policy-based routing
- Základní testy
**Termín:** 30 dní od aktivace (místo původních 45 — stavíme méně)
**Akceptační kritéria:** Mise projde všemi 4 fázemi (plánování→provedení→zhodnocení→poučení). Každý krok je validován Ústavou. QA potvrzuje testy.

---

#### Mise OPS-001: Nastavit infrastrukturu

**Zadavatel:** Chief (Vlna 1)
**Vlastník:** OPS Lead
**Cíl:** Připravit produkční infrastrukturu pro MiLO.
**Výstupy:**
- Monitoring všech komponent
- Automatické zálohování (denně)
- CI/CD pipeline
- Incident response plán
**Termín:** 30 dní od aktivace
**Akceptační kritéria:** OPS dashboard ukazuje health všech komponent. Záloha byla úspěšně obnovena.

---

#### Mise QA-001: Definovat testovací strategii

**Zadavatel:** Chief (Vlna 2)
**Vlastník:** QA Lead
**Cíl:** Vytvořit a aplikovat testovací strategii na první release.
**Výstupy:**
- docs/testing/strategy.md
- Testovací sada pro Agent Runtime (unit + integrační)
- První quality report
**Termín:** 21 dní od aktivace
**Akceptační kritéria:** Kritické cesty jsou pokryty testy. Žádná regrese v prvním release.

---

## ČÁST 3: ORGANIZATIONAL ROADMAP

### Milníky

```
M0: Zakládací dokumenty hotovy                 ← JSME ZDE (2026-07-08)
    ✅ CONSTITUTION.md
    ✅ ORGANIZATION_CONSTITUTION.md
    ✅ EXECUTIVE_BOARD_AND_DEPARTMENTS.md
    ✅ BOOTSTRAP_AND_ROADMAP.md

M1: Konceptuální model hotov                   ← 21 dní
    ✅ CONCEPTUAL_MODEL.md
    ✅ První ADR sada (5 ADR)
    □ Zaindexované dokumenty

M2: Architektonická specifikace hotova          ← 30 dní
    ✅ ARCHITECTURE.md (části 1-6)
    ✅ Technology Selection Report

M3: Komunikační kanály sjednoceny               ← 14 dní (paralelně s M1-M2)
    ✅ Jednotný Telegram bot
    □ Migrace existujících botů

M4: Agent Runtime — MiLO adaptér + framework        ← 30 dní (po M2)
    ✅ AgentManager + ExecutionTaskRunner
    □ 3+ nástroje, testy

M5: Infrastruktura připravena                   ← 30 dní (paralelně s M4)
    ✅ Monitoring, zálohování, CI/CD
    □ Incident response plán

M6: První integrovaný release                   ← 60 dní (po M4+M5)
    ✅ Všechna oddělení spolupracují
    □ QA approved, OPS deployed

M7: Oddělení autonomní                          ← 120 dní
    □ Každé oddělení má ≥2 specialisty
    □ Chief deleguje >50 % rozhodnutí

M8: MiLO v produkci                             ← 180 dní
    □ Vlastník používá MiLO denně
    □ Organizace řeší většinu věcí bez Vlastníka
```

### Kritická cesta

```
M0 → M1 → M2 → M4 → M6 → M7 → M8
         ↘ M3 (paralelně)
         ↘ M5 (paralelně)
```

### Rizika

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|----------------|-------|----------|
| ARCH a ENG se neshodnou na specifikaci | Střední | Vysoký | ADR proces, Chief jako arbitr |
| Existující projekty blokují migraci | Vysoká | Střední | Postupná migrace, staré projekty v maintenance modu |
| Nedostatek výpočetních zdrojů | Nízká | Střední | Lokální Ollama jako fallback |
| Vlastník ztratí zájem | Nízká | Kritický | Pravidelný reporting, viditelné výsledky |
| Klíčový agent selže | Střední | Vysoký | Bus factor ≥ 2 pro každou kritickou funkci |

---

## ČÁST 4: EXECUTIVE BACKLOG

### Prioritizace backlogu

Priorita 0 (MUSÍ — blokuje M1):
- P0-001: Vytvořit CONCEPTUAL_MODEL.md (KNOW) — effort M, závislost: žádná, výstup: dokument
- P0-002: Vytvořit ARCHITECTURE.md kapitoly 1-6 (ARCH) — effort L, závislost: P0-001, výstup: dokument
- P0-003: Zapsat ADR-0001 až ADR-0005 (ARCH) — effort M, závislost: P0-002, výstup: 5 ADR
- P0-004: Sjednotit Telegram boty (COMM) — effort M, závislost: žádná, výstup: běžící bot

Priorita 1 (MĚLO BY — blokuje M4):
- P1-001: Implementovat OrchestrationProvider interface a LangGraph adaptér (ENG) — effort L, závislost: P0-002, výstup: kód
- P1-002: Implementovat ConstitutionalValidationHook (ENG) — effort M, závislost: P1-001, výstup: kód
- P1-003: Implementovat MissionSemantics — fáze mise (ENG) — effort L, závislost: P1-001, výstup: kód
- P1-004: Nastavit CI/CD (OPS) — effort M, závislost: žádná, výstup: pipeline
- P1-005: Nastavit monitoring (OPS) — effort M, závislost: žádná, výstup: dashboard

Priorita 2 (MOHLO BY — zlepšuje kvalitu):
- P2-001: Vytvořit testovací sadu pro Agent Runtime (QA) — effort L, závislost: P1-001, výstup: testy
- P2-002: Zaindexovat všechny existující dokumenty (KNOW) — effort M, závislost: P0-001, výstup: index
- P2-003: Vytvořit Lessons Learned log (QA) — effort S, závislost: žádná, výstup: log

Priorita 3 (BONUS — zrychluje budoucí práci):
- P3-001: Automatizovat tvorbu ADR šablon (ARCH) — effort S, výstup: skript
- P3-002: Vytvořit Developer Guide (ENG) — effort M, výstup: dokumentace
- P3-003: Integrovat MiLO_ISDS_MCP (COMM) — effort M, výstup: integrace
- P3-004: Připravit Deployment Guide (OPS) — effort S, výstup: dokumentace

---

## ČÁST 5: SELF-BUILDING STRATEGY

### Princip

MiLO musí postupně převzít odpovědnost za svůj vlastní vývoj.

Dnes: Chief (člověk/agent) řídí vše.

Zítra: Oddělení řídí své domény. Chief koordinuje.

Pozítří: Organizace funguje samostatně. Vlastník jen definuje cíle.

### Co se deleguje jako první

1. **Dokumentace** — KNOW přebírá veškerou dokumentaci. Ostatní oddělení jen dodávají obsah.
2. **Monitoring** — OPS přebírá health checks. Chief už nekontroluje logy.
3. **Testování** — QA přebírá veškeré ověřování. ENG už netestuje vlastní kód.
4. **Komunikace** — COMM přebírá všechny kanály. Chief už neodpovídá na zprávy.
5. **Implementace** — ENG přebírá vývoj. ARCH už nepíše kód.

### Kdy vzniká nové oddělení

Nové oddělení vzniká, když:
- Existuje doména, která nezapadá do žádného existujícího oddělení.
- Doména vyžaduje specializované znalosti, které přesahují možnosti specialistů.
- Objem práce v doméně je dostatečný pro samostatné oddělení (>20 % kapacity organizace).

Proces:
1. Postřeh → Lessons Learned nebo Department Lead návrh.
2. RFC → návrh nového oddělení s chartou.
3. Board → schválení nebo zamítnutí.
4. Bootstrap → nové oddělení prochází vlastní bootstrap vlnou.

### Kdy vzniká Specialist Agent

Specialist Agent vzniká, když:
- Department Lead identifikuje opakující se práci.
- Práce vyžaduje specializaci (obecný Worker Agent nestačí).
- Práce je dostatečně objemná pro samostatného agenta (>10 % kapacity oddělení).

Specialista je trvalý — na rozdíl od Worker Agenta, který zaniká po misi.

### Kdy vzniká Worker Agent

Worker Agent vzniká pro každou misi, která:
- Je jednorázová.
- Nevyžaduje specializované znalosti nad rámec mise.
- Může být dokončena jedním agentem.

Worker Agent po dokončení mise:
- Předá všechny znalosti KNOW.
- Je deaktivován.
- Jeho definice je archivována pro případné budoucí použití.

### Metriky sebe-stavby

| Metrika | Dnes | Cíl M4 | Cíl M8 |
|---------|------|--------|--------|
| Rozhodnutí Chiefa / den | Vše | <10 | <3 |
| Autonomie oddělení | 0 % | 50 % | 90 % |
| Specialisté na oddělení | 0 | 1 | ≥2 |
| Worker agentů vytvořených organizací | 0 | 5 | 50+ |
| Dokumentace vytvořená lidmi | 100 % | 50 % | 10 % |

---

## ČÁST 6: EXECUTIVE SUMMARY

### Dokumenty vytvořené touto misí

| Dokument | Fáze |
|----------|------|
| `docs/rfc/0001-rc3-organizational-constitution.md` | Fáze 1 — RC3 Amendment Proposal |
| `ORGANIZATION_CONSTITUTION.md` | Fáze 2 — Organizační ústava |
| `docs/board/EXECUTIVE_BOARD_AND_DEPARTMENTS.md` | Fáze 3-5 — Board, Department Charters, Agent Specs |
| `docs/board/BOOTSTRAP_AND_ROADMAP.md` (tento dokument) | Fáze 6-10 — Bootstrap, Mise, Roadmap, Backlog, Self-Building |
| `docs/adr/0011-framework-reuse-assessment.md` | Korekce — Framework Reuse Assessment |

### Organizační struktura — shrnutí

```
VLASTNÍK
  │
CHIEF (Chief Orchestrator)
  │
EXECUTIVE BOARD (Chief + 7 Department Leadů)
  │
  ├── OC  — Office of the Chief (strategie, koordinace)
  ├── ARCH — Architecture (návrh, ADR, standardy)
  ├── ENG  — Engineering (vývoj, údržba)
  ├── KNOW — Knowledge (paměť, učení, dokumenty)
  ├── COMM — Communications (kanály, zprávy)
  ├── OPS  — Operations (infrastruktura, monitoring)
  └── QA   — Quality (testování, revize, metriky)
```

### Stav po dokončení bootstrap mise

- Organizace MiLO je plně definována.
- Ústava a Organizační ústava tvoří neměnný základ.
- Každé oddělení má chartu, KPI a specifikaci vedoucího agenta.
- Bootstrap plán popisuje cestu od papírové organizace k fungujícímu systému.
- 4 počáteční mise jsou připraveny k exekuci.
- Backlog prioritizuje práci na nejbližších 180 dní.

### Zbývající architektonická rizika

1. **Závislost na lidském Chiefovi.** Dokud není Chief plně agentní, organizace závisí na lidské dostupnosti. Mitigace: důsledná dokumentace, bus factor ≥ 2.

2. **Migrace existujících projektů.** MiLO_Agent, executive-ai a voice-ai-terminal běží v produkci. Jejich migrace pod COMM musí být postupná a bezvýpadková.

3. **Technologická nezralost.** Agent runtime v MiLO_Core je částečně implementován. S framework reuse (ADR-0011) se staví jen MiLO-specifická vrstva — riziko sníženo.

4. **Organizační inflace.** 7 oddělení na začátku může být příliš mnoho. Pokud se ukáže, že některé oddělení nemá dost práce, mělo by být sloučeno.

### Doporučený další krok

**Fáze: Implementace konceptuálního modelu.**

KNOW Department by měl jako první misi vytvořit CONCEPTUAL_MODEL.md — doménový model, který bude základem pro ARCH a všechny další technické dokumenty.

Poté ARCH vytvoří ARCHITECTURE.md a první ADR. Teprve pak ENG začne implementovat.
