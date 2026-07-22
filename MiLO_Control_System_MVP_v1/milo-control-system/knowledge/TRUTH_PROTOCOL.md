# Protokol zdroje pravdy

## Zásada

„Neměnný“ neznamená, že se znalostní báze nesmí rozvíjet. Znamená to, že schválená historie se nepřepisuje. Každá další vlna přidá nové záznamy; oprava původní údaj nezničí, ale vytvoří dohledatelné `supersedes`.

## Tři vrstvy

1. **Evidence** — původní soubory, e-maily, fotografie, záznamy a webové zdroje; hash, původ, datum získání. Obsah se neupravuje.
2. **Fact Ledger** — atomická tvrzení a vztahy s typem, stavem, důkazy, autory, kontrolou a schválením. Jediný kanonický zdroj.
3. **Projekce** — timeline, profily osob, shrnutí, podání, PR texty a dashboardy. Lze je kdykoli přegenerovat z Fact Ledgeru; nejsou zdrojem pravdy.

## Povinné typy informace

- `VERIFIED_FACT` — doložitelná skutečnost ve schváleném rozsahu.
- `DOCUMENTED_STATEMENT` — prokazatelný fakt je, že konkrétní osoba/zdroj něco uvedl; pravdivost obsahu může být neověřená.
- `ALLEGATION` — tvrzení o pochybení nebo vině, které není pravomocně potvrzeno.
- `OPINION` — hodnotící soud.
- `EMOTION` — subjektivně prožívaný stav nebo jeho sdělení.
- `LEGAL_ASSESSMENT` — právní názor či kvalifikace, nikoli skutkový fakt.
- `HYPOTHESIS` — vysvětlení nebo motiv k ověření.
- `DECISION` — kdo, kdy a v jakém rozsahu rozhodl.
- `FORECAST` — scénář budoucnosti s předpoklady a horizontem.
- `UNKNOWN` — dosud neurčená klasifikace.

## Atomický záznam

Každý záznam obsahuje nejméně:

- stabilní `record_id` a `project_id`,
- typ a stav `PROPOSED | VERIFIED | APPROVED | DISPUTED | SUPERSEDED | WITHDRAWN`,
- jedinou atomickou větu,
- `occurred_at` a přesnost data/času,
- `recorded_at` a `recorded_by`,
- odkazy na osoby, organizace, místa a události přes stabilní ID,
- `evidence_ids`, přesné lokace ve zdroji a hash zdroje,
- `reviewed_by`, `approved_by`, časy a verze pravidel,
- případné `supports`, `contradicts`, `supersedes` a `derived_from`,
- kryptografický hash záznamu a předchozí hash v append-only proudu.

## Svaté jádro události

Po schválení jsou pole `occurred_at + actors + organizations + action + object` neměnná. Doplnění kontextu je nový navázaný záznam. Oprava je nová verze s `supersedes`; nikdy tichá editace.

## Baseline vlna

1. Forge extrahuje kandidáty.
2. Forge je atomizuje, klasifikuje a propojí s důkazy.
3. Argus kontroluje klasifikaci, identity, data, citace, duplicity a rozpory.
4. Owner schválí odškrtávací seznam.
5. Truth Gateway append-only zapíše přesně schválené položky bez volné interpretace.
6. Vznikne číslovaný manifest a čitelný snapshot, např. `TJ-KRUPKA-BASELINE-0001`.

## Import starých shrnutí

Žádné staré shrnutí se nestane základem automaticky. Každé je zdroj kandidátů. Zachová se původ, vytěží se jednotlivá tvrzení, deduplikují se a teprve po důkazu, nezávislé kontrole a schválení postoupí do Fact Ledgeru. Dobrá část shrnutí se tak neztratí a nepřesnost se nerozmnoží.
