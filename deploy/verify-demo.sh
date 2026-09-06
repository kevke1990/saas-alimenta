#!/usr/bin/env bash
set -Eeuo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

fail() { echo "[FAIL] $1" >&2; exit 1; }
ok() { echo "[OK]   $1"; }

[[ -f "$COMPOSE_FILE" ]] || fail "docker-compose.prod.yml ontbreekt"
[[ -f "$ENV_FILE" ]] || fail ".env.production ontbreekt"
command -v docker >/dev/null 2>&1 || fail "Docker ontbreekt"
docker compose version >/dev/null 2>&1 || fail "Docker Compose ontbreekt"

docker compose -f "$COMPOSE_FILE" config >/dev/null || fail "Compose configuratie ongeldig"

docker compose -f "$COMPOSE_FILE" up -d db
for i in $(seq 1 30); do
  if docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U ka_app -d kinderalimentatie >/dev/null 2>&1; then
    break
  fi
  [[ "$i" -eq 30 ]] && fail "PostgreSQL werd niet ready"
  sleep 2
done

docker compose -f "$COMPOSE_FILE" up -d app
for i in $(seq 1 45); do
  if curl --fail --silent http://127.0.0.1:3000/api/health | grep -q '"ok":true'; then
    break
  fi
  [[ "$i" -eq 45 ]] && { docker compose -f "$COMPOSE_FILE" logs --tail=150 app; fail "Applicatie healthcheck faalt"; }
  sleep 2
done

runtime_uid="$(docker compose -f "$COMPOSE_FILE" exec -T app id -u | tr -d '\r\n')"
[[ "$runtime_uid" == "1000" ]] || fail "Applicatie draait niet als non-root UID 1000"

docker compose -f "$COMPOSE_FILE" exec -T app ./node_modules/.bin/prisma migrate status >/dev/null || fail "Prisma migration status faalt"

ok "Compose configuratie"
ok "PostgreSQL health"
ok "Applicatie health"
ok "Non-root runtime"
ok "Prisma migrations"
echo "Demo deployment verification geslaagd."
