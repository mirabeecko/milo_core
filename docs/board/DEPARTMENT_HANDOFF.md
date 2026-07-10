# Department Handoff Memo — Bootstrap Complete

**Od:** Chief Orchestrator
**Pro:** Všechna Executive Departments
**Datum:** 2026-07-08
**Status:** Organizace připravena k provozu

---

## Co bylo dokončeno

Organizační základ MiLO je položen. Všechny dokumenty, procesy a šablony existují. Oddělení nyní přebírají odpovědnost za své domény.

## Co každé oddělení přebírá

### OC (Office of the Chief)
- **Vlastní:** ORGANIZATION_CONSTITUTION.md, Executive Backlog, Board meetingy
- **První krok:** Svolat první Board meeting, priorizovat backlog
- **Blokátory:** Žádné — OC je již aktivní (Chief Orchestrator)

### ARCH (Architecture)
- **Vlastní:** ARCHITECTURE.md (skeleton připraven), všechny ADR, coding standards
- **První krok:** Rozpracovat ARCHITECTURE.md části 1-6 (P0-002), zapsat ADR-0006 až ADR-0010
- **Předaná aktiva:** 5 ADR, ARCHITECTURE.md skeleton, Framework Reuse Assessment
- **Blokátory:** Závisí na CONCEPTUAL_MODEL.md (✅ hotovo)

### ENG (Engineering)
- **Vlastní:** Implementace MiLO adaptéru, CI/CD pipeline, API dokumentace
- **První krok:** Po dokončení ARCHITECTURE.md — implementovat OrchestrationProvider + LangGraph adapter (P1-001)
- **Předaná aktiva:** ADR-0001 (monorepo), ADR-0003 (agent state machine), ADR-0011 (framework reuse)
- **Blokátory:** Čeká na ARCHITECTURE.md (P0-002)

### KNOW (Knowledge)
- **Vlastní:** CONCEPTUAL_MODEL.md, Lessons Learned log, znalostní báze, vyhledávání
- **První krok:** Zaindexovat všechny existující dokumenty (P2-002), vytvořit Lessons Learned log
- **Předaná aktiva:** CONCEPTUAL_MODEL.md (✅ hotovo)
- **Blokátory:** Žádné

### COMM (Communications)
- **Vlastní:** Všechny komunikační kanály, styly, pravidla
- **První krok:** Sjednotit Telegram boty (P0-004) — audit existujících botů, plán migrace
- **Předaná aktiva:** Styly a pravidla z MiLO_Agent (agent_os/), tool definitions z voice-ai-terminal
- **Blokátory:** Žádné

### OPS (Operations)
- **Vlastní:** Infrastruktura, monitoring, zálohování, deployment
- **První krok:** Nastavit CI/CD (P1-004) a monitoring (P1-005)
- **Předaná aktiva:** Existující infrastruktura (Supabase projekt, n8n, VPS)
- **Blokátory:** Čeká na ENG (potřebuje co nasazovat)

### QA (Quality)
- **Vlastní:** Testovací strategie, code review, quality metriky
- **První krok:** Vytvořit Lessons Learned log (P2-003), připravit testovací strategii
- **Předaná aktiva:** KPI definice v EXECUTIVE_BOARD_AND_DEPARTMENTS.md
- **Blokátory:** Čeká na ENG (potřebuje co testovat)

---

## Jak oddělení začnou operovat

1. **Každý Department Lead** si přečte svou chartu v EXECUTIVE_BOARD_AND_DEPARTMENTS.md.
2. **Každý Department Lead** vytvoří Department Log (první záznam: "Department aktivován, charter převzat").
3. **OC** svolá první Board meeting — datum: ihned po převzetí.
4. **Na prvním Board meetingu:** potvrzení priorit z Executive Backlogu, přiřazení prvních misí.
5. **Oddělení bez blokátorů** (KNOW, COMM) začínají okamžitě.
6. **Oddělení s blokátory** (ARCH, ENG, OPS, QA) připravují specialisty, dokud nejsou blokátory odstraněny.

---

## Co Chief již nebude dělat

- ❌ Psát dokumentaci — to je KNOW + ARCH
- ❌ Rozhodovat o architektuře — to je ARCH (Chief jen schvaluje ADR)
- ❌ Implementovat — to je ENG
- ❌ Spravovat kanály — to je COMM
- ❌ Monitorovat infrastrukturu — to je OPS
- ❌ Testovat — to je QA

## Co Chief stále dělá

- ✅ Koordinuje Board meetingy
- ✅ Alokuje rozpočet (až bude co alokovat)
- ✅ Reprezentuje MiLO vůči Vlastníkovi
- ✅ Řeší eskalace mezi odděleními
- ✅ Udržuje Organizační ústavu

---

*Tímto memo předávám operativní odpovědnost oddělením.*
*Chief zůstává k dispozici pro eskalace a strategická rozhodnutí.*
