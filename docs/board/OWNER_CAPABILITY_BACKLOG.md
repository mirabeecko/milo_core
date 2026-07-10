# Owner Capability Backlog v1.0

**Autor:** Chief Orchestrator
**Datum:** 2026-07-10
**Status:** Strategický plánovací dokument — nejvyšší priorita MiLO

> Každá mise schválená Executive Boardem musí odkazovat alespoň jedno Capability ID z tohoto dokumentu.

---

## Owner Value Score — Denní KPI

| Metrika | Jak měřit | Status |
|---------|-----------|--------|
| Hodin ušetřeno tento týden | Součet času, který by Vlastník strávil manuálně | 🔜 Po aktivaci prvních capabilities |
| Automatizované úkoly | Počet misí dokončených bez zásahu Vlastníka | 🔜 |
| Manuální úkoly eliminovány | Počet činností, které Vlastník přestal dělat | 🔜 |
| Capabilities dodáno | Nové capability tento týden | ✅ 4 (Brief, Search, Missions, Approvals) |
| Aktivní capabilities | Capability používané tento týden | ⚠️ 0 (Vlastník zatím nepoužívá přes API) |
| Schválení Vlastníka | Počet approval requests | ✅ Měřeno |
| Automatizace % | Automatizované / (automatizované + manuální) | 🔜 |
| Confidence level | Průměrná confidence napříč sekcemi briefu | ✅ "vysoká" |

---

## Kompletní Owner Capability Backlog

### C-001: Jednotná schránka (Unified Inbox)

| Pole | Hodnota |
|------|---------|
| **ID** | C-001 |
| **Problém** | Vlastník kontroluje 3 Telegram boty + Gmail + datovou schránku zvlášť. Ztrácí čas přepínáním. |
| **Manuální workflow** | Otevřít Telegram → zkontrolovat 3 boty → otevřít Gmail → otevřít ISDS → rozhodnout co je důležité |
| **MiLO workflow** | Všechny zprávy na jednom místě. MiLO označí důležité, shrne obsah, navrhne odpověď. |
| **Časová úspora** | 3-5 hodin týdně |
| **Frekvence** | Denně |
| **Hodnota** | Kritická — Vlastník přestane přepínat mezi kanály |
| **Oddělení** | COMM |
| **Existující** | Bot inventory (COMM M1), funkční mapa (COMM M2) |
| **Chybí** | Telegram bot sjednocení, Gmail API integrace, ISDS API integrace |
| **Náročnost** | Střední |
| **Priorita** | **P0** |
| **Závislosti** | Telegram token, Google OAuth |

### C-002: Ranní briefing doručený automaticky

| Pole | Hodnota |
|------|---------|
| **ID** | C-002 |
| **Problém** | Vlastník každé ráno manuálně kontroluje stav. |
| **Manuální workflow** | Otevřít terminál → curl API → přečíst JSON → rozhodnout co dělat |
| **MiLO workflow** | Každé ráno v 7:00 přijde Telegram zpráva se souhrnem. |
| **Časová úspora** | 1-2 hodiny týdně |
| **Frekvence** | Denně |
| **Hodnota** | Vysoká — první věc, kterou Vlastník uvidí |
| **Oddělení** | OC + COMM |
| **Existující** | Executive Brief pipeline, textový výstup, `/brief/send` |
| **Chybí** | Telegram token, cron scheduling |
| **Náročnost** | Nízká |
| **Priorita** | **P0** |
| **Závislosti** | Telegram token |

### C-003: Hlídání lhůt z datové schránky

| Pole | Hodnota |
|------|---------|
| **ID** | C-003 |
| **Problém** | V datové schránce jsou právní dokumenty s termíny (odvolání, exekuce, pokuty). Vlastník je musí ručně procházet a hlídat. |
| **Manuální workflow** | Otevřít ISDS → projít nové zprávy → otevřít PDF → přečíst → najít datum → zapsat do kalendáře |
| **MiLO workflow** | MiLO automaticky stáhne nové zprávy → extrahuje text z PDF → najde lhůty → přidá do kalendáře → upozorní 3 dny předem |
| **Časová úspora** | 2-4 hodiny týdně |
| **Frekvence** | Denně (kontrola), nárazově (nové zprávy) |
| **Hodnota** | Kritická — zmeškaná lhůta = právní následky |
| **Oddělení** | KNOW + COMM (notifikace) |
| **Existující** | MiLO_ISDS_MCP (download, extract, analyze), Unified Search (PDF metadata) |
| **Chybí** | OCR pipeline pro PDF plnotext, deadline extrakce, kalendářová integrace |
| **Náročnost** | Střední |
| **Priorita** | **P0** |
| **Závislosti** | MiLO_ISDS_MCP credentials, ISDS přístup |

