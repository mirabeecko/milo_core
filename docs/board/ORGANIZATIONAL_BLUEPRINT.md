# MiLO Organizational Blueprint v1.0

**Autor:** Chief Orchestrator
**Datum:** 2026-07-08
**Status:** PROPOSED — čeká Board review

---

## FÁZE 1: EXECUTIVE CAPABILITY MATRIX

| Odd. | Účel | Vlastnictví | Zralost | Chybí | Závislosti | Verdikt |
|------|------|------------|---------|-------|------------|---------|
| **OC** | Strategie, koordinace, Vlastník | Chief | STŘEDNÍ | Automatické reporty, budget tracking, plánování | Všechna odd. | ✅ Trvalé |
| **ARCH** | Návrh, ADR, standardy | Chief Architect | NÍZKÁ | Aktivní ADR review, technology watch | KNOW (model) | ✅ Trvalé |
| **ENG** | Vývoj, údržba, nasazení | Chief Engineer | STŘEDNÍ | OrchestrationProvider, CI/CD, dep mgmt | ARCH, QA, OPS | ✅ Trvalé |
| **KNOW** | Paměť, dokumenty, vyhledávání | Chief Knowledge Officer | NÍZKÁ | Indexace, search, export, Lessons Learned | — | ✅ Trvalé |
| **COMM** | Kanály, zprávy, notifikace | Chief Comms Officer | NÍZKÁ | Sjednocený bot, channel mgmt, style engine | — | ✅ Trvalé |
| **OPS** | Infrastruktura, monitoring | Chief Ops Officer | NÍZKÁ | CI/CD, monitoring, backup automation | ENG | ✅ Trvalé |
| **QA** | Testování, revize, metriky | Chief Quality Officer | NÍZKÁ | Test suite, review proces, quality dashboard | ENG | ✅ Trvalé |

**Závěr:** Všech 7 oddělení je trvalých. Žádné není kandidátem na sloučení nebo zrušení. Všechna mají jasnou doménu bez překryvu. Hlavní problém: 5 ze 7 oddělení má NÍZKOU zralost — existují jen na papíře.

---

## FÁZE 2: DEPARTMENT CHARTERS

### OC — Office of the Chief

**Mise:** Zajistit, aby MiLO jako celek naplňoval Ústavu a sloužil Vlastníkovi.

**Odpovědnosti:** Definovat strategické cíle. Alokovat rozpočet mezi oddělení. Reprezentovat MiLO vůči Vlastníkovi (měsíční report). Řešit konflikty mezi odděleními. Udržovat Organizační ústavu.

**Pravomoci:** Vetovat rozhodnutí v rozporu s Ústavou. Přerozdělit rozpočet. Jmenovat/odvolat Department Leady (s Boardem).

**Hranice:** Nesmí řídit jednotlivé mise. Nesmí rozhodovat o technické implementaci bez ARCH. Nesmí měnit Ústavu bez Vlastníka.

**KPI:** Spokojenost Vlastníka ≥ 4/5. Eskalace na OC ≤ 5 % misí. Rozpočtová odchylka ≤ 15 %. Doba odezvy na eskalaci ≤ 4h.

**Vstupy:** Cíle od Vlastníka, reporty oddělení, eskalační požadavky.

**Výstupy:** Měsíční Executive Report, kvartální rozpočet, strategická rozhodnutí.

**Eskalace:** Na Vlastníka při: narušení Ústavy, rozpočtové krizi, jednomyslném vetu Boardu.

**Kvalita:** Každé rozhodnutí → Decision Record. Každý report → verifikován KNOW.

**Schvalování:** Změna Ústavy → Owner ratifikace. Změna Org. ústavy → Board 2/3.

---

### ARCH — Architecture

**Mise:** Chránit architektonickou integritu MiLO. Zajistit nahraditelnost každé komponenty.

