# První operativní mise — specifikace

**Zadáno:** Chief Orchestrator, na základě DR-2026-001
**Datum:** 2026-07-08

---

## M-KNOW-001: Katalogizovat dokumenty + konzistenční review

**Vlastník:** KNOW (Chief Knowledge Officer)
**Deadline:** +7 dní
**Priorita:** P0
**Stav:** 📋 pending

### Cíl

Zaindexovat všechny ústavní, organizační a architektonické dokumenty. Provést konzistenční review terminologie.

### Výstupy

- [ ] **Document Index** — seznam všech dokumentů v MiLO_Core s cestou, verzí, vlastníkem
- [ ] **Authority Hierarchy** — graf který dokument je nadřazený kterému (Ústava > Org. ústava > Konceptuální model > ...)
- [ ] **Terminology Consistency Report** — seznam termínů, jejich definic, a případných konfliktů napříč dokumenty
- [ ] **Duplicate & Contradiction Report** — nalezené duplicity a rozpory

### Akceptační kritéria

- Každý termín v CONCEPTUAL_MODEL.md má právě jednu definici napříč všemi dokumenty.
- Každý dokument má přiřazeného vlastníka (oddělení).
- Nalezené rozpory jsou eskalující — KNOW neopravuje, jen reportuje.

---

## M-COMM-001: Audit Telegram implementací

**Vlastník:** COMM (Chief Communications Officer)
**Deadline:** +7 dní
**Priorita:** P0
**Stav:** 📋 pending

### Cíl

Zmapovat existující Telegram bot implementace napříč projekty. Nezasahovat do nich.

### Výstupy

- [ ] **Inventory** — seznam všech Telegram botů, jejich tokenů, projektů, statusů (běžící/neběžící)
- [ ] **Currently Running** — které boty jsou aktuálně aktivní, na jakém serveru, s jakým webhookem
- [ ] **Duplication Map** — které funkce se překrývají (např. 3 boti umí "vytvořit úkol")
- [ ] **Migration Plan** — doporučený plán sjednocení na jeden kanál (kroky, rizika, rollback)
- [ ] **Risks & Rollback** — co se může pokazit a jak se vrátit

### Akceptační kritéria

- Žádný existující bot nebyl modifikován.
- Plán migrace je technicky proveditelný.
- Rollback plán zaručuje návrat do původního stavu do 1 hodiny.

### READ-ONLY — žádné změny produkčních systémů.

---

## M-ARCH-001: Minimum architektury pro POC

**Vlastník:** ARCH (Chief Architect)
**Deadline:** +14 dní
**Priorita:** P0
**Stav:** 📋 pending
**Blokuje:** M-ENG-001, M-QA-001

### Cíl

Dokončit pouze minimální architekturu potřebnou pro první proof of concept.

### Výstupy

- [ ] **System Boundary** — co POC zahrnuje a co explicitně nezahrnuje
- [ ] **OrchestrationProvider contract** — rozhraní pro orchestrační vrstvu (podle ADR-0011)
- [ ] **MissionLifecycle contract** — stavy mise, přechody, události
- [ ] **AgentRegistry contract** — rozhraní pro registraci a discovery agentů
- [ ] **ApprovalGate contract** — kde a jak se vkládá Owner approval do flow
- [ ] **AuditEvent contract** — struktura události pro audit trail

### Akceptační kritéria

- Každý kontrakt je definován jako TypeScript interface nebo JSON Schema.
- Každý kontrakt má testovatelnou definici (lze validovat).
- Kontrakty jsou provider-agnostic (žádný import z OpenAI, LangGraph, Hermes).

---

## M-ENG-001: Připravit POC — bez exekuce

**Vlastník:** ENG (Chief Engineer)
**Deadline:** +21 dní
**Priorita:** P1
**Stav:** 📋 pending
**Blokuje:** —
**Blokováno:** M-ARCH-001

### Cíl

Připravit kompletní specifikaci proof of concept. NEIMPLEMENTOVAT. Žádná změna souborů bez Owner approval.

### Výstupy

- [ ] **POC Architecture** — diagram komponent: Chief → ENG Lead → Diagnostic Worker → Implementation Worker → QA review
- [ ] **Komponentní specifikace** — pro každou komponentu: vstup, výstup, závislosti
- [ ] **Owner Approval Gates** — přesně kde POC zastaví a počká na schválení
- [ ] **Testovací scénář** — read-only mise: "Zjisti, kolik je v MiLO_Core TypeScript souborů"
- [ ] **Závislosti** — co musí existovat před spuštěním POC
- [ ] **Rizika** — co se může pokazit, fallback plán

### Akceptační kritéria

- Žádný soubor nebyl modifikován.
- Plán je dostatečně detailní, aby ho mohl implementovat jiný vývojář.
- Owner approval gates jsou explicitní — nelze je přeskočit.

---

## M-OPS-001: Připravit infrastrukturu pro POC

**Vlastník:** OPS (Chief Operations Officer)
**Deadline:** +14 dní
**Priorita:** P1
**Stav:** 📋 pending

### Cíl

Definovat runtime a observability požadavky pro POC. Nenasazovat nic.

### Výstupy

- [ ] **Runtime Requirements** — co POC potřebuje k běhu (Node verze, DB, MCP servery)
- [ ] **Observability Plan** — co se bude monitorovat, jaké metriky, jaké alerty
- [ ] **Deployment Plan** — jak a kam se POC nasadí (lokálně, Docker, VPS)
- [ ] **Infrastructure-as-Code** — Docker Compose nebo ekvivalent pro lokální vývoj

### Akceptační kritéria

- Vývojář může spustit POC lokálně podle deployment planu.
- Monitoring ukazuje health komponent.
- Nic není nasazeno do produkce.

---

## M-QA-001: Akceptační kritéria pro POC

**Vlastník:** QA (Chief Quality Officer)
**Deadline:** +14 dní
**Priorita:** P1
**Stav:** 📋 pending
**Blokováno částečně:** M-ARCH-001 (kontrakty), M-ENG-001 (specifikace)

### Cíl

Vytvořit nezávislý testovací plán a akceptační kritéria pro POC.

### Výstupy

- [ ] **Acceptance Criteria** — co musí POC splňovat, aby prošel QA
- [ ] **Test Plan** — testovací scénáře, vstupy, očekávané výstupy
- [ ] **Independent Review Process** — jak QA ověří POC nezávisle na ENG
- [ ] **Audit Trail Validation** — jak ověřit, že všechny kroky zanechaly auditní stopu
- [ ] **Restart Test** — scénář: zabij proces → restartuj → ověř, že stav je obnovitelný

### Akceptační kritéria

- Testovací plán lze spustit bez ENG asistence.
- Každé akceptační kritérium je měřitelné (pass/fail).
- Audit trail validace pokrývá všech 8 kroků aktivační validace (Fáze 6).
