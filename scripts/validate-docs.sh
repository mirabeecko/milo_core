#!/usr/bin/env bash
# validate-docs.sh — Validátor registru dokumentace MiLO
# Porovnává "A - INFO ABOUT - ALL DOCUMENTS.md" se skutečným obsahem /docs.
#
# Použití:
#   ./scripts/validate-docs.sh           # Kontrola (exit 1 při chybách)
#   ./scripts/validate-docs.sh --fix     # Ukáže diff mezi registrem a realitou
#   ./scripts/validate-docs.sh --update  # Aktualizuje SHA256 a časová razítka v registru
#   ./scripts/validate-docs.sh --init    # Inicializuje adresářovou strukturu /docs

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REGISTR="$REPO_ROOT/A - INFO ABOUT - ALL DOCUMENTS.md"
DOCS_DIR="$REPO_ROOT/docs"
EXIT_CODE=0
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_ok()  { echo -e "${GREEN}[OK]${NC} $1"; }
log_err() { echo -e "${RED}[CHYBA]${NC} $1"; EXIT_CODE=1; }
log_warn(){ echo -e "${YELLOW}[VAROVÁNÍ]${NC} $1"; }
log_info(){ echo -e "        $1"; }

# ─── Inicializace adresářové struktury ───────────────────────────────
cmd_init() {
    echo "=== Inicializace adresářové struktury /docs ==="
    local dirs=(
        "adr"
        "rfc"
        "api"
        "security"
        "operations"
        "testing"
        "coding-standards"
        "developer-guide"
        "deployment"
        "user-guide"
    )
    for d in "${dirs[@]}"; do
        if [[ ! -d "$DOCS_DIR/$d" ]]; then
            mkdir -p "$DOCS_DIR/$d"
            echo "  Vytvořeno: docs/$d/"
        fi
        if [[ ! -f "$DOCS_DIR/$d/.gitkeep" ]]; then
            touch "$DOCS_DIR/$d/.gitkeep"
        fi
    done
    # Vytvořit šablony pokud neexistují
    if [[ ! -f "$DOCS_DIR/adr/TEMPLATE.md" ]]; then
        cat > "$DOCS_DIR/adr/TEMPLATE.md" << 'TEMPLATE_EOF'
# ADR-NNNN: Název rozhodnutí

**Status:** navrženo | schváleno | zamítnuto | nahrazeno
**Datum:** YYYY-MM-DD
**Autor:** jméno

---

## Kontext

Jaký problém řešíme? Proč je potřeba rozhodnutí?

## Rozhodnutí

Co jsme se rozhodli udělat?

## Zvažované alternativy

| Alternativa | Plusy | Minusy |
|-------------|-------|--------|
| ... | ... | ... |

## Důsledky

### Co bude snazší
- ...

### Co bude těžší
- ...

## Datum revize

YYYY-MM-DD — rozhodnutí přehodnotíme k tomuto datu.

## Reference

- CONSTITUTION.md kapitola X
- ARCHITECTURE.md sekce Y
TEMPLATE_EOF
        echo "  Vytvořeno: docs/adr/TEMPLATE.md"
    fi
    if [[ ! -f "$DOCS_DIR/rfc/TEMPLATE.md" ]]; then
        cat > "$DOCS_DIR/rfc/TEMPLATE.md" << 'TEMPLATE_EOF'
# RFC-NNNN: Název návrhu

**Status:** diskutuje se | schváleno → ADR-NNNN | zamítnuto
**Datum:** YYYY-MM-DD
**Autor:** jméno

---

## Motivace

Proč tuto změnu navrhujeme?

## Návrh

Co přesně navrhujeme změnit?

## Dopad

Které části systému budou ovlivněny?

## Migrační plán

Jak přejdeme ze současného stavu na navrhovaný?

## Alternativy

Co jiného jsme zvažovali?

## Rozhodnutí

(Vyplní se po uzavření RFC.)

Datum: YYYY-MM-DD
Výsledek: schváleno / zamítnuto
Zdůvodnění: ...
TEMPLATE_EOF
        echo "  Vytvořeno: docs/rfc/TEMPLATE.md"
    fi
    echo ""
    echo "Inicializace dokončena."
}

