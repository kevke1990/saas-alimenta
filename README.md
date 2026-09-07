# Alimenta Pro

> **v1.3.1-rc1 — Demo Release Candidate**
>
> Professionele alimentatie-werkplek voor kinderalimentatie en partneralimentatie.

Alimenta Pro is een professionele SaaS-werkplek voor alimentatieprofessionals. De applicatie is opgezet rondom één centraal dossier waarin een gezin/familie, beide ouders/partners, kinderen, inkomensgegevens, woonlasten, nieuwe partners, eventuele kinderen van nieuwe partners, documenten, berekeningen, scenario's, professionele overrides, review en rapportage samenkomen.

> **Belangrijk:** Alimenta Pro is een softwaretool voor ondersteuning van professionele alimentatieberekeningen. De uitkomst is geen juridisch advies en de applicatie claimt geen juridische certificering. Complexe juridische uitzonderingen, interpretaties en professionele afwijkingen moeten door een bevoegde professional worden beoordeeld.

## Kernprincipes

- **Gezin als cliënt:** een cliëntdossier vertegenwoordigt een gezin en bevat standaard twee betrokken personen (persoon A en persoon B).
- **Volledige gegevensketen:** gegevens uit cliënt → gezin → dossier → wizard → berekening → resultaat → rapport blijven beschikbaar en worden niet opnieuw handmatig ingevoerd.
- **Kinderen zijn dossiergegevens:** namen en relevante gegevens van alle kinderen moeten zichtbaar blijven in volgende stappen, de berekening en het rapport.
- **Transparante berekening:** geen black-box bedrag. De professional ziet invoer, tussenstappen, aannames, correcties, draagkracht, behoefte, verdeling en het uiteindelijke maandbedrag.
- **Volledige betalingsverplichting:** het resultaat toont het totale verschuldigde bedrag per maand én een uitsplitsing per onderdeel/kind waar van toepassing.
- **Deterministische engine:** na professionele goedkeuring van invoer worden berekeningen deterministisch uitgevoerd en versioned opgeslagen.
- **Auditability:** elke berekening bewaart een immutable input snapshot, resultaat, engineversie en normversie.
- **Professionele overrides:** afwijkingen kunnen expliciet worden vastgelegd met oorspronkelijke waarde, nieuwe waarde en reden.

## Functionaliteit

### Dossier en gezin

Een dossier ondersteunt minimaal:

- Persoon A: naam, e-mail, telefoon en relevante financiële gegevens.
- Persoon B: naam, e-mail, telefoon en relevante financiële gegevens.
- Kinderen: naam en relevante gegevens per kind.
- Gezins-/dossierstatus en referentie.
- Documenten en door AI voorgestelde gegevens.
- Professionele goedkeuring van AI-afgeleide feiten.
- Berekeningen, scenario's en overrides.

De `Client` bevat expliciete velden voor persoon A en B. Het `Case` bewaart de complete berekeningsdata als versioneerbare dossierdata.

### Kinderalimentatie

De kinderalimentatie-engine is bedoeld om een professionele, inzichtelijke berekening op te bouwen vanuit onder meer:

1. uitgangssituatie en peildatum;
2. gegevens van beide ouders;
3. inkomen en inkomenscomponenten;
4. relevante correcties en fiscale/financiële uitgangspunten;
5. behoefte van de kinderen;
6. draagkracht van de ouders;
7. draagkrachtvergelijking;
8. zorgverdeling en eventuele zorgkorting;
9. verdeling van de onderhoudslast;
10. eventuele professionele correcties/afwijkingen;
11. uiteindelijke maandelijkse betalingsverplichting.

De berekening moet niet alleen een eindbedrag tonen, maar ook duidelijk maken **waarom** dat bedrag ontstaat.

### Partneralimentatie

Partneralimentatie maakt onderdeel uit van de scope van de berekening. De tool moet rekening kunnen houden met de gezinssituatie en relatievorm, waaronder:

- huwelijk;
- geregistreerd partnerschap;
- samenwoning met samenlevingscontract;
- relevante samenwoon-/partnercontext;
- inkomen van beide partners;
- behoefte en behoeftigheid;
- draagkracht;
- woonlasten;
- reeds bestaande onderhoudsverplichtingen;
- nieuwe partner;
- inkomen van de nieuwe partner waar juridisch relevant;
- kinderen van de nieuwe partner;
- professionele uitzonderingen en correcties.

