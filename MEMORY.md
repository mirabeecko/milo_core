# MEMORY.md — MiLO Paměť agentů

## Co si agenti pamatují

- **Projekty** — všechny projekty z /projekty (fáze, priorita, úkoly)
- **SPY_G watchlist** — nápady, gamechangery, témata
- **Delegace** — historie delegací, výsledky, chyby
- **Testy** — výsledky z TESTERu
- **Preference uživatele** — komunikační styl, priority, rozhodnutí

## Co si NEPAMATOVAT

- Dočasné chyby serveru
- Nevyžádané nápady bez schválení
- Nedokončené rozpracované tasky starší 7 dní

## Pravidla paměti

1. Každý nový projekt → automaticky uložit
2. Gamechanger položka → prioritní paměť
3. Dokončený task → archivovat (ne mazat)
4. Chyba → logovat včetně řešení
5. Uživatelské rozhodnutí → persistovat napříč sessionama

## Integrace

- **Hermes memory** — `memory` tool
- **SPY_G** — watchlist automaticky perzistentní
- **Projekty** — v `/tmp/spyg-watchlist.json`
- **Delegace** — v `/tmp/delegation-history.json`
- **Testy** — v `/tmp/milo-test-results.json`
