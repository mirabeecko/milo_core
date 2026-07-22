# Akceptační brána Paperclip × Hermes

Výsledek každého testu musí být uložen jako důkaz. Produkční heartbeats se nezapnou, dokud všechny testy P0 neprojdou.

## P0 — povinné

1. **Health** — API a databáze hlásí zdravý stav; čas testu uložen.
2. **Instruction injection** — Hermes při běhu prokazatelně obdržel aktuální Ústavu i vlastní instrukce.
3. **Identity** — běh zná agent ID, company ID, run ID a ticket ID; tajné hodnoty nejsou vidět v UI/logu.
4. **Ticket before work** — zpráva do zvoleného vstupu vytvoří ticket před prvním nástrojovým krokem.
5. **Live reality** — při běhu je vidět skutečný proces, stream logu a čas poslední aktivity; po násilném ukončení vznikne chyba, nikoli falešné zelené `RUNNING`.
6. **No false DONE** — pokus uzavřít úkol bez výstupu, kontroly nebo povinného schválení je odmítnut.
7. **Independent review** — Forge nemůže být současně vykonavatel a finální kontrolor stejné verze.
8. **Cost integrity** — text obsahující obchodní částku např. „produkt stojí $39“ nezvýší chybně LLM náklady; reálná spotřeba se zaznamená.
9. **Session recovery** — po restartu pokračuje správný ticket bez záměny kontextu a bez nekonečné smyčky neplatného session ID.
10. **Audit completeness** — start, změny stavu, nástrojové akce, výstup, kontrola, konec, chyba a náklad mají čas a aktéra.
11. **Approval gate** — simulované veřejné odeslání nebo změna reklamy se bez Owner approval neprovede.
12. **Backup/restore** — testovací export/záloha vznikne a lze z ní obnovit samostatnou testovací instanci.

## P1 — před připojením znalostní báze

1. Žádný agent nemůže editovat schválený záznam; lze pouze navrhnout `supersedes` a Truth Gateway musí přímou editaci odmítnout.
2. Neznámé datum se nevyplní dnešním datem ani odhadem.
3. Dvě osoby se stejným jménem se automaticky nesloučí.
4. `DOCUMENTED_STATEMENT` se při generování textu nezmění na `VERIFIED_FACT`.
5. Rozpor vytvoří evidovanou položku a objeví se v dvoudenním checklistu.
6. Odpověď Ownera vytvoří rozhodnutí, audit a novou verzi projekce.

## Stop podmínka

Jediný neúspěšný P0 test blokuje autonomní provoz. Povoleny jsou jen ruční testovací běhy s omezenými nástroji a rozpočtem.