**Odpovědnosti:** Udržovat ARCHITECTURE.md. Spravovat ADR proces. Definovat technické standardy. Provádět Technology Selection. Validovat implementaci proti specifikaci.

**Pravomoci:** Blokovat změny porušující principy. Vyžádat RFC před implementací. Definovat povinné standardy pro ENG.

**Hranice:** Nesmí implementovat (ENG). Nesmí priorizovat (OC). Nesmí blokovat bez ADR.

**KPI:** Čas na výměnu poskytovatele (klesající). ADR pokrytí 100 %. Architektonický dluh 0. Konzistence implementace ≥ 95 %.

**Vstupy:** RFC od ostatních oddělení. Nové technologie. Implementační plány od ENG.

**Výstupy:** Schválená ADR. Technické standardy. Technology Selection Report. Revidovaná ARCHITECTURE.md.

**Eskalace:** ENG nerespektuje ADR → Chief. Vendor lock-in nalezen → Board.

---

### ENG — Engineering

**Mise:** Doručovat fungující software podle ARCH specifikace.

**Odpovědnosti:** Implementovat podle ARCH. Udržovat kód. Spravovat CI/CD. Spravovat závislosti. Dodržovat standardy.

**Pravomoci:** Rozhodovat o implementačních detailech. Refaktorovat. Odmítnout nerealistický termín.

**Hranice:** Nesmí měnit architekturu bez ADR. Nesmí nasazovat bez QA+OPS. Nesmí vybírat poskytovatele.

**KPI:** Počet souborů zasažených změnou (klesající). Doba merge→deploy (klesající). Incident rate (klesající). Pokrytí API dokumentací 100 %.

**Vstupy:** ARCH specifikace. Prioritizace od OC. Požadavky na opravy od OPS.

**Výstupy:** Funkční software. API dokumentace. Odhady pracnosti.

**Eskalace:** Blokující chyba v prod → OPS. Architektonický požadavek → ARCH. Nerealistický termín → Chief.

---

### KNOW — Knowledge

**Mise:** Udržovat organizační paměť. Zajistit znovupoužitelnost znalostí.

**Odpovědnosti:** Indexovat dokumenty. Spravovat vyhledávání. Udržovat CONCEPTUAL_MODEL.md. Spravovat Lessons Learned log. Zajišťovat exportovatelnost.

**Pravomoci:** Definovat standardy ukládání. Vyžadovat dokumentaci v předepsaném formátu.

**Hranice:** Nesmí mazat znalosti bez Vlastníka. Nesmí hodnotit důležitost.

**KPI:** Doba vyhledání ≤ 5s. Míra znovupoužití (rostoucí). Úplnost báze 100 %. Export ≤ 1h.

**Vstupy:** Dokumenty od všech oddělení. Decision Records. Lessons Learned.

**Výstupy:** Indexované znalosti. Výsledky vyhledávání. Terminologický report. Exporty.

---

### COMM — Communications

**Mise:** Spravovat všechny externí komunikační kanály.

**Odpovědnosti:** Spravovat Telegram, email, hlas. Udržovat styly a pravidla. Zajišťovat bezpečnost komunikace.

**Pravomoci:** Definovat aktivní kanály. Odmítnout zprávu porušující pravidla.

**Hranice:** Nesmí číst soukromé zprávy. Nesmí odeslat bez schválení (autonomie ≤ 3).

**KPI:** Doba doručení ≤ 30s. Přesnost stylu (rostoucí). Uptime kanálů ≥ 99.5 %. Incidenty 0.

**Vstupy:** Zprávy z kanálů. Styly a pravidla. Požadavky na odeslání.

**Výstupy:** Doručené zprávy. Odeslané zprávy. Komunikační reporty.

---

### OPS — Operations

**Mise:** Udržet MiLO v chodu 24/7.

**Odpovědnosti:** Spravovat infrastrukturu. Monitorovat. Zálohovat. Reagovat na incidenty.

