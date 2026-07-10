# MiLO Process Catalog v1.0

**Autor:** Chief Orchestrator
**Datum:** 2026-07-10
**Status:** Operační vrstva nad Capability Backlogem

> Procesy popisují JAK MiLO řeší reálné problémy Vlastníka.
> Capability jsou stavební bloky. Procesy jsou workflow.

---

## Event Taxonomy

Všechny procesy jsou spuštěny jednou z těchto tříd událostí:

| Třída | Příklady | Jak detekovat |
|-------|----------|---------------|
| **Časová** | Ráno 7:00, každou hodinu, deadline | Cron / scheduler |
| **Příchozí zpráva** | Email, ISDS, Telegram, SMS, WhatsApp | Polling / webhook |
| **Systémová** | Docker pád, build fail, překročení limitu | Monitoring / health check |
| **Souborová** | Nové PDF, změna v gitu, upload | Filesystem watch / git hook |
| **Hlasová** | "Ahoj Milo", "Připrav žalobu" | Voice interface |
| **Vlastníkova akce** | Explicitní příkaz přes Telegram/Dashboard | Message parsing |

---

## Procesy — seřazeno podle hodnoty pro Vlastníka

### P-001: Ranní briefing

| Pole | Hodnota |
|------|---------|
| **ID** | P-001 |
| **Trigger** | Časová — každý den v 7:00 |
| **Účel** | Vlastník se probudí a okamžitě ví, co je důležité |
| **Vstupy** | Žádné (autonomní) |
| **Výstupy** | Telegram zpráva se souhrnem dne |
| **Oddělení** | OC → COMM |
| **Capability** | C-002 (Brief Telegram) |
| **Approval** | Ne |
| **QA** | Denně — kontrola přesnosti |
| **Časová úspora** | 15-30 minut denně |
| **Frekvence** | Denně |
| **Priorita** | **P0** ✅ Již existuje |

---

### P-002: Příchozí důležitý email

| Pole | Hodnota |
|------|---------|
| **ID** | P-002 |
| **Trigger** | Příchozí zpráva — nový email v Gmail inboxu |
| **Účel** | Vlastník nemusí procházet inbox — MiLO řekne, co je důležité |
| **Vstupy** | Gmail inbox (polling každých 5 minut) |
| **Výstupy** | Telegram notifikace: "Důležitý email od X: Předmět Y. Shrnutí: ..." |
| **Oddělení** | COMM (Gmail read) → KNOW (klasifikace důležitosti) → COMM (notifikace) |
| **Capability** | C-001 (Unified Inbox), C-007 (Gmail shrnutí) |
| **Approval** | Ne (pouze notifikace) |
| **QA** | Týdně — false positive rate |
| **Časová úspora** | 30-60 minut denně |
| **Frekvence** | Denně (průběžně) |
| **Priorita** | **P0** |

---

### P-003: Nová zpráva v datové schránce

| Pole | Hodnota |
|------|---------|
| **ID** | P-003 |
| **Trigger** | Příchozí zpráva — ISDS polling (každou hodinu) |
| **Účel** | Vlastník okamžitě ví o nové úřední zprávě, včetně lhůt |
| **Vstupy** | ISDS inbox (MiLO_ISDS_MCP) |
| **Výstupy** | Telegram: "Nová zpráva v DS: [typ]. Lhůta: [datum]. Shrnutí: ..." |
| **Oddělení** | KNOW (ISDS download + OCR) → KNOW (extrakce lhůt) → COMM (notifikace) |
| **Capability** | C-003 (ISDS lhůty), C-004 (Fulltext ISDS), C-016 (Dokumentový asistent) |
| **Approval** | Ne pro notifikaci. Ano pro odpověď. |
| **QA** | Týdně — kontrola přesnosti extrakce lhůt |
| **Časová úspora** | 15-30 minut na zprávu |
| **Frekvence** | Několikrát týdně |
| **Priorita** | **P0** |

---

