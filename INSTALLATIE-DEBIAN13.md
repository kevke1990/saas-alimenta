# Kinderalimentatie Pro V7 — Debian 13 productie-installatie

## 0. Belangrijk vooraf

V7 is ontworpen als productiegerichte SaaS-basis. "Volledig veilig" kan geen softwareproject garanderen; veiligheid is een proces. Gebruik daarom deze handleiding als baseline en voer vóór verkoop een externe security review/penetratietest uit.

De applicatie draait achter Nginx. PostgreSQL is niet publiek bereikbaar. De Next.js-container luistert alleen op 127.0.0.1. TLS wordt door Let's Encrypt/Certbot beheerd.

## 1. Server

Gebruik een verse Debian 13 (Trixie) installatie. Debian 13 is de huidige stable release.

Log één keer in als root via de VPS-console. Maak daarna een normale beheerder:

```bash
adduser deploy
usermod -aG sudo deploy
```

Kopieer je SSH-sleutel:

```bash
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Test in een NIEUWE terminal dat `deploy` kan inloggen voordat je root-SSH uitschakelt.

## 2. SSH hardening

Maak `/etc/ssh/sshd_config.d/99-kinderalimentatie.conf`:

```text
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 20
X11Forwarding no
AllowUsers deploy
```

Controleer:

```bash
sshd -t
systemctl reload ssh
```

Laat je bestaande root-sessie open totdat je de nieuwe SSH-login hebt getest.

## 3. Updates

```bash
apt update
apt full-upgrade -y
apt install -y unattended-upgrades apt-listchanges
dpkg-reconfigure unattended-upgrades
```

Controle:

```bash
systemctl status unattended-upgrades
```

Debian adviseert unattended-upgrades voor automatische beveiligingsupdates.

## 4. Firewall

V7 levert `deploy/nftables.conf`.

Installeer:

```bash
cp deploy/nftables.conf /etc/nftables.conf
nft -f /etc/nftables.conf
systemctl enable --now nftables
```

Open uitsluitend:
- TCP 22 — SSH (bij voorkeur verder beperkt via provider/VPN)
- TCP 80 — Let's Encrypt/redirect
- TCP 443 — HTTPS

Poort 3000 en PostgreSQL 5432 mogen NIET via internet bereikbaar zijn.

Controle:

```bash
ss -lntup
nft list ruleset
```

## 5. Fail2ban

```bash
apt install -y fail2ban
cp deploy/fail2ban-jail.local /etc/fail2ban/jail.local
systemctl restart fail2ban
fail2ban-client status sshd
```

## 6. Docker

Installeer Docker uitsluitend via de officiële Docker Debian instructies of het officiële Docker repository. Voeg `deploy` alleen aan de docker-groep toe als je de consequenties begrijpt; lidmaatschap van `docker` is in de praktijk root-equivalent.

Aanbevolen voor extra hardening: laat deployment uitvoeren via een aparte CI/deploy user en houd dagelijkse accounts buiten de docker-groep.

Controle:

```bash
docker version
docker compose version
```

## 7. DNS

Maak bij je DNS-provider:

```text
A     app.jouwdomein.nl     <IPv4-VPS>
AAAA  app.jouwdomein.nl     <IPv6-VPS>
```

Gebruik alleen AAAA als IPv6 op de server daadwerkelijk correct is gefirewalled.

Controle:

```bash
dig +short app.jouwdomein.nl
```

## 8. Let's Encrypt

V7 gebruikt Nginx + Certbot.

Kopieer de Nginx-config en pas de domeinnaam aan:

```bash
cp deploy/nginx.conf /etc/nginx/sites-available/kinderalimentatie
nano /etc/nginx/sites-available/kinderalimentatie
ln -s /etc/nginx/sites-available/kinderalimentatie /etc/nginx/sites-enabled/kinderalimentatie
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Maak eerst de challenge-directory:

```bash
mkdir -p /var/www/certbot
```

Vraag het certificaat aan:

```bash
certbot certonly --webroot -w /var/www/certbot \
  -d app.jouwdomein.nl \
  --email jouw-email@domein.nl \
  --agree-tos --no-eff-email
```

Daarna:

```bash
nginx -t
systemctl reload nginx
```

Test vernieuwing:

```bash
certbot renew --dry-run
```

Certbot/Let's Encrypt gebruikt een automatische renewal flow; controleer periodiek dat renewal werkelijk werkt.

## 9. Applicatie

Pak de V7 ZIP uit naar bijvoorbeeld:

```text
/opt/kinderalimentatie-pro
```

Gebruik een aparte deploy-eigenaar:

```bash
mkdir -p /opt/kinderalimentatie-pro
chown -R deploy:deploy /opt/kinderalimentatie-pro
```

Kopieer de broncode daarheen.

Maak `.env`:

```bash
cp .env.example .env
chmod 600 .env
nano .env
```

Genereer een echte session secret:

```bash
openssl rand -base64 64
```

Zet deze waarde in `SESSION_SECRET`.

Gebruik NOOIT de voorbeeldwachtwoorden.

## 10. PostgreSQL

Gebruik in productie een unieke database user en een sterk wachtwoord.

De database mag alleen intern beschikbaar zijn. Publiceer 5432 niet.

Voor de definitieve productieopzet verdient een managed PostgreSQL of een afzonderlijke database-VPS de voorkeur boven database en applicatie op dezelfde machine.

## 11. Prisma

