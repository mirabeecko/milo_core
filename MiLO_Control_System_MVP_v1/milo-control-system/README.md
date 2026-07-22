# MiLO Control System — okamžité MVP

Stav návrhu: 2026-07-21, Europe/Prague

Tento balíček je provozní základ systému, v němž je Hermes jediným Chief agentem komunikujícím přímo s vlastníkem. Paperclip slouží jako řídicí podvozek (úkoly, projekty, běhy, heartbeat, náklady, schvalování a audit). MiLO_Core zůstává místem pro doménová data, integrace a pozdější vlastní pohledy. Obsidian vault zůstává čitelnou znalostní vrstvou; schválená fakta se však zapisují pouze přes jedinou řízenou bránu.

Kompletní zdůvodnění, profil potřeb, architektura, dashboard, agentní odpovědnosti, plán MVP a pre-mortem jsou v `MILO_SYSTEM_DESIGN.md`.

## Rozhodnutí pro MVP

1. Nevyvíjet znovu ticketing, heartbeat, live logy, rozpočty a řízení agentů.
2. Použít a připnout Paperclip `v2026.720.0` jako control plane.
3. Použít Hermes `v0.19.0` jako Chief runtime až po záloze a integračních testech.
4. Spustit jen čtyři stálé agenty: Hermes, Atlas, Forge a Argus.
5. Právní, PR, marketingový, vývojový a finanční způsob práce řešit jako schválené profily/skills, nikoli jako dalších dvacet stálých agentů.
6. Každý úkol musí mít vykonavatele a jiného kontrolora.
7. Stav `DONE` nevzniká tvrzením agenta, ale splněním mechanické Definition of Done.
8. Schválený záznam pravdy se nepřepisuje. Oprava vzniká novým záznamem `supersedes`.

## Co lze použít okamžitě

- Agentní instrukce jsou v `agents/`; zápis pravdy dělá deterministická Truth Gateway, nikoli pátý agent.
- Neměnná pravidla jsou v `constitution/CONSTITUTION.md`.
- Povinný životní cyklus práce je v `operations/WORK_PROTOCOL.md`.
- Taxonomie tvrzení a model zdroje pravdy jsou v `knowledge/TRUTH_PROTOCOL.md`.
- Komunikační profily jsou v `communication/PROFILES.yaml`.
- Integrační a akceptační testy jsou v `paperclip/ACCEPTANCE_TESTS.md`.
- Instalační postup je v `paperclip/SETUP.md`.
- Provedené statické a vizuální kontroly a jejich hranice jsou v `VALIDATION_REPORT.md`.

## První provozní cíl

První produkční workflow není „dokončit celý MiLO“. Je to jediný vertikální řez:

> Uživatel zadá Hermesovi úkol → automaticky vznikne ticket → Hermes přidělí práci → je vidět živý běh → vznikne výstup → jiný agent jej zkontroluje → výsledek, náklady, logy a případná chyba jsou dohledatelné → ticket lze označit za hotový pouze s důkazem.

Teprve po úspěchu tohoto řezu se připojí první znalostní workflow pro kauzu TJ Krupka.

## Bezpečná hranice

Tento balíček neobsahuje přístupové údaje a nic automaticky neodesílá třetím osobám. Právní podání, veřejná komunikace, změny reklam, platby, mazání dat a jiné nevratné akce vyžadují schválení vlastníka.