### P-004: Hlídání blížící se lhůty

| Pole | Hodnota |
|------|---------|
| **ID** | P-004 |
| **Trigger** | Časová — denně v 8:00 + 3 dny před každou lhůtou |
| **Účel** | Vlastník nikdy nezmešká právní lhůtu |
| **Vstupy** | Kalendář lhůt (extrahovaný z ISDS) |
| **Výstupy** | Telegram: "⚠️ Lhůta za 3 dny: [popis]. Dokument: [název]. Doporučená akce: ..." |
| **Oddělení** | KNOW (lhůty) → COMM (notifikace) |
| **Capability** | C-003 (ISDS lhůty), C-008 (Kalendář) |
| **Approval** | Ne |
| **QA** | Při každé lhůtě — ověřit správnost |
| **Časová úspora** | Eliminace rizika zmeškání (nekvantifikovatelné) |
| **Frekvence** | Týdně |
| **Priorita** | **P0** |

---

### P-005: Docker kontejner spadl

| Pole | Hodnota |
|------|---------|
| **ID** | P-005 |
| **Trigger** | Systémová — health check selhal |
| **Účel** | Vlastník se dozví o výpadku dřív, než ho zjistí sám |
| **Vstupy** | Docker health check (každých 60 sekund) |
| **Výstupy** | Telegram: "🚨 Kontejner [název] spadl. Pokus o restart: [úspěch/neúspěch]." |
| **Oddělení** | OPS (monitoring) → OPS (restart) → COMM (notifikace) |
| **Capability** | C-014 (Docker monitoring) |
| **Approval** | Ne pro restart. Ano pro investigaci. |
| **QA** | Měsíčně — response time |
| **Časová úspora** | 15-30 minut na incident |
| **Frekvence** | Měsíčně |
| **Priorita** | **P1** |

---

### P-006: Automatická záloha

| Pole | Hodnota |
|------|---------|
| **ID** | P-006 |
| **Trigger** | Časová — denně ve 3:00 |
| **Účel** | Data jsou v bezpečí bez zásahu Vlastníka |
| **Vstupy** | — |
| **Výstupy** | Do ranního briefu: "✅ Záloha dokončena (245 MB, 3 minuty)" |
| **Oddělení** | OPS |
| **Capability** | C-011 (Zálohování) |
| **Approval** | Ne |
| **QA** | Měsíčně — test obnovy |
| **Časová úspora** | 30 minut týdně |
| **Frekvence** | Denně (automaticky) |
| **Priorita** | **P1** |

---

### P-007: Vlastník řekne "Připrav žalobu" (nebo jiný právní úkon)

| Pole | Hodnota |
|------|---------|
| **ID** | P-007 |
| **Trigger** | Hlasová / Telegram zpráva: "Připrav [právní úkon]" |
| **Účel** | Vlastník zadá úkol přirozeným jazykem, MiLO připraví podklady |
| **Vstupy** | Hlasový/textový příkaz, kontext z ISDS, šablony z obcanai |
| **Výstupy** | Koncept podání + seznam potřebných dokumentů + lhůty |
| **Oddělení** | COMM (příjem) → OC (vytvoření mise) → KNOW (rešerše) → ENG/ARCH (generování) → QA (kontrola) |
| **Capability** | C-017 (Právní asistent), C-016 (Dokumentový asistent), C-003 (ISDS) |
| **Approval** | **Ano — Vlastník schvaluje před odesláním** |
| **QA** | Vždy — právní dokument vyžaduje kontrolu |
| **Časová úspora** | 2-4 hodiny na podání |
| **Frekvence** | Měsíčně |
| **Priorita** | **P1** |

---

### P-008: Plánování dne

