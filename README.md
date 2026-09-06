# Alimenta Pro — v1.3.1 RC1

**Professionele alimentatie-werkplek — van document naar onderbouwde alimentatieberekening in minuten.**

> 🚧 **Demo Release Candidate** — bedoeld voor de eerste VPS-demo en verdere ontwikkeling. Gebruik uitsluitend fictieve persoonsgegevens tijdens de demo.

## Wat is Alimenta Pro?

Alimenta Pro is een professionele SaaS-werkplek voor alimentatieprofessionals. De applicatie combineert dossierbeheer, document intake, AI-ondersteunde gegevensextractie, inkomensanalyse, kinderalimentatie, partneralimentatie, scenario's, professionele overrides, review/approval, rapportage, communicatie en auditability.

De kernarchitectuur is bewust gescheiden:

```text
Documenten → AI-extractie → professionele controle → Approved Data
                                      ↓
                              Deterministische engine
                                      ↓
                     Kinderalimentatie / Partneralimentatie
                                      ↓
                         Scenario → Review → Rapport
```

AI is een extractie- en signaleringslaag; de professional blijft verantwoordelijk voor controle en goedkeuring.

## Stack

- Next.js 16
- React 19
- TypeScript 5.9
- Prisma 6
- PostgreSQL
- Docker / Docker Compose
- Nginx
- Debian 13 deployment automation
- Vitest
- Google Gemini document intelligence (optioneel)
- Postmark e-mail (optioneel)
- Stripe billing (optioneel)

## Belangrijkste functionaliteit

- Dossiers en cliënten
- Document upload en mobiele scan-flow (`/scan`)
- AI document-/inkomensanalyse met confidence en broninformatie
- Professionele overrides
- Reviewworkflow: `INCOMPLETE → READY_FOR_REVIEW → REVIEWED → APPROVED → FINAL`
- Kinderalimentatie 2026-engine
- Partneralimentatie-engine
- Scenario's en scenario-fingerprints
- Immutable calculation snapshots
- Rapportage
- AVG/privacy-workflows
- Audit logging
- TOTP-MFA-infrastructuur
- RBAC-basis
- Retention/cleanup tooling
- PostgreSQL rate limiting
- Demo seed
- Geautomatiseerde Debian 13/VPS deployment
- Backup, restore, healthcheck en doctor tooling

## Snel starten — lokaal

Vereisten:

- Node.js 22 LTS of nieuwer ondersteund door de projectdependencies
- PostgreSQL 15+
- npm

```bash
git clone https://github.com/kevke1990/saas-alimenta.git
cd saas-alimenta
npm install
cp .env.example .env
```

Vul minimaal `DATABASE_URL` in. Voor lokale ontwikkeling kan bijvoorbeeld PostgreSQL via Docker worden gestart:

```bash
docker compose up -d postgres
```

Daarna:

```bash
npx prisma migrate deploy
npx prisma generate
npm run db:seed
npm run dev
```

Open vervolgens `http://localhost:3000`.

### Demo-data

Voor een volledig fictief demo-dossier:

```bash
npm run db:seed:demo
```

Gebruik nooit echte cliëntgegevens in de demo-seed.

## VPS-demo — aanbevolen route

De snelste route is een verse **Debian 13** VPS. De meegeleverde installer richt de basisserver, Docker, firewall, fail2ban, PostgreSQL, Nginx, HTTPS, migrations, build, healthcheck en demo-seed in.

### 1. VPS voorbereiden

Aanbevolen startconfiguratie voor demo:

- 2 vCPU
- 4 GB RAM
- 100 GB NVMe
- Debian 13
- publiek IPv4-adres

### 2. Repository ophalen

```bash
git clone https://github.com/kevke1990/saas-alimenta.git /opt/alimenta
cd /opt/alimenta
```

### 3. Preflight

```bash
sudo bash deploy/preflight-demo.sh
```

### 4. Automatische installatie

```bash
sudo bash deploy/installer.sh
```

Volg de vragen voor domein en e-mailadres. **Overschrijf geen bestaande productie-`.env` zonder eerst een backup te maken.**

### 5. Controle

```bash
sudo alimenta doctor
sudo alimenta status
sudo alimenta logs
```

Daarna is de applicatie bereikbaar via het ingestelde HTTPS-domein.

