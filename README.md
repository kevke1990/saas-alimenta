# Alimenta Pro

> **v1.3.1-rc1 — Demo Release Candidate**
>
> Professionele alimentatie-werkplek: van document naar onderbouwde alimentatieberekening in minuten.

Alimenta Pro is een professionele SaaS-werkplek voor alimentatieprofessionals. De applicatie combineert dossierbeheer, document intake, AI-ondersteunde extractie, inkomensanalyse, kinderalimentatie, partneralimentatie, scenario's, professionele overrides, review/approval, rapportage, communicatie en privacy-workflows.

**Demo:** gebruik uitsluitend fictieve persoonsgegevens.

## Architectuur

```text
Dossier
  ↓
Documenten → AI extractie/signalen → Professional approval
                                      ↓
                              Approved Data
                                      ↓
                              Income Engine
                              ↙          ↘
                    Kinderalimentatie   Partneralimentatie
                              ↘          ↙
                              Scenario's
                                  ↓
                         Review → Rapport
                                  ↓
                            Audit trail
```

AI is nadrukkelijk een extractie- en signaleringslaag. De professional controleert en accordeert de gegevens voordat deze in een deterministische berekening terechtkomen.

## Stack

- Next.js 16.3
- React 19.2
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

- Cliënten en dossiers
- Mobile-first document upload/scan (`/scan`)
- Versleutelde documentopslag en SHA-256-integriteit
- AI-document- en inkomensextractie met confidence/source hints
- Menselijke accordering van AI-afgeleide feiten
- Income Engine met auditable inkomensopbouw
- Kinderalimentatie 2026-engine
- Partneralimentatie 2026-engine
- Scenario Engine met immutable snapshots en fingerprints
- Professionele overrides
- Case Review workflow: `INCOMPLETE → READY_FOR_REVIEW → REVIEWED → APPROVED → FINAL`
- Rapportage
- Audit logging
- AVG export/privacy workflows
- TOTP MFA
- RBAC helpers
- Database-backed authentication rate limiting
- Dagelijkse retention job
- Demo seed
- PostgreSQL backup/restore
- Geautomatiseerde Debian 13 deployment

## Status v1.3.1-rc1

Deze release is bedoeld voor een gecontroleerde VPS-demo en verdere ontwikkeling. Het is **geen juridisch gecertificeerd product** en nog geen claim van een onafhankelijke security-audit.

### Bekende beperkingen

- Passkeys hebben het credential-datamodel, maar de volledige WebAuthn browser ceremony is nog niet onderdeel van deze RC.
- RBAC bevat server-side role helpers; volledige resource-level multi-tenant autorisatie moet vóór productie verder worden gehard.
- Retention is technisch geautomatiseerd via de deployment/cron-laag; het concrete bewaarbeleid moet per organisatie/dossier worden vastgesteld.
- Partneralimentatie bevat professionele signaleringen en een deterministische rekenslag, maar complexe juridische uitzonderingen blijven mensenwerk.
- Een volledige `npm test`/`next build` moet in een omgeving met geïnstalleerde dependencies worden uitgevoerd voordat deze RC productie wordt genoemd.

## Lokaal ontwikkelen

Vereisten: Node.js 22 LTS, npm en Docker.

```bash
git clone https://github.com/kevke1990/saas-alimenta.git
cd saas-alimenta
npm ci
cp .env.example .env
```

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Stel minimaal `DATABASE_URL` in en voer daarna uit:

