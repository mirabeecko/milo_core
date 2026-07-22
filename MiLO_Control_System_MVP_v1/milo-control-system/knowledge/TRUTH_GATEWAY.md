# Truth Gateway — deterministický jediný zapisovatel

Truth Gateway není agent a nic neinterpretuje. Je to malá služba v existujícím `apps/api`/`packages/*`, která přijme pouze strukturovaný návrh a technicky vynutí pravidla zdroje pravdy.

## Jediné povolené operace

- `submit_candidate` — uloží kandidáta mimo schválený Fact Ledger,
- `record_review` — připojí výsledek Argusu,
- `record_owner_decision` — připojí schválení nebo zamítnutí Ownera,
- `append_record` — přidá nový schválený záznam,
- `append_relation` — přidá `supports`, `contradicts`, `supersedes` nebo `derived_from`,
- `seal_snapshot` — vytvoří manifest, hash a čitelnou projekci.

Neexistuje operace `update_approved_record` ani `delete_approved_record`.

## Vynucené podmínky zápisu

Před `append_record` musí platit:

- kandidát má stabilní ID a jedinou atomickou větu,
- zdrojové evidence existují a jejich hashe souhlasí,
- Argus není autorem kandidáta a udělil `PASS`,
- u zásadního nebo sporného záznamu existuje Owner approval,
- všechny osoby a organizace odkazují na jednoznačná ID,
- neznámá data zůstávají explicitně neznámá,
- oprava odkazuje na původní ID přes `supersedes/corrects`,
- čas, aktér, verze pravidel a auditní run jsou vyplněny.

## Uložení

Kanonický proud je append-only a hash-chain. Vyhledávací databáze a Obsidian stránky jsou projekce, které lze z proudu znovu vytvořit. Zápis probíhá transakčně: buď vznikne záznam, auditní událost a nová projekce společně, nebo nevznikne nic.

## Bezpečnostní vlastnost

LLM může navrhnout chybný fakt, ale nemá technické oprávnění přepsat historii ani obejít review/approval. Truth Gateway přijímá pouze platný strukturovaný kontrakt; volný text je odmítnut.
