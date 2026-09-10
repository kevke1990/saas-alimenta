#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/alimenta}"
cd "$APP_DIR"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

failed=0
ok() { printf '[OK] %s\n' "$1"; }
bad() { printf '[FAIL] %s\n' "$1" >&2; failed=1; }

[[ -f .env ]] && ok 'production .env present' || bad 'production .env missing'
[[ -f "$COMPOSE_FILE" ]] && ok 'production Compose present' || bad 'production Compose missing'

docker compose -f "$COMPOSE_FILE" config >/dev/null 2>&1 && ok 'Compose configuration valid' || bad 'Compose configuration invalid'

docker compose -f "$COMPOSE_FILE" ps --status running --services 2>/dev/null | grep -qx 'db' && ok 'PostgreSQL container running' || bad 'PostgreSQL container is not running'
docker compose -f "$COMPOSE_FILE" ps --status running --services 2>/dev/null | grep -qx 'app' && ok 'Application container running' || bad 'Application container is not running'

BASE_URL="${BASE_URL:-${APP_URL:-http://127.0.0.1}}"
BASE_URL="${BASE_URL%/}"
for endpoint in /api/health /api/ready /api/release; do
  if curl --fail --silent --show-error --max-time "${TIMEOUT:-10}" "$BASE_URL$endpoint" >/dev/null; then ok "$endpoint reachable"; else bad "$endpoint failed"; fi
done

docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U "${POSTGRES_USER:-ka_app}" -d "${POSTGRES_DB:-kinderalimentatie}" >/dev/null 2>&1 && ok 'PostgreSQL accepts connections' || bad 'PostgreSQL readiness failed'

if [[ -f deploy/validate-production-env.sh ]] && bash deploy/validate-production-env.sh; then ok 'production environment validated'; else bad 'production environment validation failed'; fi

(( failed == 0 )) || exit 1
echo 'OPERATIONS GO'