```bash
npx prisma migrate deploy
npx prisma generate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

### Fictieve demo-data

```bash
npm run db:seed:demo
```

Gebruik nooit echte cliëntgegevens in de demo-seed.

## VPS-demo — Debian 13

Aanbevolen startserver:

- 2 vCPU
- 4 GB RAM
- 100 GB NVMe
- Debian 13
- publiek IPv4-adres

Clone de repository op de VPS:

```bash
git clone https://github.com/kevke1990/saas-alimenta.git /opt/alimenta
cd /opt/alimenta
```

Controleer eerst:

```bash
sudo bash deploy/preflight-demo.sh
```

Automatische installatie:

```bash
sudo bash deploy/installer.sh
```

De installer verzorgt onder meer Docker, PostgreSQL, Prisma migrations, secrets, firewall, fail2ban, Nginx, HTTPS, healthcheck en optionele demo-data.

Controleer na installatie:

```bash
sudo alimenta doctor
sudo alimenta status
sudo alimenta logs
```

### Beheer

```bash
sudo alimenta backup
sudo alimenta update
sudo alimenta restore /opt/alimenta/backups/alimenta-postgres-YYYYMMDDTHHMMSSZ.sql.gz
```

Restore vereist expliciete bevestiging. Controleer backups altijd voordat je ze terugzet.

## Docker

Voor productie:

```bash
docker compose -f docker-compose.prod.yml config
docker compose -f docker-compose.prod.yml up -d --build
```

PostgreSQL wordt niet publiek gepubliceerd. De Next.js-app wordt lokaal gebonden en via Nginx ontsloten.

Gebruik voor productie **versioned Prisma migrations** (`npx prisma migrate deploy`). Gebruik `prisma db push` niet als normale productie-releaseprocedure.

## Omgevingsvariabelen

Gebruik `.env.example` als uitgangspunt. Secrets die nooit in Git mogen komen:

- `DATABASE_URL`
- `POSTGRES_PASSWORD`
- `SESSION_SECRET`
- `APP_ENCRYPTION_KEY`
- `PRIVACY_HASH_SALT`
- `ADMIN_PASSWORD`
- `POSTMARK_INBOUND_SECRET`
- API- en webhook-sleutels

Optionele integraties:

- Google Gemini: `GOOGLE_AI_API_KEY`
- Postmark: `POSTMARK_SERVER_TOKEN`, `POSTMARK_ACCOUNT_TOKEN`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Cloudflare custom domains: `CLOUDFLARE_*`

## AI

AI wordt gebruikt voor document-/inkomensextractie en signalering. De applicatie moet AI-output valideren en een professional moet de voorgestelde gegevens goedkeuren voordat ze onderdeel worden van een berekening.

Configureer AI alleen wanneer de privacygrondslag, verwerkersafspraken en tenantpolicy dit toestaan.

## E-mail

De mailmodule ondersteunt Postmark Sender Signatures, outbound mail, inbound routes en forwarding. Voor inbound is een webhook beschikbaar op:

```text
https://<app-domain>/api/mail/inbound?secret=<POSTMARK_INBOUND_SECRET>
```

Gebruik in productie SPF, DKIM, DMARC en passende abuse/spam-controls.

## Privacy / AVG

De applicatie bevat technische ondersteuning voor inzage, dataportabiliteit, wissing, consent en audit. Een wissing is niet automatisch altijd toegestaan: wettelijke bewaarplichten, bewijsbelangen en andere uitzonderingen moeten professioneel worden beoordeeld.

Zie de actuele privacy- en hardeningdocumentatie onder `docs/`.

## Testen

```bash
npm ci
npx prisma generate
npm test
npm run build
```

Voor een VPS-demo is daarnaast de preflight- en healthcheckroute beschikbaar:

```bash
sudo bash deploy/preflight-demo.sh
sudo alimenta doctor
```

## Development workflow

Werk met branches en pull requests:

```bash
git checkout -b feature/<naam>
# wijzigingen
npm test
npm run build
git add .
git commit -m "feat: ..."
git push -u origin feature/<naam>
```

CI staat onder `.github/workflows/ci.yml`.

## Documentatie

- `CHANGELOG.md` — centrale historische changelog
- `docs/ARCHITECTURE.md` — actuele architectuur
- `docs/DEMO-RC-v1.3.1.md` — demo checklist
- `docs/V1.3.1-DEPLOYMENT-AUTOMATION.md` — deployment automation
- `docs/V1.3.1-SECURITY-COMPLETION.md` — security completion
- `docs/V1.3-HARDENING.md` — v1.3 hardening
- `docs/V1.1-PARTNERALIMENTATIE.md` — PAL-module
- `docs/V1.0-KINDERALIMENTATIE-PRODUCTION.md` — KA-engine
- `deploy/custom-domains.md` — custom domains

## Juridische scope

Alimenta Pro is een professioneel reken- en dossiervoeringshulpmiddel. De geïmplementeerde rekenlogica is gebaseerd op de geïmplementeerde uitgangspunten uit het Rapport Alimentatienormen 2026. De aanbevelingen van de Expertgroep Alimentatienormen zijn geen wet; individuele omstandigheden kunnen afwijking rechtvaardigen. De software vervangt geen juridische beoordeling of rechterlijk oordeel.
