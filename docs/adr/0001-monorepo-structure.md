# ADR-0001: Monorepo — pnpm workspace

**Status:** PROPOSED
**Datum:** 2026-07-08
**Autor:** Chief Orchestrator
**Kontextový dokument:** CONCEPTUAL_MODEL.md, CONSTITUTION.md (kapitola 4 — Nahraditelnost)

---

## Kontext

MiLO se skládá z více balíčků (agent runtime, tools, AI, shared, database, TTS, design system) a aplikací (web dashboard, CLI). Potřebujeme strukturu repozitáře, která:

- umožňuje sdílet kód mezi balíčky bez duplikace,
- umožňuje nezávislé verzování balíčků,
- umožňuje výměnu jednotlivých balíčků (Ústava, 4.2),
- podporuje TypeScript jako primární jazyk,
- umožňuje budoucí přidání Python balíčků (MiLO_Agent).

## Rozhodnutí

**Používáme pnpm workspace monorepo.**

Struktura:
```
MiLO_Core/
├── pnpm-workspace.yaml
├── package.json              (root — workspace scripts)
├── packages/                 (sdílené knihovny)
│   ├── agents/               (@milo/agents)
│   ├── ai/                   (@milo/ai)
│   ├── shared/               (@milo/shared)
│   ├── database/             (@milo/database)
│   ├── tools/                (@milo/tools)
│   ├── tts/                  (@milo/tts)
│   └── design-system/        (@milo/design-system)
├── apps/                     (aplikace)
│   ├── web/                  (Next.js dashboard)
│   ├── cli/                  (CLI nástroj)
│   └── agent-server/         (Fastify API server — budoucí)
└── services/                 (samostatné služby — budoucí)
    ├── isds-mcp/             (MCP server — z MiLO_ISDS_MCP)
    └── agent-runtime/        (Python agent runtime — z MiLO_Agent)
```

## Zvažované alternativy

| Alternativa | Plusy | Minusy |
|-------------|-------|--------|
| **Nx monorepo** | Pokročilé cachování, graph exec | Složitější konfigurace, vendor lock-in do Nx ekosystému |
| **Turborepo** | Rychlé, jednoduché | Další závislost, méně flexibilní než pnpm |
| **Samostatné repozitáře** | Maximální izolace | Duplikace konfigurace, složitější cross-package vývoj |
| **pnpm workspace** ✅ | Nativní, žádná další závislost, osvědčené | Méně pokročilé cachování než Nx |

## Důsledky

### Co bude snazší
- Sdílení kódu mezi balíčky přes workspace reference (`@milo/shared`)
- Jednotné lintování, testování, build přes root scripts
- Nový vývojář naklonuje jeden repozitář a spustí `pnpm install && pnpm dev`

### Co bude těžší
- CI/CD musí řešit changed-packages detekci (stavět jen změněné balíčky)
- Verzování balíčků vyžaduje disciplínu (changesets nebo manual)
- Velký monorepo může být pomalý bez optimalizace

## Datum revize

2027-01-08 — po prvních 6 měsících provozu vyhodnotit, zda monorepo vyhovuje.

## Reference

- CONSTITUTION.md, kapitola 4 — Nahraditelnost komponent
- CONCEPTUAL_MODEL.md — BC-3 (Organization), BC-1 (Agent Runtime)