Complexe partneralimentatiekwesties blijven nadrukkelijk professioneel te beoordelen.

### Wonen

De wizard moet onderscheid kunnen maken tussen:

- huurwoning;
- koopwoning/eigen woning.

Bij een huurwoning moeten relevante huur- en woonlastgegevens kunnen worden vastgelegd. Bij een koopwoning moeten relevante hypotheek-/woonlastgegevens en overige relevante woninggegevens kunnen worden vastgelegd. De behandeling van woonlasten moet zichtbaar zijn in de berekening en niet verborgen in één eindbedrag.

### Nieuwe partner en samengesteld gezin

De gezinssituatie kan na de scheiding/verandering van de relatie zijn gewijzigd. Daarom moet de invoer ruimte bieden voor een nieuwe partner en voor kinderen die tot het huishouden van die nieuwe partner behoren.

Deze gegevens moeten via de volledige dataflow beschikbaar blijven voor de relevante berekeningen. De tool mag niet automatisch juridische gevolgen aannemen waar de omstandigheden eerst professioneel moeten worden beoordeeld.

## Berekeningsresultaat

Het resultaat moet professioneel leesbaar zijn en minimaal duidelijk maken:

- betrokken personen;
- namen van de kinderen;
- peildatum;
- gebruikte norm-/engineversie;
- relevante uitgangspunten;
- inkomen per persoon;
- relevante correcties;
- behoefte;
- draagkracht per persoon;
- draagkrachtvergelijking;
- zorgverdeling/zorgkorting waar van toepassing;
- kinderalimentatie per kind en totaal;
- partneralimentatie waar van toepassing;
- totaal van de maandelijkse betalingsverplichting;
- eventuele professionele overrides;
- waarschuwingen/signalen en punten die handmatig moeten worden beoordeeld.

Een professional moet vanuit het resultaat kunnen terugzien hoe het eindbedrag tot stand is gekomen.

## Architectuur

```text
Gezin / cliënt
      ↓
Persoon A + Persoon B
      ↓
Kinderen + gezinssituatie
      ↓
Documenten → AI extractie/signalen → Professional approval
                                      ↓
                              Approved Data
                                      ↓
                              Income Engine
                              ↙          ↘
                    Kinderalimentatie   Partneralimentatie
                              ↘          ↙
                         Scenario Engine
                                ↓
                         Review / Override
                                ↓
                           Berekeningsresultaat
                                ↓
                              Rapport
                                ↓
                            Audit trail
```

AI is nadrukkelijk een extractie- en signaleringslaag. AI-output wordt niet zonder professionele goedkeuring als definitieve berekeningsinvoer gebruikt.

## Technische stack

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

## Database en migrations

De repository gebruikt versioned Prisma migrations. Productie gebruikt:

```bash
npx prisma migrate deploy
npx prisma generate
```

Gebruik `prisma db push` niet als normale productie-releaseprocedure.

## Ontwikkeling

Vereisten:

- Node.js 22 LTS
- npm
- Docker

Clone:

```bash
git clone https://github.com/kevke1990/saas-alimenta.git
cd saas-alimenta
npm install
```

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Stel minimaal `DATABASE_URL` in en voer uit:

```bash
npx prisma migrate deploy
npx prisma generate
npm run db:seed
npm run dev
```

Open daarna `http://localhost:3000`.

### Demo-data

```bash
npm run db:seed:demo
```

Daarnaast staat op het dashboard **Start volledige demo**. Deze actie maakt via dezelfde normale `/api/clients`- en `/api/cases`-keten een volledig fictief dossier met twee ouders, twee kinderen, wonen, nieuwe partner, kinderalimentatie en partneralimentatie en opent daarna direct de dossierworkflow.

Gebruik uitsluitend fictieve persoonsgegevens in de demo.

## CI

De GitHub Actions CI voert op een schone PostgreSQL-service onder meer uit:

1. repository hygiene checks;
2. `npm install`;
3. security audit;
4. `npx prisma validate`;
5. `npx prisma migrate deploy`;
6. `npx prisma generate`;
7. `npm test`;
8. `npm run build`;
9. een runtime smoke test tegen `/api/health`.

## Docker

Productie gebruikt `docker-compose.prod.yml` met:

- Next.js-appcontainer;
- PostgreSQL 17 Alpine;
- persistent PostgreSQL volume;
- healthcheck op PostgreSQL;
- read-only filesystem voor de app;
- `/tmp` als tmpfs;
- `no-new-privileges`;
- alle Linux capabilities gedropt voor de app;
- geen publieke PostgreSQL-poort;
- configureerbare bind-IP voor de app.

