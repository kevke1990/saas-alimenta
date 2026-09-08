#!/usr/bin/env bash
set -Eeuo pipefail

# Resolve the repository root from this script's location so the script works
# regardless of where the application is installed (e.g. /opt/saas-alimenta).
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
cd "$APP_DIR"

FILE="${1:-}"
[[ -n "$FILE" && -f "$FILE" ]] || { echo "Gebruik: ./deploy/verify-backup.sh $APP_DIR/backups/alimenta-postgres-YYYY...sql.gz"; exit 2; }
[[ -f "$FILE.sha256" ]] || { echo "SHA-256 sidecar ontbreekt: $FILE.sha256"; exit 2; }
sha256sum -c "$FILE.sha256"
gunzip -t "$FILE"
echo "Backup integrity OK: $FILE"
