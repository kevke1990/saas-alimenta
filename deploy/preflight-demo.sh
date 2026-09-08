#!/usr/bin/env bash
set -u
fail=0
ok(){ echo "[OK]   $1"; }
bad(){ echo "[FAIL] $1"; fail=1; }
command -v docker >/dev/null 2>&1 && ok "Docker" || bad "Docker ontbreekt"
docker compose version >/dev/null 2>&1 && ok "Docker Compose" || bad "Docker Compose ontbreekt"
[[ -f .env || -f .env.production || -f deploy/.env.production.example ]] && ok "Environment template" || bad "Environment template ontbreekt"
[[ -f docker-compose.prod.yml ]] && ok "Production Compose" || bad "docker-compose.prod.yml ontbreekt"
[[ -f Dockerfile ]] && ok "Production Dockerfile" || bad "Dockerfile ontbreekt"
docker compose -f docker-compose.prod.yml config >/dev/null 2>&1 && ok "Compose config" || bad "docker-compose.prod.yml ongeldig"
[[ -f prisma/schema.prisma ]] && ok "Prisma schema" || bad "Prisma schema ontbreekt"
find prisma/migrations -mindepth 1 -maxdepth 1 -type d | grep -q . && ok "Prisma migrations" || bad "Prisma migrations ontbreken"
for item in installer doctor backup restore verify-backup update; do
  [[ -f "deploy/${item}.sh" ]] && ok "${item}" || bad "deploy/${item}.sh ontbreekt"
done
[[ -f deploy/verify-demo.sh ]] && ok "Demo verification" || bad "Demo verification ontbreekt"
exit $fail