Build/start:

```bash
docker compose -f docker-compose.prod.yml config
docker compose -f docker-compose.prod.yml up -d --build
```

Healthcheck:

```bash
curl http://127.0.0.1:3000/api/health
```

## VPS-demo — Debian 13

Aanbevolen startpunt voor de demo:

- 2 vCPU
- 4 GB RAM
- 50–100 GB NVMe
- Debian 13
- publiek IPv4-adres

Repository:

```bash
git clone https://github.com/kevke1990/saas-alimenta.git /opt/saas-alimenta
cd /opt/saas-alimenta
```

Preflight:

```bash
sudo bash deploy/preflight-demo.sh
```

Installatie:

```bash
sudo bash deploy/installer.sh
```

Controle:

```bash
sudo alimenta doctor
sudo alimenta status
sudo alimenta logs
```

Beheer:

```bash
sudo alimenta backup
sudo alimenta update
sudo alimenta restore /opt/alimenta/backups/alimenta-postgres-YYYYMMDDTHHMMSSZ.sql.gz
```

Controleer backups altijd vóór restore. Een restore vereist expliciete bevestiging.

## Omgevingsvariabelen en secrets

Gebruik `.env.example` als uitgangspunt. Secrets mogen nooit in Git worden geplaatst, waaronder:

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

## Security en privacy

Alimenta Pro bevat technische voorzieningen voor onder meer:

- encryptie van documentopslag;
- SHA-256 documentintegriteit;
- audit logging;
- TOTP MFA;
- RBAC helpers;
- database-backed authentication rate limiting;
- AVG-export/privacy workflows;
- consentregistratie;
- retention jobs;
- PostgreSQL backup/restore.

De huidige release is een gecontroleerde demo release candidate. Resource-level multi-tenant autorisatie, volledige WebAuthn browser ceremony en complexe juridische uitzonderingen moeten vóór productie verder worden gehard/gevalideerd.

## Review en goedkeuring

Dossiers kennen een reviewworkflow:

```text
INCOMPLETE
   ↓
READY_FOR_REVIEW
   ↓
REVIEWED
   ↓
APPROVED
   ↓
FINAL
```

AI-afgeleide feiten worden eerst als voorstel opgeslagen en moeten professioneel worden goedgekeurd voordat zij als definitieve berekeningsinvoer worden gebruikt.

## Versioning en reproduceerbaarheid

Elke berekening wordt gekoppeld aan:

- engine version;
- norm version;
- volledige input snapshot;
- berekeningsresultaat;
- timestamp.

Bij APPROVED wordt bovendien een exacte calculation binding opgeslagen. Een nieuw of gewijzigd berekeningssnapshot maakt een eerdere approval-binding ongeldig; FINAL wordt dan server-side geblokkeerd totdat opnieuw professioneel is gereviewd en goedgekeurd.

## Release status

**v1.3.1-rc1 — Demo Release Candidate**

### Fase A — Demo MVP

Fase A is gericht op een snelle, volledige demo-test van de bestaande inhoudelijke engine en workflow.

**Afgerond:**

- dashboard met één-klik volledige fictieve demo;
- automatisch demo-cliënt- en dossier aanmaken via de normale API-keten;
- volledige gezinssituatie met twee ouders, twee kinderen, wonen en nieuwe partner;
- kinderalimentatie + partneralimentatie in één berekening;
- centrale dossierworkflow;
- calculation snapshots en historische berekeningen;
- scenario's met expliciete bevestiging en nieuwe snapshot;
- vergelijking van berekeningen;
- professionele Case Review;
- reviewworkflow INCOMPLETE → READY_FOR_REVIEW → REVIEWED → APPROVED → FINAL;
- approval binding op calculation ID, fingerprint, engine- en normversie;
- stale approval blokkade bij FINAL;
- professioneel rapport met provenance-status;
- audittrail voor review, approval en recalculatie;
- CI-validatie van tests, build, runtime, Docker en deployment.

**Demo-testpad:**

1. Dashboard → **Start volledige demo**.
2. Controleer het berekeningsresultaat.
3. Open **Scenario's** en maak een alternatief scenario.
4. Open **Historie** en controleer de snapshots/vergelijking.
5. Open **Professionele review**.
6. Doorloop READY_FOR_REVIEW → REVIEWED → APPROVED → FINAL.
7. Open het rapport en controleer de provenance.
8. Heropen, wijzig de berekening en controleer dat de oude approval niet meer geldig is.

