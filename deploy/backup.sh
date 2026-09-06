#!/usr/bin/env bash
set -Eeuo pipefail
cd /opt/alimenta
mkdir -p backups
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
FILE="backups/alimenta-postgres-${STAMP}.sql.gz"
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U ka_app -d kinderalimentatie | gzip > "$FILE"
chmod 600 "$FILE"
find backups -type f -name 'alimenta-postgres-*.sql.gz' -mtime +30 -delete
sha256sum "$FILE" > "$FILE.sha256"
echo "Backup: $FILE"