### C-004: Fulltextové hledání v ISDS dokumentech

| Pole | Hodnota |
|------|---------|
| **ID** | C-004 |
| **Problém** | 1451 PDF v datové schránce. Vlastník nemůže fulltextově hledat. |
| **Manuální workflow** | Pamatovat si, co kde je → otevřít PDF → Ctrl+F |
| **MiLO workflow** | Dotaz "smlouva o dílo" → MiLO prohledá všechny PDF → vrátí relevantní dokumenty s citacemi |
| **Časová úspora** | 1-2 hodiny týdně |
| **Frekvence** | Týdně |
| **Hodnota** | Vysoká — Vlastník najde dokument za sekundy |
| **Oddělení** | KNOW |
| **Existující** | Unified Search (PDF metadata), MiLO_ISDS_MCP (pipeline) |
| **Chybí** | OCR/batch PDF text extraction |
| **Náročnost** | Střední |
| **Priorita** | **P1** |
| **Závislosti** | C-003 (OCR pipeline) |

### C-005: Inteligentní prioritizace projektů

| Pole | Hodnota |
|------|---------|
| **ID** | C-005 |
| **Problém** | 11+ projektů. Vlastník se ráno ptá: "Na čem mám dnes pracovat?" |
| **Manuální workflow** | Projít projekty → zkontrolovat deadliny → odhadnout effort → rozhodnout |
| **MiLO workflow** | MiLO analyzuje deadliny, závislosti, git aktivitu, finanční potenciál → seřadí projekty podle priority → řekne "Dnes: Projekt X (deadline zítra). Zítra: Projekt Y." |
| **Časová úspora** | 2-3 hodiny týdně |
| **Frekvence** | Denně |
| **Hodnota** | Vysoká — Vlastník přestane ztrácet čas rozhodováním |
| **Oddělení** | OC |
| **Existující** | Projekty data (milo-os, executive-ai priority scoring) |
| **Chybí** | Integrace dat z milo-os, prioritizační algoritmus |
| **Náročnost** | Nízká |
| **Priorita** | **P1** |
| **Závislosti** | Přístup k projects.json |

### C-006: Sjednocení Telegram botů

| Pole | Hodnota |
|------|---------|
| **ID** | C-006 |
| **Problém** | 3 boti, 3 jména, duplicitní funkce. Vlastník neví, kterého bota na co použít. |
| **Manuální workflow** | Pamatovat si 3 jména botů → rozhodnout který na co |
| **MiLO workflow** | Jeden bot (@MiLO). Vlastník píše jednomu kontaktu. MiLO routuje zprávy správným oddělením. |
| **Časová úspora** | 0.5-1 hodina týdně |
| **Frekvence** | Denně |
| **Hodnota** | Vysoká — jednotné rozhraní |
| **Oddělení** | COMM |
| **Existující** | Bot inventory, funkční mapa, duplicity report |
| **Chybí** | Migrace funkcí na jednoho bota |
| **Náročnost** | Vysoká |
| **Priorita** | **P1** |
| **Závislosti** | C-001 (jednotná schránka) |

### C-007: Shrnutí Gmail příchozích zpráv

| Pole | Hodnota |
|------|---------|
| **ID** | C-007 |
| **Problém** | Vlastník ručně prochází emaily. Většina je spam nebo nepodstatná. |
| **Manuální workflow** | Otevřít Gmail → projít inbox → označit důležité → odpovědět |
| **MiLO workflow** | MiLO přečte nové emaily → označí důležité → shrne obsah → navrhne odpověď |
| **Časová úspora** | 3-5 hodin týdně |
| **Frekvence** | Denně |
| **Hodnota** | Kritická — email je největší žrout času |
| **Oddělení** | COMM |
| **Existující** | google-docs-mcp (Gmail tools), executive-ai (Gmail integrace) |
| **Chybí** | Google OAuth, Gmail API integrace |
| **Náročnost** | Střední |
| **Priorita** | **P0** |
| **Závislosti** | Google OAuth credentials |

