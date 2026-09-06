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
  rsync -a --delete --exclude='.env' --exclude='node_modules' --exclude='.next' --exclude='backups/' "$SRC_DIR/" "$APP_DIR/"
fi
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
cd "$APP_DIR"

if [[ -f .env ]]; then
  cp -a .env ".env.backup.$(date -u +%Y%m%dT%H%M%SZ)"
else
  cp deploy/.env.production.example .env
fi
python3 - "$DOMAIN" "$ADMIN_EMAIL_INPUT" <<'PY'
from pathlib import Path
import secrets, sys, re
p=Path('.env'); s=p.read_text()
domain,email=sys.argv[1:]
def val(name): return secrets.token_urlsafe(48)
repls={
 'APP_URL':f'https://{domain}',
 'ADMIN_EMAIL':email,
 'POSTGRES_PASSWORD':val('POSTGRES_PASSWORD'),
 'SESSION_SECRET':val('SESSION_SECRET'),
 'APP_ENCRYPTION_KEY':val('APP_ENCRYPTION_KEY'),
 'ADMIN_PASSWORD':val('ADMIN_PASSWORD'),
 'PRIVACY_HASH_SALT':val('PRIVACY_HASH_SALT'),
 'POSTMARK_INBOUND_SECRET':val('POSTMARK_INBOUND_SECRET'),
 'MAIL_ENCRYPTION_KEY':val('MAIL_ENCRYPTION_KEY'),
 'ADMIN_PATH':'beheer-'+secrets.token_hex(8),
 'ALIMENTA_IMAGE_TAG':'1.3.1',
 'APP_BASE_DOMAIN':domain.split('.',1)[-1] if '.' in domain else domain,
}
for k,v in repls.items():
    s=re.sub(rf'(?m)^{re.escape(k)}=.*$', f'{k}="{v}"', s)
s=s.replace('POSTGRES_PASSWORD="'+repls['POSTGRES_PASSWORD']+'"','POSTGRES_PASSWORD="'+repls['POSTGRES_PASSWORD']+'"')
s=s.replace('DATABASE_URL="postgresql://ka_app:CHANGE-ME@db:5432/kinderalimentatie?schema=public"',f'DATABASE_URL="postgresql://ka_app:{repls["POSTGRES_PASSWORD"]}@db:5432/kinderalimentatie?schema=public"')
p.write_text(s)
print('ADMIN_PASSWORD='+repls['ADMIN_PASSWORD'])
print('ADMIN_PATH='+repls['ADMIN_PATH'])
PY
chmod 600 .env

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
echo "Admin-gegevens staan in $APP_DIR/.env (chmod 600)."
echo "============================================================"
