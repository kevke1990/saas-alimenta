#!/usr/bin/env bash
set -u
APP_DIR="${APP_DIR:-/opt/saas-alimenta}"
cd "$APP_DIR"
PASS=0; WARN=0; FAIL=0
ok(){ echo "[OK]   $1"; PASS=$((PASS+1)); }
warn(){ echo "[WARN] $1"; WARN=$((WARN+1)); }
fail(){ echo "[FAIL] $1"; FAIL=$((FAIL+1)); }
source /etc/os-release
[[ "${VERSION_ID:-}" == 13 ]] && ok "Debian 13" || fail "Debian 13 vereist"
command -v docker >/dev/null && ok "Docker aanwezig" || fail "Docker ontbreekt"
docker compose version >/dev/null 2>&1 && ok "Docker Compose plugin" || fail "Compose ontbreekt"
systemctl is-active --quiet docker && ok "Docker service" || fail "Docker service niet actief"
systemctl is-active --quiet nginx && ok "Nginx service" || fail "Nginx niet actief"
systemctl is-active --quiet fail2ban && ok "fail2ban service" || warn "fail2ban niet actief"
ufw status | grep -q 'Status: active' && ok "UFW actief" || warn "UFW niet actief"
[[ -f .env ]] && ok ".env aanwezig" || fail ".env ontbreekt"
[[ -x /usr/local/bin/alimenta ]] && ok "beheer CLI" || warn "CLI ontbreekt"
docker compose -f docker-compose.prod.yml ps --status running | grep -q 'app' && ok "App container draait" || fail "App container draait niet"
docker compose -f docker-compose.prod.yml ps --status running | grep -q 'db' && ok "PostgreSQL container draait" || fail "PostgreSQL draait niet"
if curl -fsS http://127.0.0.1:3000/api/health | jq -e '.ok==true' >/dev/null 2>&1; then ok "App health endpoint"; else fail "App health endpoint"; fi
if [[ -n "${APP_URL:-}" ]] && curl -kfsS --max-time 10 "$APP_URL/api/health" | jq -e '.ok==true' >/dev/null 2>&1; then ok "Publieke HTTPS health"; else warn "Publieke HTTPS health niet bereikbaar (DNS/certificaat/proxy controleren)"; fi
nginx -t >/dev/null 2>&1 && ok "Nginx configuratie" || fail "Nginx configuratie"
if docker compose -f docker-compose.prod.yml exec -T app npx prisma migrate status >/tmp/alimenta-migrate.txt 2>&1; then ok "Prisma migration status"; else warn "Prisma migration status kon niet worden bepaald"; fi
[[ -n "${GOOGLE_AI_API_KEY:-}" || "${AI_PROCESSING_DISABLED:-false}" == "true" ]] && ok "AI configuratie" || warn "AI key ontbreekt en AI is niet disabled"
[[ -n "${STRIPE_SECRET_KEY:-}" ]] && ok "Stripe configuratie" || warn "Stripe nog niet geconfigureerd (test/demo kan zonder)"
[[ -n "${POSTMARK_SERVER_TOKEN:-}" ]] && ok "Postmark configuratie" || warn "Postmark nog niet geconfigureerd"
find backups -type f -name 'alimenta-postgres-*.sql.gz' -mtime -2 | grep -q . && ok "Recente databasebackup" || warn "Geen backup van de laatste 48 uur"
echo
echo "Resultaat: $PASS OK, $WARN waarschuwingen, $FAIL fouten"
[[ $FAIL -eq 0 ]] || exit 1
