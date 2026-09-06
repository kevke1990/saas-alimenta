#!/usr/bin/env bash
set -Eeuo pipefail
trap 'echo "INSTALLATIE MISLUKT op regel $LINENO. Controleer de log hierboven." >&2' ERR

APP_DIR="/opt/alimenta"
APP_USER="alimenta"
DOMAIN="${ALIMENTA_DOMAIN:-}"
ADMIN_EMAIL_INPUT="${ALIMENTA_ADMIN_EMAIL:-}"

[[ $(id -u) -eq 0 ]] || { echo "Voer uit als root: sudo bash deploy/installer.sh"; exit 1; }
source /etc/os-release
[[ "${ID:-}" == "debian" && "${VERSION_ID%%.*}" == "13" ]] || { echo "Deze installer ondersteunt Debian 13 (Trixie). Gevonden: ${PRETTY_NAME:-onbekend}"; exit 1; }
ARCH="$(dpkg --print-architecture)"
[[ "$ARCH" == "amd64" || "$ARCH" == "arm64" ]] || { echo "Niet-ondersteunde architectuur: $ARCH"; exit 1; }

read -rp "Publiek domein voor Alimenta Pro (bv. app.example.nl): " DOMAIN_INPUT
DOMAIN="${DOMAIN_INPUT:-$DOMAIN}"
[[ "$DOMAIN" =~ ^[A-Za-z0-9.-]+$ ]] || { echo "Ongeldig domein."; exit 1; }
read -rp "Admin e-mail [admin@${DOMAIN#*.}]: " ADMIN_EMAIL_INPUT
ADMIN_EMAIL_INPUT="${ADMIN_EMAIL_INPUT:-admin@${DOMAIN#*.}}"

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get full-upgrade -y
DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl gnupg unzip openssl jq rsync nginx certbot python3-certbot-nginx fail2ban ufw unattended-upgrades

install -m 0755 -d /etc/apt/keyrings
if [[ ! -f /etc/apt/keyrings/docker.asc ]]; then curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc; fi
chmod a+r /etc/apt/keyrings/docker.asc
cat >/etc/apt/sources.list.d/docker.sources <<SRC
Types: deb
URIs: https://download.docker.com/linux/debian
Suites: trixie
Components: stable
Architectures: ${ARCH}
Signed-By: /etc/apt/keyrings/docker.asc
SRC
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker nginx fail2ban unattended-upgrades

id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --home-dir "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
usermod -aG docker "$APP_USER"
install -d -o "$APP_USER" -g "$APP_USER" -m 0750 "$APP_DIR" "$APP_DIR/backups" "$APP_DIR/secrets"

ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

cat >/etc/sysctl.d/99-alimenta-hardening.conf <<SYSCTL
net.ipv4.conf.all.rp_filter=1
net.ipv4.conf.default.rp_filter=1
net.ipv4.tcp_syncookies=1
kernel.kptr_restrict=2
kernel.dmesg_restrict=1
SYSCTL
sysctl --system >/dev/null

# If the installer is run from the extracted application directory, deploy that exact source.
SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [[ "$SRC_DIR" != "$APP_DIR" ]]; then
  rsync -a --delete --exclude='.env' --exclude='.env.production' --exclude='node_modules' --exclude='.next' --exclude='backups/' "$SRC_DIR/" "$APP_DIR/"
fi
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
cd "$APP_DIR"

# Compose expects .env.production for the application and .env for interpolation.
# Keep one authoritative secret file and expose it through a local symlink.
if [[ -f .env.production ]]; then
  cp -a .env.production ".env.production.backup.$(date -u +%Y%m%dT%H%M%SZ)"
elif [[ -f .env && ! -L .env ]]; then
  cp -a .env .env.production
  cp -a .env ".env.backup.$(date -u +%Y%m%dT%H%M%SZ)"
elif [[ ! -e .env.production ]]; then
  cp deploy/.env.production.example .env.production
fi
rm -f .env
ln -s .env.production .env
python3 - "$DOMAIN" "$ADMIN_EMAIL_INPUT" <<'PY'
from pathlib import Path
import secrets, sys, re
p=Path('.env.production'); s=p.read_text()
domain,email=sys.argv[1:]
def val(): return secrets.token_urlsafe(48)
current={}
for line in s.splitlines():
    if "=" in line and not line.lstrip().startswith("#"):
        k,v=line.split("=",1); current[k]=v.strip().strip('"')
def setv(k,v,generate=False):
    old=current.get(k,"")
    if generate and old and old not in {"GENERATE-ME","CHANGE-ME"} and not old.startswith("GENERATE-"): return old
    return v