### C-008: Kalendář — přehled dne a detekce konfliktů

| Pole | Hodnota |
|------|---------|
| **ID** | C-008 |
| **Problém** | Vlastník ručně kontroluje kalendář. Neví o konfliktech, dokud není pozdě. |
| **Manuální workflow** | Otevřít Google Calendar → zkontrolovat den |
| **MiLO workflow** | MiLO zkontroluje kalendář → detekuje konflikty → navrhne přesun → připraví podklady na schůzky |
| **Časová úspora** | 1-2 hodiny týdně |
| **Frekvence** | Denně |
| **Hodnota** | Vysoká |
| **Oddělení** | OC + COMM |
| **Existující** | google-docs-mcp (Calendar tools), Brief pipeline |
| **Chybí** | Google OAuth |
| **Náročnost** | Nízká |
| **Priorita** | **P1** |
| **Závislosti** | Google OAuth |

### C-009: GA4/Ads analytický přehled

| Pole | Hodnota |
|------|---------|
| **ID** | C-009 |
| **Problém** | Vlastník manuálně kontroluje Google Analytics a Ads pro weby (sheskates, ninja-tyden, tjkrupka, webdo24). |
| **Manuální workflow** | Otevřít GA4 → zkontrolovat návštěvnost → otevřít Ads → zkontrolovat kampaně |
| **MiLO workflow** | MiLO automaticky stahuje data → detekuje anomálie → řekne: "Návštěvnost +12 %, kampaň X vyčerpala rozpočet" |
| **Časová úspora** | 2-3 hodiny týdně |
| **Frekvence** | Denně |
| **Hodnota** | Vysoká — Vlastník spravuje kampaně za peníze |
| **Oddělení** | OC |
| **Existující** | GA4 sync (milo-os, MiLO_Agent), dashboard, analytics pipeline |
| **Chybí** | Integrace do Brief pipeline |
| **Náročnost** | Střední |
| **Priorita** | **P1** |
| **Závislosti** | Google OAuth |

### C-010: Hlídání nákladů na LLM

| Pole | Hodnota |
|------|---------|
| **ID** | C-010 |
| **Problém** | Vlastník platí za API volání (OpenAI, Anthropic), ale neví kolik přesně. |
| **Manuální workflow** | Otevřít billing dashboard → zkontrolovat |
| **MiLO workflow** | MiLO automaticky loguje každé LLM volání → reportuje: "Tento měsíc: 450 Kč (OpenAI), 120 Kč (Anthropic)" |
| **Časová úspora** | 0.5 hodiny týdně |
| **Frekvence** | Týdně |
| **Hodnota** | Střední |
| **Oddělení** | OC |
| **Existující** | cost_tracker.py (milo-os), LLM costs log |
| **Chybí** | Integrace do Brief pipeline |
| **Náročnost** | Nízká |
| **Priorita** | **P2** |
| **Závislosti** | — |

### C-011: Automatické zálohování

| Pole | Hodnota |
|------|---------|
| **ID** | C-011 |
| **Problém** | Data MiLO nejsou automaticky zálohována. Při havárii = ztráta. |
| **Manuální workflow** | Vlastník musí pamatovat na zálohování |
| **MiLO workflow** | Denní automatická záloha → notifikace o úspěchu → disaster recovery do 1 hodiny |
| **Časová úspora** | 0.5 hodiny týdně + eliminace rizika |
| **Frekvence** | Denně (automaticky) |
| **Hodnota** | Vysoká — bezpečnost dat |
| **Oddělení** | OPS |
| **Existující** | backup.py (milo-os) |
| **Chybí** | Automatizace, monitoring |
| **Náročnost** | Nízká |
| **Priorita** | **P1** |
| **Závislosti** | — |

### C-012: Knowledge Search — Obsidian vault

