#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/alimenta}"
cd "$APP_DIR"

BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
FILE="$BACKUP_DIR/alimenta-postgres-${STAMP}.sql.gz"

# --clean makes the dump suitable for a controlled full restore.
docker compose -f docker-compose.prod.yml exec -T db pg_dump --clean --if-exists -U "${POSTGRES_USER:-ka_app}" -d "${POSTGRES_DB:-kinderalimentatie}" | gzip -9 > "$FILE"
chmod 600 "$FILE"
gunzip -t "$FILE"
sha256sum "$FILE" > "$FILE.sha256"
find "$BACKUP_DIR" -type f -name 'alimenta-postgres-*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name 'alimenta-postgres-*.sql.gz.sha256' -mtime +"$RETENTION_DAYS" -delete
printf 'Backup: %s\nChecksum: %s\n' "$FILE" "$FILE.sha256"
