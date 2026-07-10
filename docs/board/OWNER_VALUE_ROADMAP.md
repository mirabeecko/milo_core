# MiLO Capability Roadmap — Owner Value First

**Autor:** Chief Orchestrator
**Datum:** 2026-07-10
**Status:** Product Mode — měřeno hodnotou pro Vlastníka

---

## Současné capability (pohledem Vlastníka)

### 1. Ranní briefing — "Co mám dnes dělat?"

| Otázka | Odpověď |
|--------|---------|
| **Problém Vlastníka** | Každé ráno manuálně kontroluje stav projektů, git, úkoly. Ztrácí 15-30 minut. |
| **Vstup od Vlastníka** | Žádný — briefing se generuje automaticky. |
| **Co MiLO dělá samo** | Skenuje stav agentů, git aktivitu, aktivní mise, čekající schválení, integrace. Sestaví přehled. |
| **Výsledek pro Vlastníka** | Jedna zpráva: "6 agentů běží, 0 blokátorů, 99 změn v gitu. Doporučení: commitnout." |
| **Oddělení** | OC (Chief) |
| **Plně funkční** | ✅ Generování briefu, textový výstup |
| **Degradované** | ⚠️ Telegram delivery (čeká na token) |
| **Simulované** | — |
| **K plné autonomii** | Telegram token + cron pro ranní spuštění |

---

### 2. Hledání v dokumentech — "Kde jsem to napsal?"

| Otázka | Odpověď |
|--------|---------|
| **Problém Vlastníka** | Hledá dokumenty ručně ve 47+ Markdown souborech. Neví, co kde je. |
| **Vstup od Vlastníka** | Dotaz: "agent lifecycle" |
| **Co MiLO dělá samo** | Prohledá kompletní znalostní bázi — Ústavu, ADR, Board meetingy, PDF metadata z ISDS, zdrojový kód. |
| **Výsledek pro Vlastníka** | Seznam relevantních dokumentů s náhledem obsahu. |
| **Oddělení** | KNOW |
| **Plně funkční** | ✅ Markdown vyhledávání, PDF metadata, katalogizace |
| **Degradované** | ⚠️ PDF plnotextová extrakce (jen metadata) |
| **Simulované** | — |
| **K plné autonomii** | OCR pipeline pro PDF z ISDS |

---

### 3. Správa misí — "Deleguj to za mě"

| Otázka | Odpověď |
|--------|---------|
| **Problém Vlastníka** | Musí sám řídit úkoly napříč projekty. |
| **Vstup od Vlastníka** | "Analyzuj smlouvu z datové schránky" |
| **Co MiLO dělá samo** | Vytvoří misi → přiřadí oddělení → vytvoří Workera → QA zkontroluje → vrátí výsledek. |
| **Výsledek pro Vlastníka** | Hotový úkol s výsledkem a QA razítkem. |
| **Oddělení** | OC, ENG, QA |
| **Plně funkční** | ✅ Vytvoření mise, přiřazení, stavový lifecycle |
| **Degradované** | ⚠️ Worker exekuce simulovaná |
| **Simulované** | ❌ Worker reálně nespouští kód — čeká na LangGraph adapter |
| **K plné autonomii** | ENG implementace OrchestrationProvideru |

---

### 4. Schvalovací fronta — "Co musím potvrdit?"

| Otázka | Odpověď |
|--------|---------|
| **Problém Vlastníka** | Neví, které akce čekají na jeho schválení. |
| **Vstup od Vlastníka** | approve/reject rozhodnutí |
| **Co MiLO dělá samo** | Shromažďuje požadavky na schválení, řadí podle rizika, čeká na rozhodnutí. |
| **Výsledek pro Vlastníka** | Fronta: "2 čekající schválení — 1 kritické (datová schránka), 1 nízké (diagnostika)" |
| **Oddělení** | OC |
| **Plně funkční** | ✅ Vytvoření, list, approve, reject, perzistence |
| **Degradované** | — |
| **Simulované** | — |
| **K plné autonomii** | Plně funkční |

---

## Top 10 capabilities pro příští měsíc

### #1 — Jednotná schránka (Unified Inbox)
**Problém:** Vlastník kontroluje 3 Telegram boty + emaily + datovou schránku zvlášť.
**Hodnota:** Jeden chat, kam chodí všechno. MiLO řekne, co je důležité.
**Oddělení:** COMM
**Náročnost:** 5 dní (M-COMM-002 už běží)

