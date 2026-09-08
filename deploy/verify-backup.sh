#!/usr/bin/env bash
set -Eeuo pipefail
cd /opt/alimenta
FILE="${1:-}"
[[ -n "$FILE" && -f "$FILE" ]] || { echo "Gebruik: ./deploy/verify-backup.sh /opt/alimenta/backups/alimenta-postgres-YYYY...sql.gz"; exit 2; }
[[ -f "$FILE.sha256" ]] || { echo "SHA-256 sidecar ontbreekt: $FILE.sha256"; exit 2; }
sha256sum -c "$FILE.sha256"
gunzip -t "$FILE"
echo "Backup integrity OK: $FILE"
