#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/saas-alimenta}"
cd "$APP_DIR"
FILE="${1:-}"
[[ -n "$FILE" && -f "$FILE" ]] || { echo "Gebruik: alimenta restore $APP_DIR/backups/alimenta-postgres-YYYY...sql.gz" >&2; exit 2; }
[[ "${CONFIRM_RESTORE:-}" == "YES" ]] || { echo "Dit overschrijft de huidige database. Gebruik: CONFIRM_RESTORE=YES alimenta restore FILE" >&2; exit 2; }

if [[ -f "$FILE.sha256" ]]; then sha256sum -c "$FILE.sha256"; fi
gunzip -t "$FILE"

# Always create a fresh safety backup immediately before a restore.
bash deploy/backup.sh

gunzip -c "$FILE" | docker compose -f docker-compose.prod.yml exec -T db psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER:-ka_app}" -d "${POSTGRES_DB:-kinderalimentatie}"

# Verify the service and database after restore. Demo verification is deliberately
# not used here because a real restore must not mutate production data.
BASE_URL="${BASE_URL:-${APP_URL:-http://127.0.0.1}}" bash deploy/ops-check.sh
printf '[OK] restore completed and service checks passed\n'