## DNS en HTTPS

Laat het domein vóór Let's Encrypt naar de VPS wijzen:

```text
A     @       <VPS-IP>
A     www     <VPS-IP>
```

De installer kan HTTPS via Let's Encrypt configureren. Bij gebruik van Cloudflare: gebruik bij voorkeur **Full (strict)** en een geldig origin-certificaat.

## Productievariabelen

Begin met:

```bash
cp .env.example .env
```

Belangrijke secrets:

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=<sterk-random-secret>
APP_ENCRYPTION_KEY=<32-byte-key-in-hex-of-projectformaat>
PRIVACY_HASH_SALT=<sterk-random-secret>
POSTMARK_INBOUND_SECRET=<sterk-random-secret>
```

Optionele integraties:

```env
GOOGLE_AI_API_KEY=...
GOOGLE_AI_MODEL=gemini-2.5-flash
AI_PROCESSING_DISABLED=false

POSTMARK_SERVER_TOKEN=...
POSTMARK_ACCOUNT_TOKEN=...
POSTMARK_OUTBOUND_STREAM=outbound

STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

**Commit nooit `.env`, API keys, database-wachtwoorden, TLS private keys of andere secrets.**

## Docker

Voor de VPS wordt de production compose-stack gebruikt. PostgreSQL hoort uitsluitend op het interne Docker-netwerk te luisteren. Publiceer de databasepoort niet naar internet.

Handmatig:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Controle:

```bash
docker compose -f docker-compose.prod.yml ps
curl -fsS http://127.0.0.1:3000/api/health
```

## Beheercommando's

Na de automatische installatie:

```bash
alimenta status
alimenta doctor
alimenta logs
alimenta backup
alimenta update
```

Restore alleen na expliciete controle van de backup:

```bash
CONFIRM_RESTORE=YES alimenta restore /opt/alimenta/backups/backup.sql.gz
```

## Database en migrations

Gebruik voor productie:

```bash
npx prisma migrate deploy
npx prisma generate
```

Gebruik `prisma db push` niet als normale productie-releaseprocedure. Nieuwe schemawijzigingen horen als versioned migration in `prisma/migrations/` te worden toegevoegd.

## Testen

```bash
npm test
```

Voor een production build:

```bash
npx prisma generate
npm run build
```

## GitHub development workflow

Werk bij voorkeur via branches:

```bash
git checkout -b feature/<naam>
# wijzigingen
npm test
git add .
git commit -m "feat: ..."
git push -u origin feature/<naam>
```

Maak daarna een Pull Request naar `main`. De repository bevat GitHub Actions voor de basis CI-controle.

## Releases

De huidige release is:

**v1.3.1-rc1**

Relevante documentatie:

- `RELEASE-v1.3.1-RC1.md`
- `CHANGELOG-v1.3.1-RC1.md`
- `docs/DEMO-RC-v1.3.1.md`
- `docs/V1.3.1-DEPLOYMENT-AUTOMATION.md`
- `docs/V1.3.1-HARDENING.md`

## Juridische scope

De alimentatie-engine ondersteunt de geïmplementeerde 2026-hoofdlijnen en officiële testankers, maar software-uitvoer is geen juridisch advies en vervangt geen professionele beoordeling. De aanbevelingen van de Expertgroep Alimentatienormen zijn richtlijnen en geen wet; individuele zaken kunnen hiervan afwijken.

De professional moet brongegevens, uitzonderingen, draagkracht, behoefte, zorgverdeling, fiscale aspecten en overige relevante omstandigheden controleren voordat een berekening als definitief wordt gebruikt.

## Nog vóór productie

De RC is demo-ready, maar vóór commerciële productie moet minimaal worden afgerond/geaudit:

- volledige WebAuthn/passkey ceremony
- volledige resource-level RBAC
- juridische review van alle alimentatiemodules
- onafhankelijke security review/penetratietest
- productie-grade monitoring en alerting
- formele retention/legal-hold policies
- object storage/lifecycle voor grote documentvolumes
- volledige backup/restore disaster-recoverytest
- formele DPIA/RoPA/subprocessor review
- production incident-response procedure

## Licentie

Private repository. Alle rechten voorbehouden. Zie de repository-instellingen en eventuele toekomstige commerciële licentie voor gebruiksvoorwaarden.
