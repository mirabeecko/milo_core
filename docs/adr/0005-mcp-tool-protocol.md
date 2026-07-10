# ADR-0005: MCP jako standardní protokol nástrojů

**Status:** PROPOSED
**Datum:** 2026-07-08
**Autor:** Chief Orchestrator

---

## Kontext

Agenti v MiLO potřebují přístup k externím nástrojům: datové schránky (ISDS), Google Docs/Sheets/Drive/Gmail/Calendar, souborový systém, shell, Home Assistant, Obsidian.

Tyto nástroje jsou implementovány v různých jazycích (Python — MiLO_ISDS_MCP, TypeScript — google-docs-mcp, shell — voice-ai-terminal tools).

Ústava (kapitola 4.2) vyžaduje, aby každý nástroj byl nahraditelný a aby výpadek nástroje neohrozil MiLO.

## Rozhodnutí

**MCP (Model Context Protocol) je standardní protokol pro všechny nástroje MiLO.**

Každý nástroj je samostatný MCP server:

```
Agent (MiLO) ←→ MCP klient ←→ MCP server (nástroj)
                                    ├── MiLO_ISDS_MCP (Python)
                                    ├── google-docs-mcp (TypeScript, npm)
                                    ├── macos-tools (Python/Shell)
                                    ├── home-assistant (REST→MCP wrapper)
                                    └── ... další
```

### Pravidla integrace

1. **Každý MCP server je samostatný proces.** Jeho pád nesmí ovlivnit agenty ani jiné MCP servery.

2. **MCP server je volitelný.** Agent musí fungovat i bez něj — s degradovanou funkčností, ale bez pádu.

3. **MCP server má definované rozhraní (tools).** Agent zná tools, jejich parametry a návratové typy — přesně podle MCP specifikace.

4. **Nový nástroj = nový MCP server.** Žádné "univerzální nástroje" — každý nástroj má jasně definovanou odpovědnost.

5. **MCP transport: stdio pro lokální, HTTP/SSE pro vzdálené.** Lokální nástroje běží jako child procesy. Vzdálené jako HTTP servery.

### Které nástroje jsou MCP servery

| Nástroj | Status | Jazyk | Transport |
|---------|--------|-------|-----------|
| MiLO_ISDS_MCP | ✅ Existuje | Python | stdio |
| google-docs-mcp | ✅ Existuje (externí) | TypeScript | stdio |
| File system tools | 🔨 Z voice-ai-terminal | Python | stdio |
| Shell/terminal | 🔨 Z voice-ai-terminal | Python | stdio |
| Calendar tools | 🔨 Z voice-ai-terminal | Python | stdio |
| Gmail tools | 🔨 Z voice-ai-terminal | Python | stdio |
| Obsidian tools | 🔨 Z voice-ai-terminal | Python | stdio |
| Home Assistant | 🔨 Z voice-ai-terminal | Python | HTTP→MCP |
| macOS automation | 🔨 Z MiLO_Agent macos_automation.py | Python | stdio |

## Zvažované alternativy

| Alternativa | Plusy | Minusy |
|-------------|-------|--------|
| **Přímé importy** | Žádný protokol, rychlé | Tight coupling, nelze vyměnit, crash propagation |
| **REST API** | Univerzální, známé | Každý nástroj musí implementovat HTTP server, žádná tool discovery |
| **gRPC** | Rychlé, typované | Složitější, méně podpory v AI ekosystému |
| **MCP** ✅ | Tool discovery, standardizované, AI-first, nezávislé procesy | Relativně nový standard, menší ekosystém (rostoucí) |

## Důsledky

### Co bude snazší
- Přidání nového nástroje: vytvoř MCP server → registruj → agenti ho automaticky objeví
- Výměna nástroje: nový MCP server se stejným tool signature → žádná změna v agentech
- Izolace: pád nástroje = pád jednoho procesu, ne MiLO
- Jazyková nezávislost: nástroj v Pythonu, agent v TypeScriptu — MCP to řeší

### Co bude těžší
- Latence: stdio transport přidává overhead (minimální)
- Debugging: samostatné procesy = složitější logování (řešeno: centrální log sběr)
- Verzování: MCP server verze vs. tool signature — nutná zpětná kompatibilita

## Datum revize

2027-01-08

## Reference

- CONSTITUTION.md, kapitola 4.2 — Nahraditelnost
- CONCEPTUAL_MODEL.md — BC-1 (Agent Runtime, ToolBinding)
- MiLO_ISDS_MCP/src/mcp_server.py — referenční implementace
- google-docs-mcp — externí referenční implementace