Na configuratie:

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy
```

Seed alleen op een nieuwe installatie:

```bash
docker compose -f docker-compose.prod.yml run --rm app npm run db:seed
```

## 12. Admin backend

De adminomgeving staat expres NIET onder `/admin`.

De standaard interne route is:

```text
/BEHEER-PAD
```

waarbij V7 standaard een willekeurig-ogend pad gebruikt:

```text
/beheer-7f3c9a2e
```

Wijzig dit vóór livegang via `ADMIN_PATH` en houd het pad buiten publieke documentatie.

**Maar:** dit is geen echte beveiligingslaag. De adminomgeving blijft beschermd door server-side authenticatie en autorisatie. Security by obscurity alleen is onveilig.

Voor maximale bescherming kun je het adminpad bovendien uitsluitend via VPN/Tailscale/WireGuard toegankelijk maken.

## 13. Admin-account

Gebruik een uniek admin-e-mailadres en een lang wachtwoord.

Het admin-account moet:
- alleen voor beheer worden gebruikt;
- geen dagelijks gebruikersaccount zijn;
- MFA krijgen zodra de MFA-module wordt geactiveerd;
- niet gedeeld worden;
- via VPN/IP allowlisting bereikbaar zijn waar mogelijk.

## 14. Stripe

Maak in Stripe de vier jaarproducten/prices aan:

- Professional €249/jaar
- Practice 20 €495/jaar
- Practice 50 €895/jaar
- Enterprise €1.495/jaar

Alle prijzen exclusief btw.

Zet de Price IDs in `.env`.

Gebruik de Stripe webhook signing secret. Controleer dat de webhook alleen events accepteert waarvan de signature geldig is.

## 15. Backups

Een backup is pas betrouwbaar als een restore getest is.

Maak minimaal:
- dagelijkse PostgreSQL backup;
- meerdere versies;
- één kopie buiten de VPS;
- versleutelde backup;
- periodieke restore-test.

Bewaar nooit de enige backup op dezelfde VPS.

## 16. Monitoring

Controleer:
```bash
systemctl status nginx
systemctl status fail2ban
systemctl status nftables
docker compose -f docker-compose.prod.yml ps
journalctl -u nginx --since today
```

Monitor daarnaast:
- diskruimte;
- RAM;
- databasegroei;
- failed logins;
- 5xx-responses;
- certificaat expiry;
- Docker image vulnerabilities;
- Debian security advisories.

## 17. Updates

Voor OS:

```bash
apt update
apt upgrade
```

Voor Node/Next.js:
- gebruik alleen stable/LTS releases;
- test updates eerst;
- maak DB backup;
- deploy daarna;
- controleer smoke tests.

Next.js adviseert productie op een actuele Active LTS of Maintenance LTS release te draaien.

## 18. Securityregels voor de applicatie

Nooit:
- databasepoort publiceren;
- `.env` committen;
- Stripe secret in browsercode zetten;
- password hashes loggen;
- persoonsgegevens in normale application logs zetten;
- admin-only routes alleen met een verborgen URL beschermen;
- `npm audit` als enige securitycontrole gebruiken.

Altijd:
- server-side authorization;
- tenant/user filtering;
- input validation;
- audit logging;
- secure cookies;
- HTTPS;
- CSRF/origin protections;
- rate limiting;
- security headers;
- dependency updates;
- backups;
- restore tests.

## 19. AVG/GDPR vóór commerciële livegang

Omdat de applicatie persoonsgegevens en mogelijk zeer gevoelige dossierinformatie verwerkt, moet vóór verkoop minimaal worden geregeld:

- privacyverklaring;
- verwerkingsregister;
- bewaartermijnen;
- verwijderbeleid;
- exportfunctie;
- account deletion;
- verwerkersovereenkomsten;
- subprocessor-overzicht;
- datalekprocedure;
- loggingbeleid;
- toegangsbeleid;
- back-upretentie;
- Europese hosting/gegevensverwerking waar gewenst;
- juridische controle van de voorwaarden.

## 20. Productiechecklist

[ ] Debian bijgewerkt  
[ ] root SSH uit  
[ ] password SSH uit  
[ ] alleen SSH-key  
[ ] nftables actief  
[ ] fail2ban actief  
[ ] unattended-upgrades actief  
[ ] Docker geïnstalleerd  
[ ] database niet publiek  
[ ] app alleen op 127.0.0.1:3000  
[ ] DNS correct  
[ ] Let's Encrypt actief  
[ ] certbot renew --dry-run geslaagd  
[ ] HTTPS redirect actief  
[ ] HSTS actief  
[ ] SESSION_SECRET gewijzigd  
[ ] ADMIN_PATH gewijzigd  
[ ] admin wachtwoord gewijzigd  
[ ] Stripe secrets ingesteld  
[ ] Stripe webhook getest  
[ ] database backup getest  
[ ] restore getest  
[ ] AVG-documentatie gereed  
[ ] penetratietest uitgevoerd  
[ ] monitoring ingesteld

## 21. Belangrijkste beveiligingsprincipe

Het verborgen adminpad is uitsluitend een extra laag tegen toevallige discovery. Het is NIET de beveiliging.

De echte bescherming is:

HTTPS → reverse proxy → server-side session → autorisatie → tenant isolation → database permissions → audit log → firewall → updates → backups → monitoring.

Voor de adminomgeving is VPN-only toegang nog beter.