### #2 — Hlídání lhůt z datové schránky (ISDS Deadline Watch)
**Problém:** V datové schránce jsou právní dokumenty s termíny. Vlastník je musí ručně kontrolovat.
**Hodnota:** MiLO extrahuje lhůty, hlídá je, upozorní 3 dny předem.
**Oddělení:** KNOW + MiLO_ISDS_MCP
**Náročnost:** 5 dní (potřebuje OCR pipeline)

### #3 — Automatický ranní briefing přes Telegram
**Problém:** Vlastník musí briefing aktivně vyžádat přes API.
**Hodnota:** Každé ráno v 7:00 přijde zpráva. Vlastník se probudí a vidí stav.
**Oddělení:** OC + COMM
**Náročnost:** 1 den (potřebuje Telegram token)

### #4 — Inteligentní prioritizace projektů
**Problém:** 11 projektů. Vlastník neví, na čem pracovat.
**Hodnota:** MiLO analyzuje deadliny, závislosti, aktivitu a řekne: "Dnes dělej X, zítra Y."
**Oddělení:** OC
**Náročnost:** 3 dny

### #5 — Sjednocení Telegram botů
**Problém:** 3 boti (@Muy_empoyee_bot, executive-ai, voice-ai-terminal) — duplicitní funkce.
**Hodnota:** Jeden bot. Jedno rozhraní. Vlastník si pamatuje jen jedno jméno.
**Oddělení:** COMM
**Náročnost:** 5 dní (po M-COMM-002)

### #6 — Hledání v PDF z datové schránky (plnotextové)
**Problém:** 1451 PDF v ISDS. Vlastník nemůže fulltextově hledat.
**Hodnota:** Dotaz "smlouva o dílo" → najde všechny relevantní dokumenty.
**Oddělení:** KNOW
**Náročnost:** 3 dny (OCR pipeline)

### #7 — Analytický dashboard (GA4/Ads)
**Problém:** Vlastník manuálně kontroluje Google Analytics a Ads.
**Hodnota:** MiLO řekne: "Návštěvnost +12 %, kampaň X vyčerpala rozpočet."
**Oddělení:** OC + existující dashboard
**Náročnost:** 5 dní (integrace s GA4 API)

### #8 — Hlídání nákladů na LLM
**Problém:** Vlastník platí za API volání, ale neví kolik a za co.
**Hodnota:** "Tento měsíc: 450 Kč (OpenAI), 120 Kč (Anthropic). Nejdražší dotaz: 8 Kč."
**Oddělení:** OC + OPS
**Náročnost:** 2 dny

### #9 — Automatické zálohování
**Problém:** Data MiLO nejsou automaticky zálohována.
**Hodnota:** Vlastník ví, že data jsou v bezpečí. Při havárii obnova do hodiny.
**Oddělení:** OPS
**Náročnost:** 3 dny

### #10 — Code Review asistent
**Problém:** Vlastník píše kód, nemá druhý pár očí.
**Hodnota:** MiLO zkontroluje změny před commitem: "Soubor X má nepoužitý import, testy neprošly."
**Oddělení:** ENG + QA
**Náročnost:** 5 dní

---

## Roadmap — Maximalizace hodnoty Vlastníka

```
Týden 1:  #3 Ranní briefing Telegram  (1 den)
          #1 Jednotná schránka          (5 dní — COMM)
          #8 Hlídání nákladů           (2 dny — OC)

Týden 2:  #2 ISDS Deadline Watch      (5 dní — KNOW)
          #5 Sjednocení botů           (5 dní — COMM, paralelně)

Týden 3:  #4 Prioritizace projektů     (3 dny — OC)
          #6 Fulltextové PDF hledání   (3 dny — KNOW)
          #9 Automatické zálohování    (3 dny — OPS)

Týden 4:  #7 GA4/Ads dashboard         (5 dní — OC)
          #10 Code Review asistent     (5 dní — ENG+QA, paralelně)
```

### Metrika úspěchu

Po 1 měsíci Vlastník:
- ✅ Dostává ranní briefing automaticky (nevyžaduje API)
- ✅ Vidí všechny zprávy na jednom místě
- ✅ Ví o blížících se lhůtách z datové schránky
- ✅ Ví, na kterém projektu má pracovat
- ✅ Může fulltextově hledat v právních dokumentech
- ✅ Ví, kolik utrácí za LLM
- ✅ Data jsou automaticky zálohována

---

*Tento dokument nahrazuje předchozí prioritizaci. Všechny mise, které neřeší konkrétní problém Vlastníka, jsou pozastaveny.*