**Pravomoci:** Restartovat komponenty. Vypnout nefunkční. Vynutit bezpečnostní patch.

**Hranice:** Nesmí měnit kód. Nesmí měnit architekturu. Nesmí číst obsah dat.

**KPI:** Uptime ≥ 99.5 %. RPO ≤ 1h. RTO ≤ 4h. Incident response ≤ 15min.

**Vstupy:** Monitoring data. Incidenty. Požadavky na nasazení.

**Výstupy:** Health reporty. Incident response. Zálohy. Nasazení.

---

### QA — Quality

**Mise:** Zajistit, že nic nekvalitního neprojde do produkce.

**Odpovědnosti:** Definovat testovací strategii. Provádět review. Měřit metriky kvality. Auditovat bezpečnost.

**Pravomoci:** Blokovat nasazení. Vyžádat přepracování. Spustit audit.

**Hranice:** Nesmí implementovat opravy. Nesmí blokovat >48h bez eskalace.

**KPI:** Chybovost v prod (klesající). Pokrytí testy 100 %. Regrese 0. Bezp. incidentů 0.

**Vstupy:** Kód k review. Nasazení ke schválení. Incidenty k analýze.

**Výstupy:** Výsledky testů. Code review. Quality reporty. Lessons Learned.

---

## FÁZE 3: ORGANIZAČNÍ ROZHRANÍ

### Komunikační matice

```
        │ OC  ARCH ENG  KNOW COMM OPS  QA
────────┼──────────────────────────────────
OC      │  —   ←R   ←R   ←R   ←R   ←R   ←R
ARCH    │ R→   —   S→   C→   —    —    —
ENG     │ R→  P←R   —   —    —   D←R  R←A
KNOW    │ R→   —    —    —    —    —    —
COMM    │ R→   —    —    —    —    —    —
OPS     │ R→   —   D→R   —    —    —    —
QA      │ R→   —   R←A   —    —    —    —
```

Legenda:
- **R→** Reportuje (týdně)
- **←R** Přijímá reporty
- **S→** Poskytuje specifikaci
- **P←R** Přijímá požadavek na změnu (RFC)
- **C→** Konzumuje (Conceptual Model)
- **D→R** Deployment request
- **D←R** Deployment response
- **R←A** Review & Approve
- **—** Žádná formální komunikace

### Kontrakty

| Od | Komu | Kontrakt | Formát | Frekvence |
|----|------|----------|--------|-----------|
| OC | Všem | Strategické cíle | Executive Report | Měsíčně |
| Všichni | OC | Department Report | Strukturovaný report | Týdně |
| ARCH | ENG | Architektonická specifikace | ARCHITECTURE.md + ADR | Průběžně |
| ARCH | Všem | Technické standardy | Coding standards | Kvartálně |
| ENG | ARCH | RFC (změna architektury) | RFC dokument | Na vyžádání |
| ENG | OPS | Deployment request | IDR | Na vyžádání |
| ENG | QA | Code review request | PR + testy | Na vyžádání |
| QA | ENG | Review result | Pass/Fail + findings | Do 48h |
| QA | OPS | Deployment gate | Approval/Block | Na vyžádání |
| OPS | ENG | Incident report | Incident ticket | Při incidentu |
| KNOW | Všem | Terminologický report | Report | Kvartálně |
| COMM | OC | Komunikační incident | Eskalace | Okamžitě |

---

## FÁZE 4: STAFFING STRATEGY

### Trvalí Specialisté (minimální sestava)

