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
docker compose -f docker-compose.prod.yml config >/dev/null 2>&1 && ok "Compose config" || bad "Compose config ongeldig"
[[ -f prisma/schema.prisma ]] && ok "Prisma schema" || bad "Prisma schema ontbreekt"
find prisma/migrations -mindepth 1 -maxdepth 1 -type d | grep -q . && ok "Prisma migrations" || bad "Prisma migrations ontbreken"
[[ -f deploy/installer.sh ]] && ok "Installer" || bad "Installer ontbreekt"
[[ -f deploy/doctor.sh ]] && ok "Doctor" || bad "Doctor ontbreekt"
[[ -f deploy/backup.sh ]] && ok "Backup" || bad "Backup ontbreekt"
[[ -f deploy/restore.sh ]] && ok "Restore" || bad "Restore ontbreekt"
[[ -f deploy/update.sh ]] && ok "Update" || bad "Update ontbreekt"
[[ -f deploy/verify-demo.sh ]] && ok "Demo verification" || bad "Demo verification ontbreekt"
exit $fail