| Pole | Hodnota |
|------|---------|
| **ID** | C-012 |
| **Problém** | Vlastník má poznámky v Obsidianu. Nemůže je prohledávat přes MiLO. |
| **Manuální workflow** | Otevřít Obsidian → hledat |
| **MiLO workflow** | Dotaz přes MiLO → prohledá i Obsidian vault |
| **Časová úspora** | 1 hodina týdně |
| **Frekvence** | Týdně |
| **Hodnota** | Střední |
| **Oddělení** | KNOW |
| **Existující** | Unified Search, search-index.ts |
| **Chybí** | Obsidian vault path, indexace .md souborů |
| **Náročnost** | Nízká |
| **Priorita** | **P2** |
| **Závislosti** | OBSIDIAN_VAULT_PATH |

### C-013: Code Review asistent

| Pole | Hodnota |
|------|---------|
| **ID** | C-013 |
| **Problém** | Vlastník píše kód sám. Nemá druhý pár očí před commitem. |
| **Manuální workflow** | Commit → doufat, že to funguje |
| **MiLO workflow** | Před commitem MiLO zkontroluje: nepoužité importy, chybějící testy, bezpečnostní problémy |
| **Časová úspora** | 1-2 hodiny týdně |
| **Frekvence** | Denně |
| **Hodnota** | Vysoká — prevence chyb |
| **Oddělení** | ENG + QA |
| **Existující** | TypeScript typecheck v CI |
| **Chybí** | Pre-commit hook, AI review |
| **Náročnost** | Střední |
| **Priorita** | **P2** |
| **Závislosti** | — |

### C-014: Docker monitoring

| Pole | Hodnota |
|------|---------|
| **ID** | C-014 |
| **Problém** | Vlastník má Docker kontejnery (n8n, MiLO_Agent, Supabase). Neví, když něco spadne. |
| **Manuální workflow** | SSH na VPS → docker ps → zkontrolovat |
| **MiLO workflow** | MiLO monitoruje kontejnery → při pádu notifikuje → pokusí se restartovat |
| **Časová úspora** | 1 hodina týdně |
| **Frekvence** | Průběžně |
| **Hodnota** | Vysoká — prevence výpadků |
| **Oddělení** | OPS |
| **Existující** | voice-ai-terminal (docker_tool.py), n8n ENV |
| **Chybí** | Monitoring pipeline, alerty |
| **Náročnost** | Nízká |
| **Priorita** | **P1** |
| **Závislosti** | SSH přístup k VPS |

### C-015: n8n workflow monitoring

| Pole | Hodnota |
|------|---------|
| **ID** | C-015 |
| **Problém** | Vlastník neví, jestli n8n workflowy běží nebo padají. |
| **Manuální workflow** | Otevřít n8n UI → zkontrolovat exec history |
| **MiLO workflow** | MiLO monitoruje n8n → reportuje stav workflowů → upozorní na chyby |
| **Časová úspora** | 0.5 hodiny týdně |
| **Frekvence** | Denně |
| **Hodnota** | Střední |
| **Oddělení** | OPS |
| **Existující** | n8n REST API |
| **Chybí** | Health check integrace |
| **Náročnost** | Nízká |
| **Priorita** | **P2** |
| **Závislosti** | n8n API přístup |

### C-016: Dokumentový asistent (OCR + extrakce)

| Pole | Hodnota |
|------|---------|
| **ID** | C-016 |
| **Problém** | Vlastník dostává PDF faktury, smlouvy, formuláře. Musí z nich ručně extrahovat data. |
| **Manuální workflow** | Otevřít PDF → přečíst → opsat údaje → zadat do systému |
| **MiLO workflow** | MiLO extrahuje text (OCR) → najde klíčové údaje (částka, datum, IČO) → uloží strukturovaně |
| **Časová úspora** | 2-4 hodiny týdně |
| **Frekvence** | Týdně |
| **Hodnota** | Vysoká |
| **Oddělení** | KNOW |
| **Existující** | MiLO_ISDS_MCP (extractor, OCR pipeline), pymupdf |
| **Chybí** | Šablony pro běžné dokumenty, AI klasifikace |
| **Náročnost** | Střední |
| **Priorita** | **P1** |
| **Závislosti** | C-003 (OCR pipeline) |

### C-017: Právní asistent — analýza dokumentů