| Pole | Hodnota |
|------|---------|
| **ID** | P-008 |
| **Trigger** | Časová — po ranním briefingu, nebo na vyžádání |
| **Účel** | Vlastník nemusí rozhodovat, na čem pracovat |
| **Vstupy** | Projekty (milo-os), deadliny, schůzky (Kalendář), energy level |
| **Výstupy** | "Dnes doporučuji: 9:00-11:00 Projekt X (deadline zítra), 11:00 Schůzka Y, 13:00-15:00 Projekt Z" |
| **Oddělení** | OC |
| **Capability** | C-005 (Prioritizace projektů), C-008 (Kalendář) |
| **Approval** | Ne |
| **QA** | Týdně — Vlastníkova spokojenost |
| **Časová úspora** | 15-30 minut denně |
| **Frekvence** | Denně |
| **Priorita** | **P1** |

---

### P-009: Anomálie v GA4/Ads

| Pole | Hodnota |
|------|---------|
| **ID** | P-009 |
| **Trigger** | Systémová — odchylka >20 % od průměru |
| **Účel** | Vlastník okamžitě ví o problému s kampaněmi |
| **Vstupy** | GA4/Ads data (denní sync) |
| **Výstupy** | Telegram: "📊 Anomálie: návštěvnost webdo24.cz -35 %. Kampaň X vyčerpala rozpočet." |
| **Oddělení** | OC (analýza) → COMM (notifikace) |
| **Capability** | C-009 (GA4/Ads přehled) |
| **Approval** | Ne |
| **QA** | Týdně — false positive rate |
| **Časová úspora** | 30 minut denně |
| **Frekvence** | Týdně |
| **Priorita** | **P1** |

---

### P-010: Schůzka za 1 hodinu

| Pole | Hodnota |
|------|---------|
| **ID** | P-010 |
| **Trigger** | Časová — 60 minut před každou schůzkou |
| **Účel** | Vlastník jde na schůzku připravený |
| **Vstupy** | Google Calendar |
| **Výstupy** | Telegram: "📅 Schůzka za 1h: [název] s [účastníci]. Příprava: [poznámky z minulé schůzky, dokumenty]." |
| **Oddělení** | OC (kalendář) → KNOW (rešerše) → COMM (notifikace) |
| **Capability** | C-008 (Kalendář) |
| **Approval** | Ne |
| **QA** | Týdně |
| **Časová úspora** | 10-15 minut na schůzku |
| **Frekvence** | Několikrát týdně |
| **Priorita** | **P2** |

---

### P-011: Nový commit v repozitáři

| Pole | Hodnota |
|------|---------|
| **ID** | P-011 |
| **Trigger** | Souborová — git push |
| **Účel** | Vlastník má přehled o změnách napříč všemi projekty |
| **Vstupy** | Git log všech repozitářů |
| **Výstupy** | Do ranního briefu nebo Telegram: "🔧 Nové commity: MiLO_Core (3), MiLO_Agent (1)" |
| **Oddělení** | OC |
| **Capability** | C-018 (Multi-repo git report) |
| **Approval** | Ne |
| **QA** | Denně |
| **Časová úspora** | 10 minut denně |
| **Frekvence** | Denně |
| **Priorita** | **P2** |

---

### P-012: Vlastník nahraje PDF (faktura, smlouva)

| Pole | Hodnota |
|------|---------|
| **ID** | P-012 |
| **Trigger** | Souborová / Telegram — Vlastník pošle PDF |
| **Účel** | Automatická extrakce údajů z dokumentu |
| **Vstupy** | PDF soubor |
| **Výstupy** | Strukturovaná data: "Částka: 12 500 Kč, IČO: 12345678, Datum splatnosti: 15.8.2026" |
| **Oddělení** | COMM (příjem) → KNOW (OCR + extrakce) → COMM (výstup) |
| **Capability** | C-016 (Dokumentový asistent) |
| **Approval** | Ne pro extrakci. Ano pro akci (např. zaplatit). |
| **QA** | Každý dokument |
| **Časová úspora** | 5-10 minut na dokument |
| **Frekvence** | Týdně |
| **Priorita** | **P1** |

---

### P-013: Překročení limitu LLM nákladů