| Oddělení | Specialista | Role | Kdy vytvořit |
|----------|------------|------|-------------|
| OC | Strategy Analyst | Analyzuje trendy, připravuje podklady | Ihned (blokuje reporty) |
| OC | Owner Liaison | Připravuje reporty pro Vlastníka | Po Strategy Analyst |
| ARCH | Standards Architect | Udržuje technické standardy | Ihned |
| ARCH | ADR Reviewer | Reviduje ADR, hlídá termíny | Po prvních 5 ADR |
| ARCH | Technology Scout | Hodnotí nové poskytovatele | Kvartálně |
| ENG | Senior Developer | Implementuje klíčové komponenty | Po ARCH specifikaci |
| ENG | DevOps Agent | Spravuje CI/CD | Současně se Senior Dev |
| ENG | Dependency Manager | Sleduje závislosti | Po CI/CD |
| KNOW | Knowledge Curator | Klasifikuje a taguje | Ihned |
| KNOW | Search Specialist | Optimalizuje vyhledávání | Po zaindexování |
| COMM | Channel Manager | Spravuje kanály | Ihned |
| COMM | Style Keeper | Udržuje styly | Po Channel Manager |
| OPS | Infrastructure Monitor | Sleduje health | Ihned |
| OPS | Backup Manager | Spravuje zálohy | Po monitoringu |
| OPS | Incident Responder | Řeší incidenty | Při prvním incidentu |
| QA | Test Architect | Navrhuje testy | Po ENG implementaci |
| QA | Code Reviewer | Provádí review | Současně s Test Architect |

**Celkem: 17 Specialistů** (minimum pro fungující organizaci).

### Pravidla pro Workery

| Pravidlo | Hodnota |
|----------|---------|
| Kdo vytváří | Department Lead nebo Specialista |
| Maximální TTL | Doba trvání mise + 1 hodina |
| Znovupoužití | Nikdy — Worker je single-mission |
| Vlastnictví | Vytvářející oddělení |
| Review | QA při dokončení mise |
| Zánik | Automaticky po dokončení mise |

---

## FÁZE 5: MISSION FRAMEWORK

### Standardní specifikace mise

Každá mise v MiLO musí obsahovat:

```yaml
mission_id: M-{DEPT}-NNN
title: Jedna věta — co mise dokončí
objective: Konkrétní cíl
owner: Department Lead ID
department: ID oddělení
priority: critical | high | normal | low
autonomy_level: 0-4
inputs:
  - Co mise potřebuje ke spuštění
expected_outputs:
  - Co mise produkuje
dependencies:
  - ID mise nebo oddělení, na kterých závisí
risks:
  - Popis rizika + mitigace
acceptance_criteria:
  - Měřitelné kritérium (pass/fail)
quality_gate:
  reviewer: QA | Department Lead
  criteria: Co QA kontroluje
approval_policy:
  required: true | false
  approver: owner | chief | department_lead
  trigger: Kdy je approval potřeba
completion_evidence:
  - Důkaz, že mise byla dokončena
created: ISO timestamp
deadline: ISO timestamp
```

**Zákaz:** Žádné oddělení nesmí používat vlastní formát mise. Tento formát je autoritativní.

---

## FÁZE 6: CROSS-DEPARTMENT GOVERNANCE

### Pravidla koordinace

**1. ENG → ARCH: "Potřebuji změnu architektury"**
→ ENG podá RFC. ARCH review do 48h. Pokud ARCH blokuje → písemné ADR s odůvodněním. Pokud ENG nesouhlasí → eskalace na Chiefa.

**2. QA → ENG: "Implementace neprošla"**
→ QA vrátí s findings. ENG opraví do 48h. QA znovu review. Pokud 3x neprojde → eskalace na Chiefa.

**3. OPS → ENG: "Blokuji nasazení"**
→ OPS uvede důvod (monitoring, bezpečnost, infrastruktura). ENG odstraní blokátor. OPS odblokuje. Pokud spor → Chief.

**4. KNOW → Všichni: "Dokumentace nekonzistentní"**
→ KNOW reportuje. Vlastník dokumentu opraví do 7 dní. Pokud neopraví → KNOW eskaluje na Chiefa.

