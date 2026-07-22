# Povinný pracovní protokol

## Životní cyklus ticketu

`INBOX → TRIAGE → READY → IN_PROGRESS → REVIEW → DONE`

Vedlejší stavy: `WAITING_EXTERNAL`, `NEEDS_OWNER`, `BLOCKED`, `FAILED`, `CANCELLED`.

## Krok 1 — příjem

Hermes před prací vytvoří ticket se strukturou:

- `requested_at`, `requested_by`
- `project_id`, `goal_id`, případně `parent_task_id`
- doslovné zadání a stručně normalizovaný cíl
- očekávaný výsledek a Definition of Done
- termín a jeho zdroj
- riziko `LOW | MEDIUM | HIGH | CRITICAL`
- komunikační profil
- vykonavatel a odlišný kontrolor
- rozpočtový limit

## Krok 2 — triage Hermesem

Hermes rozhoduje jen o směrování a procesu:

- dotaz/analýza → Atlas; kontrola Argus,
- provedení akce či vytvoření výstupu → Forge; kontrola Argus,
- příjem dokumentů/faktů → Forge extrahuje a klasifikuje kandidáty, Argus ověří,
- změna zdroje pravdy → Forge navrhne, Argus ověří, Owner schválí, Truth Gateway mechanicky zapíše,
- vývoj → Atlas diagnostikuje, Forge implementuje, Argus testuje,
- chyba → incident + vlastník nápravy; autor chyby není finální kontrolor opravy.

## Krok 3 — práce

Vykonavatel při startu zapíše `started_at`, očekávaný další checkpoint a aktuální činnost. Během práce posílá heartbeat a významné události, nikoli prázdné „stále pracuji“.

## Krok 4 — kontrola

Kontrolor dostane původní zadání, akceptační kritéria, výstup, důkazy a auditní stopu. Nedostane pokyn „potvrď, že je to dobré“. Výsledkem je `PASS`, `PASS_WITH_NOTES` nebo `FAIL` s konkrétními nálezy.

## Krok 5 — uzavření

Hermes ověří mechanickou Definition of Done. Ownerovi oznámí:

- co bylo dokončeno,
- odkaz na výstup,
- kdo vytvořil a kdo ověřil,
- čas startu a dokončení,
- náklady,
- zbývající rizika či návazné úkoly.

## Heartbeat a skutečný monitoring

- `RUNNING`: existuje živý proces/run a přibývají události.
- `IDLE_HEALTHY`: agent nemá přidělenou připravenou práci.
- `STALLED`: agent má `IN_PROGRESS`, ale nepřibyla významná událost v nastaveném okně.
- `OFFLINE`: chybí očekávaný heartbeat nebo proces není živý.
- `ERROR`: poslední běh selhal.
- `PAUSED`: ruční, bezpečnostní nebo rozpočtová stopka.

Zelená nikdy neznamená pouze „agent existuje v konfiguraci“.

## Notifikace

- P0 okamžitě: hrozící ztráta dat, bezpečnostní incident, neautorizovaná vnější akce, právní lhůta do 24 hodin, kritický finanční dopad.
- P1 v denním briefingu: blokovaný prioritní úkol, opakovaná chyba, kritický rozpor ve faktech, deadline do 72 hodin.
- P2 každý druhý den: kontrolní seznam nesrovnalostí a otázek s checkboxy.
- P3 týdně: údržba, nápady, nízkorizikové zlepšení.

Výchozí agregace je v 08:30 Europe/Prague; změna času je uživatelská preference, nikoli změna Ústavy.