| Pole | Hodnota |
|------|---------|
| **ID** | P-013 |
| **Trigger** | Systémová — měsíční náklady > limit |
| **Účel** | Vlastník ví, když utrácí víc než plánoval |
| **Vstupy** | LLM cost log |
| **Výstupy** | Telegram: "💰 LLM náklady tento měsíc: 850 Kč (limit: 500 Kč). Nejdražší model: gpt-4o." |
| **Oddělení** | OC |
| **Capability** | C-010 (LLM náklady) |
| **Approval** | Ne |
| **QA** | Měsíčně |
| **Časová úspora** | 15 minut měsíčně |
| **Frekvence** | Měsíčně |
| **Priorita** | **P2** |

---

### P-014: n8n workflow selhal

| Pole | Hodnota |
|------|---------|
| **ID** | P-014 |
| **Trigger** | Systémová — n8n execution failed |
| **Účel** | Vlastník ví, že automatizace přestala fungovat |
| **Vstupy** | n8n API |
| **Výstupy** | Telegram: "⚠️ n8n workflow [název] selhal. Chyba: [popis]." |
| **Oddělení** | OPS |
| **Capability** | C-015 (n8n monitoring) |
| **Approval** | Ne |
| **QA** | Při každém selhání |
| **Časová úspora** | 15 minut na incident |
| **Frekvence** | Měsíčně |
| **Priorita** | **P2** |

---

### P-015: Telegram zpráva od kontaktu

| Pole | Hodnota |
|------|---------|
| **ID** | P-015 |
| **Trigger** | Příchozí zpráva — Telegram |
| **Účel** | Všechny zprávy na jednom místě, Vlastník vidí jen důležité |
| **Vstupy** | Telegram zpráva |
| **Výstupy** | Pokud od Vlastníka → parsovat jako příkaz. Pokud od kontaktu → notifikace se shrnutím. |
| **Oddělení** | COMM |
| **Capability** | C-001 (Unified Inbox), C-006 (Sjednocení botů) |
| **Approval** | Ne pro čtení. Ano pro odpověď. |
| **QA** | Denně |
| **Časová úspora** | 30 minut denně |
| **Frekvence** | Denně |
| **Priorita** | **P0** |

---

### P-016: Večerní revize dne

| Pole | Hodnota |
|------|---------|
| **ID** | P-016 |
| **Trigger** | Časová — každý den ve 21:00 |
| **Účel** | Vlastník vidí, co se dnes udělalo, a ví, co bude zítra |
| **Vstupy** | Dokončené mise, commity, události dne |
| **Výstupy** | Telegram: "🌙 Dnešní shrnutí: 3 mise dokončeny, 5 commitů, 0 incidentů. Zítra: Projekt X deadline." |
| **Oddělení** | OC |
| **Capability** | C-002 (Brief — večerní varianta) |
| **Approval** | Ne |
| **QA** | Denně |
| **Časová úspora** | 10 minut denně |
| **Frekvence** | Denně |
| **Priorita** | **P2** |

---

### P-017: Noční údržba

| Pole | Hodnota |
|------|---------|
| **ID** | P-017 |
| **Trigger** | Časová — každou noc ve 2:00 |
| **Účel** | MiLO se udržuje sám — zálohy, čištění, indexace |
| **Vstupy** | — |
| **Výstupy** | Log. Do ranního briefu pokud problém. |
| **Oddělení** | OPS (zálohy, monitoring) + KNOW (reindexace) |
| **Capability** | C-011 (Zálohování), C-004 (Fulltext ISDS) |
| **Approval** | Ne |
| **QA** | Týdně |
| **Časová úspora** | 30 minut týdně |
| **Frekvence** | Denně (automaticky) |
| **Priorita** | **P2** |

---

### P-018: Nový dokument v Obsidianu

