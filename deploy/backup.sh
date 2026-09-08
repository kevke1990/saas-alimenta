#!/usr/bin/env bash
set -Eeuo pipefail

# Resolve the repository root from this script's location so the script works
# regardless of where the application is installed (e.g. /opt/saas-alimenta).
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
cd "$APP_DIR"

mkdir -p backups
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
FILE="backups/alimenta-postgres-${STAMP}.sql.gz"
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U ka_app -d kinderalimentatie | gzip > "$FILE"
chmod 600 "$FILE"
find backups -type f -name 'alimenta-postgres-*.sql.gz' -mtime +30 -delete
sha256sum "$FILE" > "$FILE.sha256"
echo "Backup: $FILE"
