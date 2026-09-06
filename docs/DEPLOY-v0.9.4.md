# Alimenta Pro v0.9.4 — Debian 13 VPS deployment

Deze handleiding installeert de eerste productieomgeving op één eigen VPS.

## 0. Benodigd

- Debian 13 minimal VPS
- 4 vCPU / 8 GB RAM aanbevolen voor de start
- publiek IPv4-adres
- eigen domein
- Cloudflare-account voor DNS (gratis onderdelen zijn voldoende voor de eerste fase)
- Stripe-account
- Postmark-account voor transactionele e-mail

## 1. DNS

Maak in Cloudflare eerst een record voor bijvoorbeeld:

```text
app.jouwdomein.nl -> A -> VPS-IP
```

Begin voor de installatie eventueel met DNS-only totdat het origin-certificaat werkt. Zet daarna de proxy aan en gebruik HTTPS end-to-end.

## 2. Server voorbereiden

Log als root in:

```bash
ssh root@VPS-IP
```

Maak een beheeraccount:

```bash
adduser alimenta
usermod -aG sudo alimenta
```

Plaats daarna je SSH public key:

```bash
ssh-copy-id alimenta@VPS-IP
```

Test een nieuwe SSH-sessie vóór je root/password-login uitschakelt.

## 3. Basis hardening

```bash
apt update
apt full-upgrade -y
apt install -y ca-certificates curl git unzip nginx certbot python3-certbot-nginx fail2ban ufw unattended-upgrades apt-listchanges
```

Firewall:

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

SSH hardening in `/etc/ssh/sshd_config`:

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Controleer daarna:

```bash
sshd -t
systemctl restart ssh
```

## 4. Docker

Installeer Docker Engine via de officiële Debian-instructies. Controleer daarna:

```bash
docker --version
docker compose version
```

## 5. Applicatie plaatsen

```bash
mkdir -p /opt/alimenta
chown -R alimenta:alimenta /opt/alimenta
cd /opt/alimenta
```

Pak de v0.9.4 ZIP uit in deze directory zodat `docker-compose.prod.yml` en `Dockerfile` direct aanwezig zijn.

## 6. Environment

```bash
cp .env.example .env
chmod 600 .env
nano .env
```

Genereer secrets bijvoorbeeld met:

```bash
openssl rand -base64 64
```

Gebruik verschillende random waarden voor `SESSION_SECRET` en `APP_ENCRYPTION_KEY`.

Zet minimaal:

```env
NODE_ENV=production
APP_URL=https://app.jouwdomein.nl
DATABASE_URL=postgresql://ka_app:ZEERSTERK_WACHTWOORD@db:5432/kinderalimentatie?schema=public
SESSION_SECRET=...
APP_ENCRYPTION_KEY=...
ADMIN_EMAIL=admin@jouwdomein.nl
ADMIN_PASSWORD=...
```

Voor v0.9.4 hoeft de Stripe secret niet per se in `.env`: de adminomgeving kan hem versleuteld opslaan. Een env-key blijft als fallback ondersteund.

## 7. Database password

Dezelfde databasegegevens moeten in `.env` en `docker-compose.prod.yml` logisch op elkaar aansluiten. Gebruik voor productie een uniek random wachtwoord.

## 8. Build/start

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

Migratie/seed:

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma db push
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

v0.9.4 wordt geleverd zonder gegenereerde migration history. Gebruik bij deze eerste installatie `prisma db push` om het schema toe te passen. Zodra je een vaste productieomgeving hebt, pin je schemawijzigingen via gecontroleerde Prisma migrations.

Controle:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 app
```

## 9. Nginx

Gebruik `deploy/nginx.conf` als basis. Proxy uitsluitend naar:

```text
127.0.0.1:3000
```

PostgreSQL blijft alleen binnen het Docker-netwerk bereikbaar.

## 10. TLS

Zorg dat DNS naar de VPS wijst en vraag daarna een certificaat aan:

```bash
certbot --nginx -d app.jouwdomein.nl
```

Test renewal:

```bash
certbot renew --dry-run
```

Cloudflare: gebruik na het werkende origin-certificaat **Full (strict)**.

## 11. Eerste login

Open:

```text
https://app.jouwdomein.nl/login
```

Log in met `ADMIN_EMAIL` en `ADMIN_PASSWORD`.

Open daarna:

```text
https://app.jouwdomein.nl/beheer-7f3c9a2e/stripe
```

## 12. Stripe inrichten

### 12.1 Testmodus

Begin met `sk_test_...`.

Plak de key in **Stripe beheer** en klik **Opslaan**.

Klik daarna **Verbinding testen**.

### 12.2 Producten

Klik **Stripe-producten synchroniseren**. De app maakt de vier producten met jaarlijkse EUR-prijzen aan als ze nog niet bestaan.

### 12.3 Webhook

Maak in Stripe een endpoint:

```text
https://app.jouwdomein.nl/api/stripe/webhook
```

Events:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_failed
```

Kopieer het signing secret (`whsec_...`) naar de adminpagina.

### 12.4 Test een echte checkout

Ga naar `/billing`, kies een plan en voltooi een Stripe testbetaling. Controleer daarna:

- Stripe Customer bestaat.
- Subscription bestaat.
- User krijgt het juiste plan.
- `Subscription` record is gevuld.
- `stripeSubscriptionId` is gevuld.
- customer portal werkt.

## 13. Live gaan

Maak pas daarna de live-sleutel aan.

- vervang de Stripe secret via admin door `sk_live_...`;
- configureer de live webhook;
- gebruik het live `whsec_...`;
- synchroniseer producten/prijzen in live;
- voer een gecontroleerde echte betaling uit.

De Stripe-modus wordt in v0.9.4 afgeleid uit de ingevoerde secret key.

## 14. E-mail

Gebruik Postmark voor transactionele mail. Configureer SPF/DKIM volgens Postmark en voeg een geverifieerde afzender/domain toe. De applicatie gebruikt vervolgens de Postmark API en logt mailstatussen in `MailLog`.

Voor white-label klantdomeinen moet ieder klantdomein afzonderlijk voor verzending worden geverifieerd.

## 15. Backups

Maak een eerste backup:

```bash
./deploy/backup-postgres.sh
```

Sla de backup vervolgens buiten de VPS op. Test regelmatig een restore op een aparte omgeving.

## 16. Updates

```bash
./deploy/backup-postgres.sh
./deploy/update.sh
```

Controleer daarna:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 app
```

## 17. Troubleshooting

### App start niet

```bash
docker compose -f docker-compose.prod.yml logs app
```

### Databaseprobleem

```bash
docker compose -f docker-compose.prod.yml logs db
```

### Stripe webhook 400

Controleer:

1. exacte webhook URL;
2. `whsec_...` uit dezelfde Stripe-modus;
3. serverklok;
4. HTTPS;
5. `APP_ENCRYPTION_KEY` als secret in database is opgeslagen.

### Checkout meldt dat plan niet gekoppeld is

Ga naar admin → Stripe en klik **Stripe-producten synchroniseren**.

## 18. Productie-regel

Vertrouw nooit op een verborgen admin-URL als enige beveiliging. v0.9.4 vereist server-side `isAdmin` én het ingestelde admin-e-mailadres. Voor een echte commerciële omgeving is VPN/Tailscale/WireGuard plus MFA/passkeys voor de adminlaag sterk aanbevolen.
