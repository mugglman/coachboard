#!/usr/bin/env bash
# CoachBoard starten (macOS/Linux). Aufruf: ./start.sh
# Optionen: PORT=3001 ./start.sh | PORT_STRICT=1 ./start.sh | NO_BROWSER=1 ./start.sh
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "[CoachBoard] FEHLER: Node.js nicht gefunden. Bitte Node.js 20+ installieren: https://nodejs.org" >&2
  exit 1
fi

exec node scripts/start.mjs
