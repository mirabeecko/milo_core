#!/usr/bin/env python3
"""MiLO Scanner — denni skener projektu v /Users/mb/dev/

Spusteni: python3 scanner.py [--force] [--quiet]
Automaticky: cron kazdy den v 7:00 (0 7 * * *)

Vystupy:
  milo-os/projects.json  — kompletni data o projektech
  milo-os/costs.json     — LLM naklady per projekt/model
  milo-os/analytics.json — GA4/Ads data pro weby
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = Path(os.environ.get("MILO_DEV_ROOT", "/Users/mb/dev"))
DATA_DIR = SCRIPT_DIR  # data files in same dir as scanner
STATE_FILE = SCRIPT_DIR / ".scanner-state.json"
LOG_FILE = SCRIPT_DIR / "scanner.log"

IGNORE_NAMES = {
    ".git", ".venv", ".next", ".vercel", "node_modules", "__pycache__",
    ".claude", ".agents", ".DS_Store", ".dev-status-checker", "milo-os",
    "dist", "build", "target", "coverage", "out", ".turbo", ".cache",
    "test-results", "playwright-report", "storybook-static",
    ".npm", ".yarn", ".pnpm-store", "vendor", "tmp", "temp", "logs",
    ".pytest_cache", ".mypy_cache", ".ruff_cache", ".eslintcache",
    ".env", ".env.local", ".env.example", "aaa_html_status_CHECKER.html"
}

PROJECT_MARKERS = [
    "package.json", "requirements.txt", "pyproject.toml", "Cargo.toml",
    "go.mod", "pom.xml", "build.gradle", "Gemfile", "composer.json",
    "Dockerfile", "docker-compose.yml", "docker-compose.yaml",
    "server.js", "index.html", "main.py", "app.py", "manage.py",
    "next.config.js", "vite.config.js", "tsconfig.json", "AGENTS.md"
]

TECH_MAP = {
    "package.json": ("Node.js", None),
    "requirements.txt": ("Python", None),
    "pyproject.toml": ("Python", None),
    "next.config.js": ("Next.js", "React"),
    "vite.config.js": ("Vite", None),
    "tsconfig.json": ("TypeScript", None),
    "Dockerfile": ("Docker", None),
    "docker-compose.yml": ("Docker", None),
    "Cargo.toml": ("Rust", None),
    "go.mod": ("Go", None),
}

MY_WEBSITES = {
    "tjkrupka.cz": {"ga4": "G-NM6R8S2X39", "ads_id": None},
    "sheskates.cz": {"ga4": "G-HW65YS8115", "ads_id": "AW-18191922314"},
    "webdo24.cz": {"ga4": "G-815XCLCGY8", "ads_id": None},
    "ninja-tyden.cz": {"ga4": "G-KDMZ8KZC3F", "ads_id": None},
}


def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def load_state():
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            return {}
    return {}


def save_state(state):
    state["last_scan"] = datetime.now().isoformat()
    STATE_FILE.write_text(json.dumps(state, indent=2))


def file_hash(path):
    h = hashlib.sha256()
    try:
        with open(path, "rb") as f:
            while chunk := f.read(65536):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return None


def dir_hash(dirpath, max_files=100):
    """Rychly hash adresare — hash nazvu a velikosti souboru."""
    h = hashlib.sha256()
    count = 0
    try:
        for root, dirs, files in os.walk(dirpath):
            dirs[:] = [d for d in dirs if d not in IGNORE_NAMES]
            for name in sorted(files):
                if name in IGNORE_NAMES:
                    continue
                fpath = os.path.join(root, name)
                try:
                    stat = os.stat(fpath)
                    h.update(f"{fpath}:{stat.st_size}:{stat.st_mtime}".encode())
                except OSError:
                    pass
                count += 1
                if count >= max_files:
                    return h.hexdigest()
    except Exception:
        pass
    return h.hexdigest()


def git_info(project_path):
    """Ziska git informace z repozitare."""
    info = {}
    try:
        result = subprocess.run(
            ["git", "remote", "get-url", "origin"],
            cwd=project_path, capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            info["url"] = result.stdout.strip()
    except Exception:
        pass

    try:
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=project_path, capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            info["branch"] = result.stdout.strip()
    except Exception:
        pass

    try:
        result = subprocess.run(
            ["git", "rev-list", "--count", "HEAD"],
            cwd=project_path, capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            info["commit_count"] = int(result.stdout.strip())
    except Exception:
        pass

    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%aI%n%s"],
            cwd=project_path, capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split("\n", 1)
            if lines:
                info["last_commit"] = lines[0]
            if len(lines) > 1:
                info["last_commit_message"] = lines[1]
    except Exception:
        pass

    return info


def detect_tech_stack(project_path):
    """Detekuje technologicky stack podle marker souboru."""
    stack = []
    for marker in PROJECT_MARKERS:
        if (project_path / marker).exists():
            if marker in TECH_MAP:
                primary, secondary = TECH_MAP[marker]
                if primary not in stack:
                    stack.append(primary)
                if secondary and secondary not in stack:
                    stack.append(secondary)
            elif marker == "requirements.txt":
                if "Python" not in stack:
                    stack.append("Python")
            elif marker == "pyproject.toml":
                if "Python" not in stack:
                    stack.append("Python")
            elif marker == "package.json":
                if "Node.js" not in stack:
                    stack.append("Node.js")
                try:
                    pkg = json.loads((project_path / "package.json").read_text())
                    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
                    for dep, label in [("next", "Next.js"), ("react", "React"), ("vue", "Vue"),
                                       ("svelte", "Svelte"), ("express", "Express"),
                                       ("fastify", "Fastify"), ("tailwindcss", "Tailwind")]:
                        if dep in deps and label not in stack:
                            stack.append(label)
                except Exception:
                    pass
            elif marker == "index.html":
                if "HTML" not in stack:
                    stack.append("HTML")
        if len(stack) >= 5:
            break
    return stack[:5]


def detect_llm_costs(project_path):
    """Zkusi najit LLM logy v projektu (LiteLLM log, OpenAI usage)."""
    costs = []
    # Hledej logs s nazvy obsahujici 'litellm' nebo 'openai'
    possible_files = list(project_path.glob("**/*cost*")) + \
                     list(project_path.glob("**/*usage*")) + \
                     list(project_path.glob("**/*litellm*")) + \
                     list(project_path.glob("**/*spend*"))
    for f in possible_files[:3]:
        try:
            content = f.read_text()[:10000]
            # Jednoduchy parser — hleda JSON objekty s token count
            matches = re.findall(r'"total_tokens"\s*:\s*(\d+)', content)
            model_matches = re.findall(r'"model"\s*:\s*"([^"]+)"', content)
            cost_matches = re.findall(r'"cost"\s*:\s*([\d.]+)', content)
            if matches:
                for i, t in enumerate(matches):
                    entry = {
                        "source": f.name,
                        "tokens": int(t),
                        "model": model_matches[i] if i < len(model_matches) else "unknown",
                        "cost_czk": float(cost_matches[i]) if i < len(cost_matches) else 0.0
                    }
                    costs.append(entry)
        except Exception:
            pass
    return costs


def parse_description(project_path):
    """Extrahuje prvni smysluplny radek z README nebo AGENTS.md."""
    for fname in ["README.md", "AGENTS.md", "CLA.md"]:
        readme = project_path / fname
        if readme.exists():
            try:
                lines = readme.read_text().strip().split("\n")
                for line in lines:
                    clean = line.strip().lstrip("#").strip()
                    if clean and len(clean) > 10 and not clean.startswith("http"):
                        return clean[:200]
            except Exception:
                pass
    return ""


def scan_project(project_path, prev_state):
    """Zanalyzuje jeden projekt a vrati dict."""
    path_str = str(project_path)
    name = project_path.name

    # Hash pro detekci zmen
    current_hash = dir_hash(project_path)

    prev = prev_state.get(path_str, {})
    prev_hash = prev.get("hash", "")
    changed = current_hash != prev_hash

    # Git info
    git_data = {}
    if (project_path / ".git").exists():
        git_data = git_info(project_path)

    # Tech stack
    tech_stack = detect_tech_stack(project_path)

    # LLM costs
    llm_costs = detect_llm_costs(project_path)
    total_cost = sum(c.get("cost_czk", 0) for c in llm_costs)

    # Popis
    description = parse_description(project_path)

    # Progres a stav — zachovej z predchoziho scanu nebo ber z CHECKERu
    progress = prev.get("progress", 31)
    rating = prev.get("rating", 3)
    status = prev.get("status", "Rozděláno")
    tags = prev.get("tags", [])

    # Works in progress — z predchoziho + zmeny
    wip = prev.get("works_in_progress", [])
    if changed and not wip:
        wip = ["Změny detekovány — doplň o co jde"]

    return {
        "name": name,
        "path": path_str,
        "type": "project",
        "status": status,
        "progress": progress,
        "rating": rating,
        "description": description or prev.get("description", ""),
        "tags": tags,
        "github": git_data if git_data else None,
        "tech_stack": tech_stack,
        "time_spent": prev.get("time_spent", 0),
        "time_remaining": prev.get("time_remaining", 0),
        "llm_costs": llm_costs,
        "total_cost_czk": total_cost or prev.get("total_cost_czk", 0),
        "estimated_remaining_cost_czk": prev.get("estimated_remaining_cost_czk", 0),
        "changed_since_last": changed,
        "works_in_progress": wip,
        "hash": current_hash,
    }


CONTAINER_DIRS = ["dashboards and agents", "kauza-weby"]

def find_projects():
    """Najde vsechny projekty v ROOT (krome ignorovanych). Prohledne i podadresare kontejneru."""
    projects = []
    try:
        for entry in sorted(ROOT.iterdir()):
            if not entry.is_dir():
                continue
            if entry.name.startswith("."):
                continue
            if entry.name in IGNORE_NAMES:
                continue
            if entry.name == "milo-os":
                continue
            if entry.name.startswith("aaa_html_status_"):
                continue
            projects.append(entry)

            # Prohledej podadresare kontejnerovych slozek
            if entry.name in CONTAINER_DIRS:
                try:
                    for sub in sorted(entry.iterdir()):
                        if sub.is_dir() and not sub.name.startswith("."):
                            if sub.name not in IGNORE_NAMES:
                                projects.append(sub)
                except Exception:
                    pass
    except Exception:
        pass
    return projects


def scan_analytics():
    """Vytvori analytics.json s informacemi o GA4/Ads pro weby."""
    analytics = {
        "updated_at": datetime.now().isoformat(),
        "websites": {}
    }

    for domain, config in MY_WEBSITES.items():
        analytics["websites"][domain] = {
            "ga4_id": config["ga4"],
            "ads_id": config["ads_id"],
            "ga4_data": {"status": "pending", "note": "Credentials not configured. Set GOOGLE_APPLICATION_CREDENTIALS env var."},
            "ads_data": {"status": "pending", "note": "Credentials not configured."},
        }

    # Zkus nacist live-data.json z existujiciho checkeru
    live_data_path = ROOT / ".dev-status-checker" / "live-data.json"
    if live_data_path.exists():
        try:
            live = json.loads(live_data_path.read_text())
            if live.get("ga4"):
                for domain in analytics["websites"]:
                    if hasattr(live["ga4"], "get"):
                        pass  # struktura zavisi na checkeru
        except Exception:
            pass

    return analytics


def load_overrides():
    """Nacte rucni prepisy casu a nakladu."""
    override_file = DATA_DIR / "project-overrides.json"
    if override_file.exists():
        try:
            return json.loads(override_file.read_text()).get("overrides", {})
        except Exception:
            return {}
    return {}


def main():
    parser = argparse.ArgumentParser(description="MiLO Scanner")
    parser.add_argument("--force", action="store_true", help="Vynutit rescan i bez zmen")
    parser.add_argument("--quiet", action="store_true", help="Potlacit vystup")
    args = parser.parse_args()

    if not args.quiet:
        log("MiLO Scanner spusten")

    prev_state = load_state()
    overrides = load_overrides()
    projects = find_projects()

    if not args.quiet:
        log(f"Nalezeno {len(projects)} potencionalnich projektu")

    results = []
    new_state = {}

    for project_path in projects:
        try:
            data = scan_project(project_path, prev_state)
            # Aplikuj rucni prepisy
            override = overrides.get(data["name"], {})
            for key in ["time_spent", "time_remaining", "total_cost_czk", "estimated_remaining_cost_czk"]:
                if override.get(key, 0) > 0:
                    data[key] = override[key]
            results.append(data)
            new_state[str(project_path)] = {
                "hash": data["hash"],
                "progress": data["progress"],
                "rating": data["rating"],
                "status": data["status"],
                "tags": data["tags"],
                "description": data["description"],
                "time_spent": data["time_spent"],
                "time_remaining": data["time_remaining"],
                "total_cost_czk": data["total_cost_czk"],
                "estimated_remaining_cost_czk": data["estimated_remaining_cost_czk"],
                "works_in_progress": data["works_in_progress"],
            }
        except Exception as e:
            log(f"Chyba pri scanovani {project_path.name}: {e}")

    save_state(new_state)

    # Vygeneruj projects.json
    projects_output = {
        "updated_at": datetime.now().isoformat(),
        "total_projects": len(results),
        "changed_projects": [r["name"] for r in results if r["changed_since_last"]],
        "projects": sorted(results, key=lambda x: (-x["progress"], x["name"].lower())),
    }

    (DATA_DIR / "projects.json").write_text(
        json.dumps(projects_output, ensure_ascii=False, indent=2)
    )

    # Vygeneruj costs.json
    all_costs = []
    by_project = {}
    by_model = {}
    for r in results:
        by_project[r["name"]] = {
            "total_cost_czk": r["total_cost_czk"],
            "details": r["llm_costs"],
        }
        for c in r["llm_costs"]:
            model = c.get("model", "unknown")
            by_model[model] = by_model.get(model, 0) + c.get("cost_czk", 0)
            all_costs.append({**c, "project": r["name"]})

    costs_output = {
        "updated_at": datetime.now().isoformat(),
        "total_cost_czk": sum(r["total_cost_czk"] for r in results),
        "by_project": by_project,
        "by_model": {k: round(v, 2) for k, v in sorted(by_model.items(), key=lambda x: -x[1])},
        "all_entries": all_costs,
    }

    (DATA_DIR / "costs.json").write_text(
        json.dumps(costs_output, ensure_ascii=False, indent=2)
    )

    # Vygeneruj analytics.json (jen pokud neexistuje — sync_analytics.py ma prioritu)
    analytics_path = DATA_DIR / "analytics.json"
    if not analytics_path.exists():
        analytics_output = scan_analytics()
        analytics_path.write_text(json.dumps(analytics_output, ensure_ascii=False, indent=2))

    # Vygeneruj data.js — pro nacitani v dashboardu BEZ CORS problemu (file:// prohlizec)
    # Analytics data: pouzij existujici (od sync_analytics.py), jinak skeleton
    if analytics_path.exists():
        analytics_for_js = json.loads(analytics_path.read_text())
    else:
        analytics_for_js = scan_analytics()

    data_js = "window.__MILO_DATA__ = {\n"
    data_js += f'  "projects": {json.dumps(projects_output, ensure_ascii=False)},\n'
    data_js += f'  "costs": {json.dumps(costs_output, ensure_ascii=False)},\n'
    data_js += f'  "analytics": {json.dumps(analytics_for_js, ensure_ascii=False)}\n'
    data_js += "};"
    (DATA_DIR / "data.js").write_text(data_js)

    changed_count = len(projects_output["changed_projects"])
    if not args.quiet:
        log(f"Scan dokoncen: {len(results)} projektu, {changed_count} zmeneno")
        log(f"Vystupy: projects.json, costs.json, analytics.json")

    # Print summary
    if not args.quiet:
        print(f"\n=== MiLO Scanner Summary ===")
        print(f"Projekty: {len(results)}")
        print(f"Zmeneno: {changed_count}")
        print(f"Celkove LLM naklady: {costs_output['total_cost_czk']:.0f} Kc")
        print(f"Vystupy v: {DATA_DIR}/")


if __name__ == "__main__":
    main()