| Pole | Hodnota |
|------|---------|
| **ID** | P-018 |
| **Trigger** | Souborová — změna v Obsidian vault |
| **Účel** | MiLO automaticky indexuje nové poznámky |
| **Vstupy** | Obsidian vault |
| **Výstupy** | Poznámka přidána do unified search indexu |
| **Oddělení** | KNOW |
| **Capability** | C-012 (Obsidian search) |
| **Approval** | Ne |
| **QA** | Týdně |
| **Časová úspora** | 5 minut týdně |
| **Frekvence** | Průběžně |
| **Priorita** | **P2** |

---

### P-019: Vlastník požádá o analýzu dokumentu

| Pole | Hodnota |
|------|---------|
| **ID** | P-019 |
| **Trigger** | Telegram: "Analyzuj [dokument]" |
| **Účel** | Vlastník rozumí dokumentu během minut |
| **Vstupy** | Dokument (PDF, smlouva, rozhodnutí) |
| **Výstupy** | Strukturovaná analýza: typ dokumentu, klíčové body, rizika, lhůty, doporučené akce |
| **Oddělení** | COMM → OC (mise) → KNOW (analýza) → QA (kontrola) |
| **Capability** | C-016 (Dokumentový asistent), C-017 (Právní asistent) |
| **Approval** | Ne pro analýzu. Ano pro akci na základě analýzy. |
| **QA** | Vždy |
| **Časová úspora** | 30-60 minut na dokument |
| **Frekvence** | Týdně |
| **Priorita** | **P1** |

---

### P-020: Kontinuální monitoring infrastruktury

| Pole | Hodnota |
|------|---------|
| **ID** | P-020 |
| **Trigger** | Systémová — každých 60 sekund |
| **Účel** | Vlastník nemusí kontrolovat, jestli vše běží |
| **Vstupy** | Docker, API health, n8n, Supabase |
| **Výstupy** | Do ranního briefu: "✅ Všechny systémy v pořádku" nebo "⚠️ 2 problémy" |
| **Oddělení** | OPS |
| **Capability** | C-014 (Docker monitoring), C-015 (n8n monitoring) |
| **Approval** | Ne |
| **QA** | Týdně |
| **Časová úspora** | 30 minut denně |
| **Frekvence** | Kontinuálně |
| **Priorita** | **P1** |

---

## Procesní dependency graph

```
TRIGGERY:
  Časové:         P-001 (7:00), P-004 (8:00), P-006 (3:00), P-008 (po briefu),
                   P-010 (60min před), P-016 (21:00), P-017 (2:00)
  Příchozí:       P-002 (Gmail), P-003 (ISDS), P-015 (Telegram)
  Systémové:      P-005 (Docker), P-009 (GA4), P-013 (LLM limit), P-014 (n8n),
                   P-020 (kontinuální)
  Souborové:      P-011 (git), P-012 (PDF), P-018 (Obsidian)
  Hlasová/Vlastník: P-007 (právní úkon), P-019 (analýza dokumentu)

CAPABILITY → PROCES:
  C-001 (Unified Inbox)      → P-002, P-015
  C-002 (Brief Telegram)     → P-001, P-016
  C-003 (ISDS lhůty)         → P-003, P-004
  C-004 (Fulltext ISDS)      → P-003, P-017
  C-005 (Prioritizace)       → P-008
  C-007 (Gmail shrnutí)      → P-002
  C-008 (Kalendář)           → P-004, P-008, P-010
  C-009 (GA4/Ads)            → P-009
  C-010 (LLM náklady)        → P-013
  C-011 (Zálohování)         → P-006, P-017
  C-012 (Obsidian search)    → P-018
  C-014 (Docker monitoring)  → P-005, P-020
  C-015 (n8n monitoring)     → P-014, P-020
  C-016 (Dokumentový asist.) → P-003, P-007, P-012, P-019
  C-017 (Právní asistent)    → P-007, P-019
  C-018 (Git report)         → P-011
```

---

## Denní operační model

