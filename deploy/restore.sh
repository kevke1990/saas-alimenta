#!/usr/bin/env bash
set -Eeuo pipefail
cd /opt/alimenta
FILE="${1:-}"
[[ -n "$FILE" && -f "$FILE" ]] || { echo "Gebruik: alimenta restore /opt/alimenta/backups/alimenta-postgres-YYYY...sql.gz"; exit 2; }
[[ "${CONFIRM_RESTORE:-}" == "YES" ]] || { echo "Dit overschrijft de huidige database. Gebruik: CONFIRM_RESTORE=YES alimenta restore FILE"; exit 2; }
if [[ -f "$FILE.sha256" ]]; then sha256sum -c "$FILE.sha256"; fi
gunzip -t "$FILE"
./deploy/backup.sh
gunzip -c "$FILE" | docker compose -f docker-compose.prod.yml exec -T db psql -U ka_app -d kinderalimentatie
./deploy/verify-demo.sh
