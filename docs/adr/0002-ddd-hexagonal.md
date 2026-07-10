# ADR-0002: DDD + Hexagonální architektura

**Status:** PROPOSED
**Datum:** 2026-07-08
**Autor:** Chief Orchestrator

---

## Kontext

MiLO je komplexní systém s mnoha doménami (agenti, mise, organizace, znalosti, komunikace). Potřebujeme architektonický styl, který:

- udrží doménovou logiku nezávislou na infrastruktuře (Ústava, 4.2 — Nahraditelnost),
- umožní testovat doménovou logiku bez databáze, frameworků nebo LLM,
- jasně oddělí CO systém dělá od JAK to dělá,
- umožní výměnu jakékoli infrastrukturní komponenty bez zásahu do doménové logiky.

## Rozhodnutí

**Používáme Domain-Driven Design (DDD) s hexagonální architekturou (ports & adapters).**

Každý bounded context (definovaný v CONCEPTUAL_MODEL.md) je implementován jako:

```
bounded-context/
├── domain/           ← ČISTÁ doménová logika (entity, value objects, domain services)
│   ├── model.ts      ← entity, agregáty
│   └── ports.ts      ← rozhraní (porty), které doména potřebuje
├── application/      ← aplikační služby (use cases)
│   └── service.ts    ← orchestruje doménu + porty
├── infrastructure/   ← ADAPTÉRY implementující porty
│   ├── supabase-*.ts ← konkrétní implementace repository
│   └── openai-*.ts   ← konkrétní implementace AI provideru
└── index.ts          ← public API bounded contextu
```

**Pravidla:**
1. `domain/` nesmí importovat z `infrastructure/` — nikdy.
2. `domain/` nesmí obsahovat importy z frameworků (Fastify, Next.js, Express).
3. `infrastructure/` implementuje porty definované v `domain/ports.ts`.
4. `application/` spojuje doménu s infrastrukturou přes dependency injection.

## Zvažované alternativy

| Alternativa | Plusy | Minusy |
|-------------|-------|--------|
| **Clean Architecture (Uncle Bob)** | Podobné DDD, vrstvené | Více vrstev, složitější |
| **MVC** | Jednoduché, známé | Doménová logika v controllerech, těžko testovatelné |
| **Event-driven (čistý)** | Skvělé pro async | Overkill pro synchronní operace, složitější debugging |
| **DDD + Hexagonální** ✅ | Doména čistá, porty explicitní, testovatelné, vyměnitelné | Více souborů na začátku, learning curve |

## Důsledky

### Co bude snazší
- Výměna databáze: nový adapter v `infrastructure/`, doména beze změny
- Výměna LLM provideru: nový adapter, doména beze změny
- Testování: doménová logika testovatelná s mock porty
- Onboarding: jasné, kam co patří

### Co bude těžší
- Začátek: více souborů než "jeden soubor na feature"
- Disciplína: vývojáři musí respektovat hranice vrstev
- Dependency injection: vyžaduje explicitní wiring

## Datum revize

2027-01-08

## Reference

- CONSTITUTION.md, kapitola 4 — Nahraditelnost
- CONCEPTUAL_MODEL.md — Bounded Contexts (Část 2)
- FRAMEWORK_REUSE_ASSESSMENT.md — OrchestrationProvider jako port