# ─── Hlavní validace ──────────────────────────────────────────────────
cmd_validate() {
    echo "=== Validace registru dokumentace ==="
    echo ""

    # Kontrola 1: Existuje registr?
    if [[ ! -f "$REGISTR" ]]; then
        log_err "Registr '$REGISTR' neexistuje."
        return 1
    fi
    log_ok "Registr existuje: $REGISTR"

    # Kontrola 2: Každý soubor v /docs (kromě .gitkeep a TEMPLATE) musí být v registru
    echo ""
    echo "--- Kontrola neregistrovaných souborů v /docs ---"
    local missing_from_registry=0
    while IFS= read -r -d '' file; do
        local rel="${file#$DOCS_DIR/}"
        # Přeskočit .gitkeep, TEMPLATE.md, README.md
        if [[ "$rel" == *".gitkeep" ]] || [[ "$rel" == *"TEMPLATE.md" ]] || [[ "$(basename "$rel")" == "README.md" ]]; then
            continue
        fi
        if ! grep -qF "$rel" "$REGISTR" 2>/dev/null; then
            log_err "Soubor není v registru: docs/$rel"
            missing_from_registry=1
        fi
    done < <(find "$DOCS_DIR" -type f -print0 2>/dev/null)

    if [[ $missing_from_registry -eq 0 ]]; then
        log_ok "Všechny soubory v /docs jsou zaregistrovány."
    fi

    # Kontrola 3: Každý ✅ HOTOVO soubor v registru musí existovat
    echo ""
    echo "--- Kontrola registrovaných souborů ---"
    local missing_from_disk=0
    while IFS= read -r line; do
        # Hledáme řádky s `✅ HOTOVO` a cestou k souboru
        if echo "$line" | grep -q '✅ HOTOVO'; then
            # Extrahovat cestu — je ve formátu `cesta.md`
            local path_in_registry
            path_in_registry=$(echo "$line" | grep -oE '`[^`]+\.md`' | head -1 | tr -d '`') || true
            if [[ -n "$path_in_registry" ]]; then
                if [[ ! -f "$REPO_ROOT/$path_in_registry" ]]; then
                    log_err "Registrovaný soubor neexistuje: $path_in_registry"
                    missing_from_disk=1
                fi
            fi
        fi
    done < "$REGISTR"

    if [[ $missing_from_disk -eq 0 ]]; then
        log_ok "Všechny registrované soubory existují na disku."
    fi

    # Kontrola 4: Registr má datum poslední aktualizace
    echo ""
    if grep -q "Naposledy aktualizováno:" "$REGISTR"; then
        local last_update
        last_update=$(grep "Naposledy aktualizováno:" "$REGISTR" | head -1)
        log_ok "Registr má datum poslední aktualizace: ${last_update#*: }"
    else
        log_warn "Registr nemá datum poslední aktualizace."
    fi

    # Kontrola 5: Varování pokud je registr starší než poslední změna v /docs
    echo ""
    if [[ -d "$DOCS_DIR" ]]; then
        local last_docs_change
        last_docs_change=$(find "$DOCS_DIR" -type f -name '*.md' -exec stat -f '%m' {} \; 2>/dev/null | sort -rn | head -1)
        local last_registry_change
        last_registry_change=$(stat -f '%m' "$REGISTR" 2>/dev/null)
        if [[ -n "$last_docs_change" ]] && [[ -n "$last_registry_change" ]]; then
            if [[ "$last_docs_change" -gt "$last_registry_change" ]]; then
                log_warn "Některé soubory v /docs jsou novější než registr. Spusť --update pro aktualizaci."
            else
                log_ok "Registr je aktuálnější nebo stejně starý jako soubory v /docs."
            fi
        fi
    fi

    echo ""
    if [[ $EXIT_CODE -eq 0 ]]; then
        echo -e "${GREEN}=== Validace úspěšná. Registr odpovídá skutečnosti. ===${NC}"
    else
        echo -e "${RED}=== Validace selhala. Oprav problémy výše. ===${NC}"
        echo ""
        echo "Nápověda:"
        echo "  ./scripts/validate-docs.sh --fix    — ukáže diff"
        echo "  ./scripts/validate-docs.sh --update — aktualizuje SHA256 a časy"
    fi

    return $EXIT_CODE
}

# ─── Fix mód: vypsat diff ────────────────────────────────────────────
cmd_fix() {
    echo "=== Návrh oprav ==="
    echo ""
    echo "Soubory v /docs, které nejsou v registru:"
    local found=0
    while IFS= read -r -d '' file; do
        local rel="${file#$DOCS_DIR/}"
        if [[ "$rel" == *".gitkeep" ]] || [[ "$rel" == *"TEMPLATE.md" ]] || [[ "$(basename "$rel")" == "README.md" ]]; then
            continue
        fi
        if ! grep -qF "$rel" "$REGISTR" 2>/dev/null; then
            echo "  + docs/$rel  ← přidej do registru"
            found=1
        fi
    done < <(find "$DOCS_DIR" -type f -print0 2>/dev/null)

    if [[ $found -eq 0 ]]; then
        echo "  (žádné neregistrované soubory)"
    fi

    echo ""
    echo "Pro automatickou opravu spusť: ./scripts/validate-docs.sh --update"
}

# ─── Update mód: přepočítat SHA256 a časy ───────────────────────────
cmd_update() {
    echo "=== Aktualizace SHA256 a časových razítek ==="
    echo ""

    local today
    today=$(date +%Y-%m-%d)

    # Pro každý soubor v /docs spočítat SHA256
    while IFS= read -r -d '' file; do
        local rel="${file#$DOCS_DIR/}"
        if [[ "$rel" == *".gitkeep" ]]; then
            continue
        fi
        local sha
        sha=$(shasum -a 256 "$file" 2>/dev/null | cut -d' ' -f1 | head -c 12)
        echo "  docs/$rel → $sha"
    done < <(find "$DOCS_DIR" -type f -print0 2>/dev/null)

    # Aktualizovat datum v registru
    if [[ -f "$REGISTR" ]]; then
        # macOS sed
        sed -i '' "s/Naposledy aktualizováno: .*/Naposledy aktualizováno: $today/" "$REGISTR" 2>/dev/null || \
        sed -i "s/Naposledy aktualizováno: .*/Naposledy aktualizováno: $today/" "$REGISTR"
        log_ok "Datum poslední aktualizace nastaveno na $today."
    fi

    echo ""
    echo "Hotovo. Spusť validaci pro kontrolu: ./scripts/validate-docs.sh"
}

# ─── Main ─────────────────────────────────────────────────────────────
case "${1:-}" in
    --init)   cmd_init ;;
    --fix)    cmd_fix ;;
    --update) cmd_update ;;
    *)
        # Nejprve zkontrolovat, zda docs/ existuje
        if [[ ! -d "$DOCS_DIR" ]]; then
            log_warn "Adresář docs/ neexistuje. Spusť --init pro jeho vytvoření."
        fi
        cmd_validate
        ;;
esac