Op een fictief demo-dossier is op de workflowpagina bovendien een **Demo-snelpad** beschikbaar om de reviewstatussen snel achter elkaar te testen. De normale server-side transitie-, review- en snapshotcontroles blijven daarbij actief.

### Fase B — Professionele workspace

Na Fase A volgt de grotere professionaliseringsslag:

- dossierbeheer en zoek/filter-ervaring;
- professionele documentinname en statusoverzicht;
- AI-extractie → fact review → approval als één duidelijke workflow;
- uitgebreide override-workspace;
- betere scenario- en vergelijkingsworkspace;
- rapportgeneratie/export en professionele documentpresentatie;
- gebruikersrollen en resource-level autorisatie;
- volledige browser WebAuthn ceremony;
- betere foutafhandeling en gebruikersfeedback;
- end-to-end demo/reference dossiers;
- uitgebreidere observability en operationele controles.

### Fase C — Multi-tenant SaaS

- organisaties/praktijken als tenant;
- gebruikers en rollen per tenant;
- tenant-isolatie op resource-niveau;
- uitnodigingen en teambeheer;
- abonnementen en entitlements;
- Stripe billing/webhooks;
- limieten per plan;
- audit en security events per tenant;
- custom domains indien gewenst.

### Fase D — Productie en juridische professionalisering

- uitgebreide juridische exception handling;
- normbeheer en releaseproces;
- formele referentiedossiers en regressiesuites;
- security/privacy review;
- DPIA/verwerkers- en bewaarbeleid waar nodig;
- productie-monitoring, backups en restore-drills;
- performance/load tests;
- deployment rollback;
- productiedocumentatie en supportprocessen.

De release is **niet juridisch gecertificeerd** en mag niet als vervanging van professioneel juridisch oordeel worden gebruikt.

## Fase 2 — Berekeningsengine

De inhoudelijke enginebasis die voor Fase A wordt gedemonstreerd bestaat uit:

### 2.1 Canoniek gezinsmodel

- twee personen per cliënt/gezin;
- kinderen als afzonderlijke dossiergegevens;
- gezinssituatie en relatievorm;
- nieuwe partner(s);
- kinderen van nieuwe partner(s);
- huur/koop en relevante woonlasten.

### 2.2 Kinderalimentatie-engine

- inkomensopbouw;
- NBI/financiële uitgangspunten;
- behoefte;
- draagkracht;
- draagkrachtvergelijking;
- zorgverdeling;
- zorgkorting;
- verdeling van de onderhoudslast;
- totaal per kind;
- totaal maandbedrag;
- transparante tussenstappen.

### 2.3 Partneralimentatie-engine

- behoefte/behoeftigheid;
- draagkracht;
- woonlasten;
- relevante partner- en gezinscontext;
- nieuwe partner;
- relevante kinderen in nieuwe huishoudens;
- relatievorm;
- professionele correcties;
- transparante berekeningsstappen.

### 2.4 Reference cases

Fase 2 wordt getest met deterministische referentiedossiers voor onder meer:

- standaard kinderalimentatie;
- meerdere kinderen;
- ongelijke inkomens;
- verschillende zorgverdelingen;
- huurwoning;
- koopwoning;
- nieuwe partner;
- kinderen van nieuwe partner;
- partneralimentatie;
- combinatie kinderalimentatie + partneralimentatie;
- professionele override.

Geen berekeningsonderdeel wordt als afgerond beschouwd wanneer alleen het eindbedrag wordt getest. Zowel tussenresultaten als totaalverplichting moeten worden gecontroleerd.

## Bijdragen / ontwikkeling

Wijzigingen aan de berekeningsengine moeten altijd:

1. versioned worden;
2. voorzien zijn van tests;
3. geen bestaande dossiers of berekeningen stilzwijgend wijzigen;
4. duidelijk documenteren welke norm/regel is toegepast;
5. de volledige berekeningsketen en het eindbedrag controleerbaar houden.

## Licentie / demo

Dit project is een gecontroleerde demo en ontwikkelbasis. Gebruik uitsluitend fictieve persoonsgegevens in development, CI en demo-omgevingen totdat alle productievereisten, juridische vereisten, beveiligingsmaatregelen en verwerkersafspraken zijn gevalideerd.
