> **v1.3.1-rc1 — Demo Release Candidate**
> Gebruik voor de eerste VPS-demo uitsluitend fictieve gegevens.

# Alimenta Pro v1.3.1

Professionele alimentatie-werkplek voor dossierbeheer, berekeningen, inkomensanalyse, document intake, AVG-workflows en e-mail.

## Nieuw in v0.9.9

- **Mobile-first document intake**: telefoon/tablet camera + bestand kiezen.
- **Document Intelligence**: versleutelde opslag, SHA-256-integriteit en Gemini documentanalyse.
- **AI-assisted income extraction**: loonstrook/jaaropgave/uitkeringsspecificatie naar voorstelvelden met confidence en warnings.
- **E-mail vanuit de applicatie** via Postmark.
- **Postmark Sender Signature onboarding**.
- **Inbound e-mail routes** met automatische forwarding naar een ingestelde mailbox.
- **AVG-export v2** inclusief documentinhoud en mailberichten.
- **Vollediger operationeel wissen** van cliëntgebonden documenten, mails, agenda, usage, consent en privacyrequests.
- PWA/mobile metadata en responsive scan-UI.

## Google AI Studio

Stel in productie in:

```env
GOOGLE_AI_API_KEY=...
GOOGLE_AI_MODEL=gemini-2.5-flash
AI_PROCESSING_DISABLED=false
```

AI is een extractielaag. De professional controleert en accordeert de resultaten voordat gegevens in een berekening terechtkomen.

## Documenten

Ondersteund: PDF, JPEG, PNG en WEBP, maximaal 15 MB per bestand. Documenten worden in v0.9.9 versleuteld in PostgreSQL opgeslagen. Voor grotere productievolumes is object storage met lifecycle policies aanbevolen.

## Mobiel scannen

Open `/scan` op een telefoon/tablet. Gebruik bij voorkeur HTTPS. De browsercamera gebruikt `navigator.mediaDevices.getUserMedia()`; als camera niet beschikbaar is, kan via de mobiele bestandskiezer een foto of PDF worden gekozen.

## E-mail

### Uitgaand

Vereist:

```env
POSTMARK_SERVER_TOKEN=...
POSTMARK_ACCOUNT_TOKEN=...
POSTMARK_OUTBOUND_STREAM=outbound
```

Maak in `/mail` een afzender aan. Postmark stuurt een verificatiebericht. Een geverifieerde Sender Signature is vereist voordat de applicatie namens dat adres kan verzenden.

### Inbound + forwarding

Vereist:

```env
POSTMARK_INBOUND_SECRET=een-lange-willekeurige-geheime-waarde
INBOUND_DOMAIN=inbound.postmarkapp.com
```

Maak in `/mail` een inbound route aan. De applicatie geeft een uniek inboundadres zoals `alimenta+<hash>@inbound.postmarkapp.com`. Configureer in Postmark Inbound Domain Forwarding of een eigen forward naar dit adres.

Webhook:

```text
https://<app-domain>/api/mail/inbound?secret=<POSTMARK_INBOUND_SECRET>
```

De webhook verwerkt de mail, registreert de inbound message en stuurt deze door naar de ingestelde mailbox. Bijlagen worden mee doorgestuurd.

Voor productie is een eigen inbound subdomein zoals `inbox.jouwdomein.nl` aanbevolen, plus SPF/DKIM/DMARC en aanvullende abuse/spam-controls.

## AVG / privacy

De applicatie ondersteunt technische workflows voor inzage, dataportabiliteit en wissing. Een export bevat cliëntgegevens, dossiers, berekeningen, agenda-events, usage events, privacyrequests, consentrecords, documentmetadata + documentinhoud en mailberichten.

**Let op:** een recht op wissing is niet absoluut. Wettelijke bewaarplichten, bewijsbelangen en andere uitzonderingen moeten per praktijk en dossier worden beoordeeld. De software mag nooit automatisch alle gegevens wissen zonder dat deze uitzonderingen zijn beoordeeld.

## Deploy

1. Vul `.env.example` aan in je productie `.env`.
2. Zet `APP_ENCRYPTION_KEY`, `SESSION_SECRET`, `PRIVACY_HASH_SALT` en `POSTMARK_INBOUND_SECRET` op lange unieke secrets.
3. Start PostgreSQL/app via Docker Compose.
4. Voer `npx prisma db push` uit voor deze ontwikkelrelease.
5. Configureer HTTPS/Nginx.
6. Configureer Postmark outbound sender/domain.
7. Configureer Postmark inbound webhook + forwarding.
8. Configureer Google AI alleen als AI-verwerking juridisch en contractueel is toegestaan.

## Belangrijke v1.0 verbeterpunten

- Prisma migrations en gecontroleerde schema releases.
- MFA/passkeys + RBAC.
- echte object storage + lifecycle/retention.
- server-side PDF.
- uitgebreide audit/event log zonder inhoudelijke persoonsgegevens.
- retention engine.
- datalekregister.
- RoPA/verwerkingsregister.
- DPIA workflow.
- DPA/subprocessor register.
- identity verification voor cliëntportalen.
- e-mailthreads + automatische dossierkoppeling.
- AI field approval workflow met bronpagina/bronfragment.
- calculator regression suite met officiële testgevallen.
- onafhankelijke juridische review van de volledige Tremanormen-implementatie.

## v1.1.2 Partneralimentatie

Partneralimentatie is beschikbaar per dossier via **Partneralimentatie**. De module gebruikt dezelfde dossier- en snapshotarchitectuur als kinderalimentatie en verwerkt de 2026-hoofdlijnen: hofnorm, behoeftigheid, partnerdraagkracht, prioriteit van kinderalimentatie, inkomensvergelijking en brutering. Zie `docs/V1.1-PARTNERALIMENTATIE.md`.


## v1.1.2 Complexe partneralimentatie
De PAL-engine ondersteunt meerjarige ondernemerswinst, variabel inkomen, dividend/vermogen, eigen woning/fiscale correcties, pensioen/lijfrentevoorzieningen en meerdere onderhoudsverplichtingen. Elke PAL-berekening krijgt een SHA-256 fingerprint.


## Hardening v1.1.2

Deze release bevat officiële 2026 rekenkundige ankercontroles, numeriek stabiele afronding, inputvalidatie en regressietests voor complexe partneralimentatie. Zie `CHANGELOG-v1.1.2.md` en `RELEASE-v1.1.2.md`.


## v1.3 Hardening & Production Readiness

Professionele overrides, reviewworkflow, audit trail, authentication rate limiting, security-identiteitsfundament en versioned Prisma migration. Zie `docs/V1.3-HARDENING.md`.

## v1.2 Scenario & Wijzigingen

Scenario's zijn immutable snapshots waarmee een professional wijzigingen in inkomen of leeftijd kan testen zonder het hoofddossier te muteren. Indien partneralimentatie-input is opgeslagen, wordt PAL opnieuw berekend met de scenario-kinderalimentatie als prioritaire kinderalimentatie.


## v1.3.1 security completion
- TOTP MFA operationeel met versleutelde secrets en MFA bij login.
- Database-backed rate limiting voor login/registratie.
- Passkey-datamodel voorbereid voor WebAuthn registration.
- Dagelijkse AVG-retention job voor verlopen data en rate-limit buckets.
- RBAC-rollen beschikbaar via `requireRole()`.