repls={
 'APP_URL':f'https://{domain}',
 'ADMIN_EMAIL':email,
 'POSTGRES_PASSWORD':setv('POSTGRES_PASSWORD',val(),True),
 'SESSION_SECRET':setv('SESSION_SECRET',val(),True),
 'APP_ENCRYPTION_KEY':setv('APP_ENCRYPTION_KEY',val(),True),
 'ADMIN_PASSWORD':setv('ADMIN_PASSWORD',val(),True),
 'PRIVACY_HASH_SALT':setv('PRIVACY_HASH_SALT',val(),True),
 'POSTMARK_INBOUND_SECRET':setv('POSTMARK_INBOUND_SECRET',val(),True),
 'MAIL_ENCRYPTION_KEY':setv('MAIL_ENCRYPTION_KEY',val(),True),
 'ADMIN_PATH':setv('ADMIN_PATH','beheer-'+secrets.token_hex(8),True),
 'ALIMENTA_IMAGE_TAG':'1.3.1-rc1',
 'DEMO_MODE':'true',
 'APP_BASE_DOMAIN':domain.split('.',1)[-1] if '.' in domain else domain,
}
for k,v in repls.items():
    if re.search(rf'(?m)^{re.escape(k)}=.*$', s): s=re.sub(rf'(?m)^{re.escape(k)}=.*$', f'{k}="{v}"', s)
    else: s += f'\n{k}="{v}"\n'
s=re.sub(r'DATABASE_URL="[^"]+"',f'DATABASE_URL="postgresql://ka_app:{repls["POSTGRES_PASSWORD"]}@db:5432/kinderalimentatie?schema=public"',s)
p.write_text(s)
print('ADMIN_PASSWORD='+repls['ADMIN_PASSWORD'])
print('ADMIN_PATH='+repls['ADMIN_PATH'])
PY
chmod 600 .env.production

# Validate compose before doing anything destructive.
docker compose -f docker-compose.prod.yml config >/dev/null

# Build and start database first, then migrate, then app.
docker compose -f docker-compose.prod.yml up -d db
docker compose -f docker-compose.prod.yml exec -T db pg_isready -U ka_app -d kinderalimentatie >/dev/null

docker compose -f docker-compose.prod.yml build --pull app
docker compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy
docker compose -f docker-compose.prod.yml up -d app

# Initialize the admin account and standard plans.
docker compose -f docker-compose.prod.yml run --rm app npx prisma db seed

read -rp "Fictieve demo-data aanmaken? [J/n]: " DEMO_ANSWER
if [[ ! "$DEMO_ANSWER" =~ ^[Nn]$ ]]; then
  docker compose -f docker-compose.prod.yml run --rm app npm run db:seed:demo
fi

# Local health check with retry.
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3000/api/health | jq -e '.ok==true' >/dev/null 2>&1; then break; fi
  [[ $i -eq 30 ]] && { echo "App healthcheck faalt."; docker compose -f docker-compose.prod.yml logs --tail=100 app; exit 1; }
  sleep 2
done

# HTTP-only nginx bootstrap; certbot will switch it to HTTPS.
cat >/etc/nginx/sites-available/alimenta.conf <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX
ln -sf /etc/nginx/sites-available/alimenta.conf /etc/nginx/sites-enabled/alimenta.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

if getent ahosts "$DOMAIN" >/dev/null 2>&1; then
  if certbot --nginx --non-interactive --agree-tos --redirect --hsts --staple-ocsp -m "$ADMIN_EMAIL_INPUT" -d "$DOMAIN"; then
    echo "HTTPS certificaat geïnstalleerd voor $DOMAIN"
  else
    echo "WAARSCHUWING: Certbot kon geen certificaat uitgeven. DNS/poort 80 controleren." >&2
  fi
else
  echo "WAARSCHUWING: DNS voor $DOMAIN resolveert nog niet; HTTPS wordt overgeslagen." >&2
fi

# Install management CLI.
install -m 0755 deploy/alimenta /usr/local/bin/alimenta
chown root:root /usr/local/bin/alimenta

# Persist installer output without exposing it in normal output.
cat > "$APP_DIR/secrets/install-info.txt" <<INFO
Alimenta Pro v1.3.1
Domein: $DOMAIN
Admin: $ADMIN_EMAIL_INPUT
Geïnstalleerd: $(date -u +%FT%TZ)
INFO
chmod 600 "$APP_DIR/secrets/install-info.txt"

echo
echo "============================================================"
echo "Alimenta Pro v1.3.1 installatie voltooid"
echo "URL: https://$DOMAIN"
echo "Beheer CLI: alimenta doctor | status | logs | backup | update | restore"
echo "Admin-gegevens staan in $APP_DIR/.env.production (chmod 600)."
echo "============================================================"

# v1.3.1 security completion: daily retention job (idempotent)
install -d -m 0750 /opt/alimenta/scripts
cp -f scripts/retention.ts /opt/alimenta/scripts/retention.ts 2>/dev/null || true
cat >/etc/cron.d/alimenta-retention <<'EOF'
17 3 * * * alimenta cd /opt/alimenta && /usr/bin/docker compose run --rm app npm run db:retention >> /var/log/alimenta-retention.log 2>&1
EOF
chmod 0644 /etc/cron.d/alimenta-retention