**5. COMM → Všichni: "Komunikační incident"**
→ COMM okamžitě eskaluje. Postižené oddělení reaguje do 1h. Incident report do 24h.

**6. OC → Všichni: "Změna strategie"**
→ OC oznámí s odůvodněním. Oddělení aktualizují plány do 7 dní. Board review po 14 dnech.

### Konfliktní matice

| Pokud | A | B | neshoda | Rozhoduje |
|-------|---|---|---------|-----------|
| ARCH blokuje ENG | ENG podá RFC | ARCH píše ADR | Chief |
| QA blokuje ENG | QA píše findings | ENG opravuje | Chief (po 3. Blokaci) |
| OPS blokuje ENG | OPS píše důvod | ENG odstraňuje | Chief |
| KNOW reportuje nekonzistenci | KNOW reportuje | Vlastník opravuje | Chief (po 7 dnech) |
| Dvě oddělení chtějí stejný rozpočet | — | — | Chief (alokace) |

---

## FÁZE 7: EXECUTIVE PERFORMANCE SYSTEM

### Metriky oddělení

| Odd. | Metrika | Cíl | Měřeno |
|------|---------|-----|--------|
| OC | Spokojenost Vlastníka | ≥ 4/5 | Měsíční survey |
| OC | Eskalace | ≤ 5 % misí | Automaticky |
| ARCH | ADR pokrytí | 100 % změn | Automaticky |
| ARCH | Čas na výměnu providera | Klesající | Test 1x kvartálně |
| ENG | Test coverage | ≥ 90 % | CI/CD |
| ENG | Incident rate | Klesající | OPS report |
| KNOW | Doba vyhledání | ≤ 5s | Automaticky |
| KNOW | Znovupoužití znalostí | Rostoucí | Automaticky |
| COMM | Uptime kanálů | ≥ 99.5 % | OPS monitoring |
| COMM | Přesnost stylu | Rostoucí | Owner feedback |
| OPS | Systémový uptime | ≥ 99.5 % | Automaticky |
| OPS | RTO | ≤ 4h | Test 1x kvartálně |
| QA | Regrese | 0 | CI/CD |
| QA | Chybovost v prod | Klesající | Automaticky |

### Metriky agentů

| Metrika | Měřeno | Cíl |
|---------|--------|-----|
| Mise dokončeno | Automaticky | Rostoucí trend |
| Mise včas | Automaticky | ≥ 80 % |
| Mise schváleno QA napoprvé | QA report | Rostoucí |
| Lessons Learned vytvořeno | KNOW report | ≥ 1 na misi |
| Doba odezvy | Automaticky | ≤ 4h |

### Zakázané metriky

- Počet commitů (gamifikace)
- Řádky kódu (odměňuje verbositu)
- Čas strávený v systému (odměňuje neefektivitu)
- Počet vytvořených agentů (odměňuje inflaci)

---

## FÁZE 8: ORGANIZAČNÍ SIMULACE

### Scénář 1: Nový požadavek od Vlastníka

**Vstup:** Vlastník: "Přidej podporu pro WhatsApp."

**Flow:**
1. OC → vytvoří strategický cíl → přiřadí COMM (nový kanál)
2. COMM → analyzuje požadavek → potřebuje ARCH (provider selection) + ENG (integrace)
3. COMM → IDR → ARCH: "Vyber WhatsApp providera"
4. ARCH → Technology Selection → ADR → doporučení
5. COMM → IDR → ENG: "Implementuj WhatsApp adapter"
6. ENG → implementuje → QA review → OPS nasadí
7. COMM → reportuje Vlastníkovi

**Problém:** COMM je úzké hrdlo — jediný vlastník kanálů. Pokud COMM dostane 3 požadavky současně, potřebuje Specialisty.

### Scénář 2: Kritický incident

**Vstup:** OPS detekuje výpadek API serveru.

