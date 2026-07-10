#!/usr/bin/env python3
"""MiLO Smart Backup System

Daily backups: keep last 5 UNIQUE versions (skip duplicates)
Weekly backups: keep ALL
Restore from any backup

Spusteni: python3 backup.py [--restore <path>] [--list] [--quiet]
Cron:     0 2 * * * cd /Users/mb/dev/milo-os && python3 backup.py
"""

import argparse
import hashlib
import json
import os
import shutil
import sys
import tarfile
from datetime import datetime, timedelta
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DAILY_DIR = SCRIPT_DIR / "backups" / "daily"
WEEKLY_DIR = SCRIPT_DIR / "backups" / "weekly"
STATE_FILE = SCRIPT_DIR / ".backup-state.json"
MAX_DAILY = 5

# Co zalohovat
BACKUP_PATTERNS = [
    "projects.json",
    "costs.json",
    "analytics.json",
    "models.json",
    "scanner.py",
    "backup.py",
    "dashboard.html",
    "AGENTS.md",
    "supabase_schema.sql",
]


def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)


def load_state():
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {"daily_hashes": [], "daily_files": [], "weekly_files": [], "last_backup": None}


def save_state(state):
    state["last_backup"] = datetime.now().isoformat()
    STATE_FILE.write_text(json.dumps(state, indent=2))


def content_hash(files):
    """Hash obsahu vsech zalohovanych souboru."""
    h = hashlib.sha256()
    for name in sorted(files):
        path = SCRIPT_DIR / name
        if path.exists():
            try:
                h.update(name.encode())
                h.update(path.read_bytes())
            except Exception:
                pass
    return h.hexdigest()


def create_backup(state, weekly=False):
    """Vytvori zalohu. Vrati True pokud byla vytvorena, False pokud duplikatni."""
    existing = [f for f in BACKUP_PATTERNS if (SCRIPT_DIR / f).exists()]
    if not existing:
        log("Zadne soubory k zalohovani")
        return False

    h = content_hash(existing)

    # Kontrola duplicity u dennich zaloh
    if not weekly and h in state.get("daily_hashes", []):
        log("Zadne zmeny od posledni zalohy — preskakuji")
        return False

    ts = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    tag = "weekly" if weekly else "daily"
    archive_name = f"milo-backup-{tag}-{ts}.tar.gz"
    archive_path = (WEEKLY_DIR if weekly else DAILY_DIR) / archive_name

    with tarfile.open(archive_path, "w:gz") as tar:
        for name in existing:
            tar.add(SCRIPT_DIR / name, arcname=name)

    log(f"Zaloha vytvorena: {archive_path}")

    # Aktualizuj state
    if weekly:
        state.setdefault("weekly_files", []).append(str(archive_path))
    else:
        state["daily_hashes"] = (state.get("daily_hashes", []) + [h])
        state.setdefault("daily_files", []).append(str(archive_path))

    save_state(state)
    return True


def cleanup_daily(state):
    """Nech jen poslednich MAX_DAILY dennich zaloh."""
    files = state.get("daily_files", [])
    if len(files) > MAX_DAILY:
        to_remove = files[:-MAX_DAILY]
        for f in to_remove:
            path = Path(f)
            if path.exists():
                path.unlink()
                log(f"Smazana stara zaloha: {path}")
        state["daily_files"] = files[-MAX_DAILY:]
        state["daily_hashes"] = state["daily_hashes"][-MAX_DAILY:]
        save_state(state)


def restore_backup(archive_path):
    """Obnovi zalohu."""
    path = Path(archive_path)
    if not path.exists():
        log(f"Zaloha nenalezena: {archive_path}")
        return False

    log(f"Obnovuji z: {path}")
    with tarfile.open(path, "r:gz") as tar:
        tar.extractall(SCRIPT_DIR)
    log("Obnoveni dokonceno")
    return True


def list_backups():
    """Vypise vsechny existujici zalohy."""
    print("\n=== Daily Backups ===")
    if DAILY_DIR.exists():
        files = sorted(DAILY_DIR.glob("*.tar.gz"))
        for f in files:
            size = f.stat().st_size
            print(f"  {f.name} ({size/1024:.1f} KB)")
    if not list(DAILY_DIR.glob("*.tar.gz")) if DAILY_DIR.exists() else True:
        print("  (zadne)")

    print("\n=== Weekly Backups ===")
    if WEEKLY_DIR.exists():
        files = sorted(WEEKLY_DIR.glob("*.tar.gz"))
        for f in files:
            size = f.stat().st_size
            print(f"  {f.name} ({size/1024:.1f} KB)")
    if not list(WEEKLY_DIR.glob("*.tar.gz")) if WEEKLY_DIR.exists() else True:
        print("  (zadne)")


def is_sunday():
    return datetime.now().weekday() == 6


def main():
    parser = argparse.ArgumentParser(description="MiLO Smart Backup")
    parser.add_argument("--restore", type=str, help="Cesta k backupu pro obnoveni")
    parser.add_argument("--list", action="store_true", help="Vypis existujici zalohy")
    parser.add_argument("--quiet", action="store_true", help="Potlacit vystup")
    args = parser.parse_args()

    DAILY_DIR.mkdir(parents=True, exist_ok=True)
    WEEKLY_DIR.mkdir(parents=True, exist_ok=True)

    state = load_state()

    if args.list:
        list_backups()
        return

    if args.restore:
        restore_backup(args.restore)
        return

    # Bezne zalohovani
    created = create_backup(state, weekly=False)

    if created:
        cleanup_daily(state)

    if is_sunday():
        create_backup(state, weekly=True)

    if not args.quiet:
        dailies = len(state.get("daily_files", []))
        weeklies = len(state.get("weekly_files", []))
        log(f"Hotovo. Dennich zaloh: {dailies}, tydennich: {weeklies}")


if __name__ == "__main__":
    main()
