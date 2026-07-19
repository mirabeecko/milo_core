#!/bin/bash
#
# MiLO Workspace — health check & auto-restart
#
# Použití:
#   ./workspace-health.sh              # jednorázový check
#   ./workspace-health.sh --watch       # kontinuální monitoring (každých 30s)
#
# Tento skript:
# 1. Zkontroluje, zda workspace server běží na portu 4002
# 2. Pokud neběží, automaticky ho restartuje
# 3. V --watch modu běží jako daemon

set -e

PORT=4002
API_DIR="/Users/mb/dev/MiLO_Core/apps/api"
LOG_FILE="/tmp/milo-workspace.log"
PID_FILE="/tmp/milo-workspace.pid"
RESTART_COUNT_FILE="/tmp/milo-workspace-restarts"

# ─── Functions ────────────────────────────────────────────────────────

is_running() {
  curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}/workspace/health" 2>/dev/null | grep -q "200"
}

start_server() {
  echo "[$(date '+%H:%M:%S')] Spouštím workspace server..."
  cd "$API_DIR"

  # Kill any existing process on port
  lsof -ti :${PORT} 2>/dev/null | xargs kill -9 2>/dev/null || true
  sleep 1

  # Start new server
  nohup npx tsx src/workspace-server.ts > "$LOG_FILE" 2>&1 &
  PID=$!
  echo "$PID" > "$PID_FILE"

  # Increment restart counter
  local count=0
  [ -f "$RESTART_COUNT_FILE" ] && count=$(cat "$RESTART_COUNT_FILE")
  echo $((count + 1)) > "$RESTART_COUNT_FILE"

  # Wait for ready
  for i in $(seq 1 15); do
    sleep 1
    if is_running; then
      echo "[$(date '+%H:%M:%S')] ✅ Workspace server běží (PID: $PID)"
      return 0
    fi
  done

  echo "[$(date '+%H:%M:%S')] ❌ Workspace server nenastartoval po 15s"
  return 1
}

# ─── Main ─────────────────────────────────────────────────────────────

case "${1:-}" in
  --watch)
    echo "🖥️  MiLO Workspace Health Monitor — kontinuální"
    echo "   Port: $PORT | Interval: 30s | Log: $LOG_FILE"
    echo ""

    while true; do
      if is_running; then
        HEALTH=$(curl -s "http://localhost:${PORT}/workspace/health" 2>/dev/null)
        MISSIONS=$(echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('missionsCount',0))" 2>/dev/null || echo "?")
        echo "[$(date '+%H:%M:%S')] ✅ OK — ${MISSIONS} misí"
      else
        echo "[$(date '+%H:%M:%S')] ❌ Server nedostupný — restartuji..."
        start_server
      fi
      sleep 30
    done
    ;;

  *)
    echo "🖥️  MiLO Workspace Health Check"
    echo ""

    if is_running; then
      HEALTH=$(curl -s "http://localhost:${PORT}/workspace/health" 2>/dev/null)
      echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
      echo ""
      echo "✅ Workspace server běží"
    else
      echo "❌ Workspace server neběží"
      echo ""
      read -p "Spustit nyní? [Y/n] " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]?$|^$ ]]; then
        start_server
      fi
    fi
    ;;
esac
