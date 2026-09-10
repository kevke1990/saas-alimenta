#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/alimenta}"
cd "$APP_DIR"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

fail=0
ok() { printf '[OK] %s\n' "$1"; }
fail() { printf '[FAIL] %s\n' "$1" >&2; fail=1; }

[[ -f .env ]] && ok 'production .env present' || fail 'production .env missing'
[[ -f "$COMPOSE_FILE" ]] && ok 'production Compose present' || fail 'production Compose missing'

if docker compose -f "$COMPOSE_FILE" config >/dev/null 2>&1; then ok 'Compose configuration valid'; else fail 'Compose configuration invalid'; fi

if docker compose -f "$COMPOSE_FILE" ps --status running --services 2>/dev/null | grep -qx 'db'; then ok 'PostgreSQL container running'; else fail 'PostgreSQL container is not running'; fi
if docker compose -f "$COMPOSE_FILE" ps --status running --services 2>/dev/null | grep -qx 'app'; then ok 'Application container running'; else fail 'Application container is not running'; fi

BASE_URL="${BASE_URL:-${APP_URL:-http://127.0.0.1}}"
BASE_URL="${BASE_URL%/}"
for endpoint in /api/health /api/ready /api/release; do
  if curl --fail --silent --show-error --max-time "${TIMEOUT:-10}" "$BASE_URL$endpoint" >/dev/null; then ok "$endpoint reachable"; else fail "$endpoint failed"; fi
done

if docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U "${POSTGRES_USER:-ka_app}" -d "${POSTGRES_DB:-kinderalimentatie}" >/dev/null 2>&1; then ok 'PostgreSQL accepts connections'; else fail 'PostgreSQL readiness failed'; fi

if [[ -x deploy/validate-production-env.sh ]] && deploy/validate-production-env.sh; then ok 'production environment validated'; else fail 'production environment validation failed'; fi

if [[ "$fail" -ne 0 ]]; then exit 1; fi
echo 'OPERATIONS GO'