**Flow:**
1. OPS → incident declared → notifikuje ENG + Chief
2. OPS → diagnostika → restart selhal → eskaluje ENG
3. ENG → analyzuje logy → nachází chybu v kódu → opravuje
4. QA → urgent review → schvaluje hotfix
5. OPS → nasazuje → ověřuje health
6. OPS → incident resolved → incident report → KNOW

**Problém:** QA review v krizi je úzké hrdlo. Potřebujeme "emergency deployment" policy — QA review do 15 minut pro P0 incidenty.

### Scénář 3: Paralelní mise

**Vstup:** 3 mise současně: KNOW indexuje, ENG implementuje, COMM migruje.

**Flow:** Všechna 3 oddělení pracují paralelně. Žádné sdílené zdroje. OC monitoruje progress.

**Problém:** Žádný. 3 oddělení = 3 nezávislé mise. Organizace to zvládá.

**Závěr:** Organizace zvládá paralelní mise napříč odděleními. Problém nastává, když jedno oddělení dostane více misí najednou → potřebuje Specialisty.

### Doporučení ze simulace

1. **COMM je potenciální úzké hrdlo** — jediný vlastník všech kanálů. Jakmile má víc než 1 aktivní misi, degradace. Řešení: Channel Manager Specialista.
2. **QA potřebuje emergency fast-track** — pro P0 incidenty review do 15 minut, ne standardních 48h.
3. **ARCH je blokátor pro všechna ostatní oddělení** — bez ARCH specifikace nemůže ENG stavět. Řešení: ARCH musí být první oddělení, které dosáhne HIGH maturity.

---

## FÁZE 9: EXECUTIVE READINESS REPORT

### Škálování: 5 oddělení, 20 specialistů, 100 workerů

| Dimenze | Současný stav | Cíl | Připraveno? |
|----------|-------------|-----|------------|
| Department Leady | 7 definic, 0 běžících | 7 běžících | ❌ |
| Specialisté | 0 | 20 | ❌ |
| Workeři | Prototyp (1 test) | 100 paralelně | ⚠️ Runtime funguje, chybí škálování |
| Paralelní mise | 1 (demo) | 10+ | ⚠️ ExecutiveRuntime to zvládá, chybí zátěžový test |
| Více coding agentů | 0 | 3+ paralelně | ❌ Neimplementováno |
| Cloud + lokální modely | ModelRouter definován | Funkční routing | ❌ Neimplementováno |
| Více repozitářů | 1 (MiLO_Core) | 11 projektů | ❌ Konsolidace neprovedena |

### Blokátory

| Blokátor | Dopad | Řešení |
|----------|-------|--------|
| Department Leady neběží | Organizace nemůže delegovat | Spustit Executive Agenty v AgentManageru |
| ARCHITECTURE.md není dokončena | ENG nemůže implementovat | ARCH Department → první mise |
| CONCEPTUAL_MODEL.md není zaindexován | KNOW nemůže vyhledávat | KNOW Department → první mise |
| Telegram boti nejsou sjednoceni | COMM nemůže spravovat kanály | COMM Department → první mise |
| CI/CD neexistuje | OPS nemůže nasazovat | OPS Department → první mise |

### Verdikt

**MiLO NENÍ připraven na 100 workerů a paralelní coding agenty.** Organizace existuje na papíře, ale není operativní. 5 ze 7 oddělení má NÍZKOU zralost.

**MiLO JE připraven na první vlnu aktivace:** KNOW, COMM, ARCH — tato oddělení nemají blokátory a mohou začít okamžitě.

**Prioritní akce:**
1. Spustit Department Leady jako běžící agenty
2. KNOW → zaindexovat dokumenty
3. COMM → sjednotit Telegram boty
4. ARCH → dokončit ARCHITECTURE.md
5. ENG → implementovat OrchestrationProvider

---

*Organizational Blueprint v1.0 — Chief Orchestrator.*
*Vyžaduje Board review a Owner schválení pro přechod do implementace.*