| Pole | Hodnota |
|------|---------|
| **ID** | C-017 |
| **Problém** | Vlastník (TJ Krupka) dostává právní dokumenty. Nerozumí jim bez právníka. |
| **Manuální workflow** | Otevřít PDF → číst → nerozumět → konzultovat právníka |
| **MiLO workflow** | MiLO analyzuje dokument → shrne srozumitelně → označí rizika → navrhne další kroky |
| **Časová úspora** | 3-5 hodin měsíčně |
| **Frekvence** | Měsíčně |
| **Hodnota** | Vysoká — Vlastník rozumí dokumentům bez právníka |
| **Oddělení** | KNOW + ARCH (Legal Agent) |
| **Existující** | obcanai (právní RAG pipeline), MiLO_ISDS_MCP |
| **Chybí** | Integrace obcanai RAG, specializované právní prompty |
| **Náročnost** | Vysoká |
| **Priorita** | **P2** |
| **Závislosti** | C-004 (fulltext ISDS), obcanaiSupabase |

### C-018: Automatické commit-review-report

| Pole | Hodnota |
|------|---------|
| **ID** | C-018 |
| **Problém** | Vlastník commituje, ale nemá přehled co se změnilo napříč projekty. |
| **Manuální workflow** | git log v každém repozitáři zvlášť |
| **MiLO workflow** | MiLO sleduje všechny repozitáře → denně reportuje: "3 commity v MiLO_Core, 1 v MiLO_Agent, 0 jinde" |
| **Časová úspora** | 0.5 hodiny týdně |
| **Frekvence** | Denně |
| **Hodnota** | Střední |
| **Oddělení** | OC |
| **Existující** | Brief pipeline (git activity) |
| **Chybí** | Multi-repo scanning |
| **Náročnost** | Nízká |
| **Priorita** | **P2** |
| **Závislosti** | — |

---

## Prioritizace

| ID | Název | Priorita | Časová úspora/týden | Náročnost | Blokátor |
|----|-------|----------|--------------------|-----------|----------|
| C-002 | Ranní briefing Telegram | **P0** | 1-2h | Nízká | Telegram token |
| C-001 | Jednotná schránka | **P0** | 3-5h | Střední | Token + OAuth |
| C-003 | ISDS hlídání lhůt | **P0** | 2-4h | Střední | ISDS creds |
| C-007 | Gmail shrnutí | **P0** | 3-5h | Střední | Google OAuth |
| C-005 | Prioritizace projektů | **P1** | 2-3h | Nízká | — |
| C-004 | Fulltext ISDS hledání | **P1** | 1-2h | Střední | C-003 |
| C-008 | Kalendář přehled | **P1** | 1-2h | Nízká | Google OAuth |
| C-009 | GA4/Ads přehled | **P1** | 2-3h | Střední | Google OAuth |
| C-011 | Automatické zálohování | **P1** | 0.5h | Nízká | — |
| C-014 | Docker monitoring | **P1** | 1h | Nízká | SSH |
| C-016 | Dokumentový asistent | **P1** | 2-4h | Střední | C-003 |
| C-006 | Sjednocení botů | **P1** | 0.5h | Vysoká | C-001 |
| C-010 | LLM náklady | **P2** | 0.5h | Nízká | — |
| C-012 | Obsidian search | **P2** | 1h | Nízká | VAULT_PATH |
| C-013 | Code Review asistent | **P2** | 1-2h | Střední | — |
| C-015 | n8n monitoring | **P2** | 0.5h | Nízká | n8n API |
| C-017 | Právní asistent | **P2** | 3-5h/měs. | Vysoká | C-004 |
| C-018 | Multi-repo git report | **P2** | 0.5h | Nízká | — |

---

## Graf závislostí

```
C-002 (Brief Telegram) ─── nezávislý, pouze token
C-001 (Unified Inbox) ──── nezávislý, token+OAuth
C-003 (ISDS lhůty) ─────── nezávislý, ISDS creds
C-007 (Gmail shrnutí) ──── nezávislý, OAuth
C-005 (Prioritizace) ───── nezávislý
                              │
C-004 (Fulltext ISDS) ───────┘── závisí na C-003 (OCR pipeline)
C-016 (Dokumentový asistent) ─┘── závisí na C-003

C-006 (Sjednocení botů) ─── závisí na C-001
C-008 (Kalendář) ────────── nezávislý, OAuth
C-017 (Právní asistent) ─── závisí na C-004
```

