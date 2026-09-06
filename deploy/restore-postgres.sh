#!/bin/bash
set -euo pipefail
FILE="${1:?Gebruik: ./deploy/restore-postgres.sh backups/file.sql.gz}"
cd /opt/alimenta
test -f "$FILE"
read -r -p "DIT OVERSCHRIJFT DATA. Typ RESTORE om door te gaan: " CONFIRM
[ "$CONFIRM" = "RESTORE" ]
gunzip -c "$FILE" | docker compose -f docker-compose.prod.yml exec -T db psql -U ka_app -d kinderalimentatie
echo "Restore voltooid."
