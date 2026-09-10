#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/saas-alimenta}"
cd "$APP_DIR"
CRON_FILE="${CRON_FILE:-/etc/cron.d/alimenta}"
BACKUP_SCHEDULE="${BACKUP_SCHEDULE:-17 2 * * *}"
RETENTION_SCHEDULE="${RETENTION_SCHEDULE:-43 3 * * *}"
CERTBOT_SCHEDULE="${CERTBOT_SCHEDULE:-23 4 * * *}"
DOCUMENT_RETENTION_DAYS="${DOCUMENT_RETENTION_DAYS:-2555}"
AUDIT_RETENTION_DAYS="${AUDIT_RETENTION_DAYS:-2555}"
MAIL_RETENTION_DAYS="${MAIL_RETENTION_DAYS:-2555}"

for value in "$DOCUMENT_RETENTION_DAYS" "$AUDIT_RETENTION_DAYS" "$MAIL_RETENTION_DAYS"; do
  [[ "$value" =~ ^[0-9]+$ ]] && (( value >= 30 && value <= 3650 )) || { echo "Retention moet tussen 30 en 3650 dagen liggen." >&2; exit 2; }
done

cat > "$CRON_FILE" <<EOF
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
$BACKUP_SCHEDULE root cd $APP_DIR && bash deploy/backup.sh >> /var/log/alimenta-backup.log 2>&1
$RETENTION_SCHEDULE root cd $APP_DIR && docker compose -f docker-compose.prod.yml exec -T db psql -U "\${POSTGRES_USER:-ka_app}" -d "\${POSTGRES_DB:-kinderalimentatie}" -v ON_ERROR_STOP=1 -c "DELETE FROM \"Document\" WHERE \"createdAt\" < NOW() - INTERVAL '$DOCUMENT_RETENTION_DAYS days'; DELETE FROM \"AuditLog\" WHERE \"createdAt\" < NOW() - INTERVAL '$AUDIT_RETENTION_DAYS days'; DELETE FROM \"MailLog\" WHERE \"createdAt\" < NOW() - INTERVAL '$MAIL_RETENTION_DAYS days'; DELETE FROM \"MailMessage\" WHERE \"createdAt\" < NOW() - INTERVAL '$MAIL_RETENTION_DAYS days'; DELETE FROM \"RateLimitBucket\" WHERE \"expiresAt\" < NOW();" >> /var/log/alimenta-retention.log 2>&1
$CERTBOT_SCHEDULE cd $APP_DIR && bash deploy/certbot-renew.sh >> /var/log/alimenta-certbot.log 2>&1
EOF
chmod 600 "$CRON_FILE"
touch /var/log/alimenta-backup.log /var/log/alimenta-retention.log /var/log/alimenta-certbot.log
chmod 600 /var/log/alimenta-backup.log /var/log/alimenta-retention.log /var/log/alimenta-certbot.log
if command -v systemctl >/dev/null 2>&1; then systemctl restart cron 2>/dev/null || systemctl restart crond 2>/dev/null || true; fi
echo "Installed scheduled jobs in $CRON_FILE"