---

## 30-denní capability roadmap

```
Týden 1 (P0 — okamžitý start, žádné blokátory kromě tokenů):
  Den 1: C-002 Ranní briefing Telegram  (potřebuje TELEGRAM_BOT_TOKEN)
  Den 2-5: C-005 Prioritizace projektů   (integrace milo-os projects.json)
  Den 3-5: C-001 Jednotná schránka — začátek (COMM audit dokončen)

Týden 2 (P0 — potřebuje credentials):
  Den 6-10: C-007 Gmail shrnutí          (potřebuje GOOGLE_CLIENT_ID)
  Den 6-10: C-003 ISDS hlídání lhůt      (potřebuje ISDS certifikát)

Týden 3 (P1 — nezávislé, nízká náročnost):
  Den 11-12: C-008 Kalendář přehled      (Google OAuth)
  Den 11-13: C-011 Automatické zálohování
  Den 13-15: C-014 Docker monitoring

Týden 4 (P1 — návazné):
  Den 16-18: C-004 Fulltext ISDS hledání (po C-003)
  Den 16-18: C-009 GA4/Ads přehled       (Google OAuth)
  Den 19-20: C-016 Dokumentový asistent  (po C-003)

Po 30 dnech Vlastník:
  ✅ Dostává briefing automaticky do Telegramu
  ✅ Vidí všechny zprávy na jednom místě
  ✅ Ví o blížících se ISDS lhůtách
  ✅ Má shrnuté důležité emaily
  ✅ Ví, na kterém projektu pracovat
  ✅ Fulltextově hledá v ISDS dokumentech
  ✅ Vidí přehled GA4/Ads v briefingu
  ✅ Data jsou automaticky zálohována
  ✅ Ví o pádech Docker kontejnerů
```

---

## Reprioritizace existujících misí

| Původní mise | Nový stav | Důvod |
|-------------|-----------|-------|
| M-ARCH-002 (kontrakty) | ⏸️ Pozastaveno | Není Owner capability |
| M-ENG-001 (POC) | ⏸️ Pozastaveno | Žádná capability nevyžaduje orchestrátor |
| M-OPS-001 (infrastruktura) | 🔄 Přesměrováno na C-011, C-014 | Pouze capability-relevantní části |
| M-KNOW-002 (indexace) | ✅ Pokračovat | Podporuje C-004, C-012 |
| M-COMM-002 (audit botů) | ✅ Dokončit | Podporuje C-001, C-006 |
| M-OC-001 (Brief→Telegram) | 🔄 Sloučeno do C-002 | Duplicitní |

---

## Oddělení k aktivaci

| Oddělení | Stav | Důvod |
|----------|------|-------|
| **OC** | ✅ Aktivní | Vlastní C-002, C-005, C-010, C-018 |
| **COMM** | ✅ Aktivní | Vlastní C-001, C-006, C-007 |
| **KNOW** | ✅ Aktivní | Vlastní C-003, C-004, C-012, C-016 |
| **OPS** | 🆕 Aktivovat | Vlastní C-011, C-014, C-015 |
| **ENG** | ⏸️ Ready | Žádná P0/P1 capability nevyžaduje vlastní kód |
| **ARCH** | ⏸️ Ready | Žádná capability nevyžaduje novou architekturu |
| **QA** | 🆕 Aktivovat (lehce) | Review capabilities před releasem |

---

## Capability, které mohou začít okamžitě

Tyto capability nevyžadují žádnou novou infrastrukturu:

1. **C-005 Prioritizace projektů** — stačí přečíst milo-os/projects.json
2. **C-010 LLM náklady** — stačí integrovat cost_tracker.py výstup do briefu
3. **C-011 Automatické zálohování** — stačí obalit existující backup.py
4. **C-012 Obsidian search** — stačí přidat cestu do indexu
5. **C-018 Multi-repo git report** — stačí rozšířit Brief pipeline

---

*Tento backlog nahrazuje všechny předchozí technické prioritizace. Executive Board schvaluje pouze mise, které zlepšují alespoň jednu Owner Capability.*