```
02:00  P-017 Noční údržba — zálohy, reindexace
03:00  P-006  Automatická záloha
07:00  P-001  Ranní briefing — Vlastník se probouzí
08:00  P-004  Kontrola lhůt — jsou blížící se deadliny?
08:05  P-008  Plánování dne — co dnes dělat?

       ─── PRACOVNÍ DOBA ───
       P-020  Kontinuální monitoring (každých 60s)
       P-002  Gmail polling (každých 5min)
       P-003  ISDS polling (každou hodinu)
       P-015  Telegram zprávy (realtime)
       P-005  Docker incidenty (realtime)
       P-009  GA4 anomálie (denně)
       P-011  Git activity (průběžně)

       P-010  Schůzka za 1h (60min před každou)
       P-012  PDF upload (on demand)
       P-007  Právní úkon (on demand)
       P-019  Analýza dokumentu (on demand)

21:00  P-016  Večerní revize — co se dnes udělalo
```

---

## Process Execution Model — Jak Chief operuje

```
1. TRIGGER DETEKOVÁN
   │  Časový / Příchozí / Systémový / Souborový / Hlasový
   ▼
2. IDENTIFIKACE PROCESU
   │  Chief načte Process Catalog → najde odpovídající proces
   ▼
3. AKTIVACE ODDĚLENÍ
   │  Chief notifikuje Department Leady podle procesní definice
   ▼
4. DELEGACE
   │  Department Leadi vytvoří Specialisty/Workery
   ▼
5. EXEKUCE
   │  Workeři vykonají capability
   ▼
6. QUALITY REVIEW
   │  QA zkontroluje výsledek (pokud proces vyžaduje)
   ▼
7. APPROVAL (volitelné)
   │  Pokud proces vyžaduje schválení → fronta → Vlastník
   ▼
8. VÝSTUP
   │  Výsledek doručen Vlastníkovi (Telegram / Dashboard)
   ▼
9. KNOWLEDGE UPDATE
   │  KNOW uloží výsledek, Lessons Learned
   ▼
10. DASHBOARD + BRIEF UPDATE
    │  Dashboard aktualizován, Brief zahrnuje výsledek
```

---

## Top 20 procesů k implementaci

| # | ID | Proces | Priorita | Stav |
|---|-----|--------|----------|------|
| 1 | P-001 | Ranní briefing | P0 | ✅ Existuje |
| 2 | P-015 | Telegram zpráva | P0 | ⚠️ Částečně (3 boti) |
| 3 | P-003 | Nová ISDS zpráva | P0 | ⚠️ Chybí OCR |
| 4 | P-002 | Důležitý email | P0 | ❌ Chybí Gmail |
| 5 | P-004 | Hlídání lhůt | P0 | ❌ Chybí extrakce |
| 6 | P-008 | Plánování dne | P1 | ❌ Chybí integrace |
| 7 | P-005 | Docker pád | P1 | ❌ Chybí monitoring |
| 8 | P-020 | Kontinuální monitoring | P1 | ❌ |
| 9 | P-006 | Automatická záloha | P1 | ❌ |
| 10 | P-012 | PDF upload | P1 | ❌ Chybí OCR |
| 11 | P-019 | Analýza dokumentu | P1 | ❌ |
| 12 | P-007 | Právní úkon | P1 | ❌ |
| 13 | P-009 | GA4 anomálie | P1 | ❌ Chybí integrace |
| 14 | P-010 | Schůzka za 1h | P2 | ❌ Chybí Kalendář |
| 15 | P-011 | Nový commit | P2 | ⚠️ V briefu |
| 16 | P-013 | LLM limit | P2 | ❌ |
| 17 | P-014 | n8n selhání | P2 | ❌ |
| 18 | P-016 | Večerní revize | P2 | ❌ |
| 19 | P-017 | Noční údržba | P2 | ❌ |
| 20 | P-018 | Obsidian indexace | P2 | ❌ |

---

*Tento katalog definuje operační vrstvu MiLO. Capability Backlog je stavební materiál. Procesy jsou to, co Vlastník zažívá.*
