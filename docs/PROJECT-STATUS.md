# Alimenta Pro — Projectstatus & ontwikkelregister

**Repository:** `kevke1990/saas-alimenta`  
**Hoofdbranch:** `main`  
**Statusdocument:** `docs/PROJECT-STATUS.md`

Dit document is het centrale ontwikkelregister. Het beschrijft wat is afgerond, wat momenteel in ontwikkeling is en wat nog nodig is. Bij iedere substantiële fasewijziging wordt dit bestand bijgewerkt.

## Actuele stand

- Fase F1 — Professionele werkplek: **afgerond**
- Fase F2 — Slimme dossierprioritering: **afgerond**
- Fase F3 — Gecontroleerde automatisering: **vrijwel afgerond; lifecycle hardening loopt**
- Fase F4 — Integratieplatform: **in uitvoering; API-contract, request-correlatie en webhookbeleid aanwezig**
- Fase F5 — Explainable intelligence: **bestaande basis aanwezig; verdere productisering volgt**

## Recente voortgang

- Persistente e-mailconcepten hebben een server-side send lifecycle: `DRAFT → SENT` in hetzelfde `MailMessage`-record.
- Verzenden vanuit een opgeslagen concept gebruikt ownership-check, geverifieerde afzender, provider-ID, `MailLog` en auditactie `MAIL_DRAFT_SENT`.
- Dossier-workspace heeft een aparte communicatiepagina met e-mailhistorie en open concepten.
- Agenda-opvolging voorkomt dubbele afspraken met dezelfde eigenaar, cliënt, titel en tijdsinterval.
- De API v1 heeft Markdown-documentatie en een machineleesbaar OpenAPI-contract op `docs/openapi-v1.yaml`.
- Webhook delivery policy primitives zijn toegevoegd met signing, retry-classificatie, backoff en attemptlimiet; tests staan in `lib/webhook-delivery.test.ts`.
- Request-ID-correlatie is toegevoegd aan het API-contract, inclusief `x-request-id`-responseheaders.
- Rate-limit policy primitives zijn toegevoegd met veilige limieten, resterende capaciteit en `Retry-After`-ondersteuning.
- Automatische verzending blijft uitgesloten: alleen een expliciete professionele verzendactie kan een concept verzenden.

## F3 — Gecontroleerde automatisering

### Afgerond

- Workflow-suggesties en prioriteiten.
- Expliciete taakacceptatie, due dates en duplicaatbescherming voor open taken.
- Agenda-opvolging met starttijd, duur, reminder en basisdeduplicatie.
- Persistent e-mailconcept als `MailMessage` met user/client/case-koppeling.
- Concept bewerken, opslaan en verwijderen.
- Server-side verzenden van een opgeslagen concept met lifecycle `DRAFT → SENT`.
- Provider-ID, `MailLog` en audittrail bij verzending.
- Dossiercommunicatiehistorie en directe toegang tot conceptbeheer.
- Geen autonome wijziging van juridische berekeningen, normen of reviewstatus.

### Nog nodig binnen F3

1. Taak → voortgekomen agenda/e-mail provenance explicieter maken.
2. Uitgebreidere authorization/ownership/duplicate/lifecycle endpointtests.
3. Eenduidige fout- en statusafhandeling in de mail-UI.
4. Security review van alle automation- en mail-endpoints.
5. E2E-pad testen: suggestie → actie → object → opvolging → afronding → audit.

## F4 — Integratieplatform

### Afgerond / aanwezig

- Versioned API v1.
- Scoped API credentials.
- Webhook subscriptions/events.
- Import/export-contracten.
- Integratie-audittrail.
- Rate-limit policy primitives met responseheaders; productieopslag/tellerkoppeling volgt nog.
- API-documentatie in `docs/API-V1.md`.
- Machineleesbaar OpenAPI-contract in `docs/openapi-v1.yaml`.
- Request-ID-correlatie in `lib/api-contract.ts`.
- Webhook signing- en retrybeleid in `lib/webhook-delivery.ts` met regressietests.
- Delivery queue-, repository-, worker- en orchestratorcontracten met unit-tests.
- Gevalideerde webhook-eventenvelop met deterministische idempotency-key.

### Nog uit te werken

1. Prisma-backed webhook delivery history en queue/worker-integratie.
2. Credential rotatie/intrekken verder verharden en testen.
3. Import/export validatie, versiebeheer en foutcontracten.
4. Contracttests tegen het OpenAPI-document.
5. Provenance voor integratie-events.
6. Rate limiting per credential/route/plan verder verharden met gedeelde opslag.
7. Staging integration smoke tests zodra secrets beschikbaar zijn.
8. Monitoring, health checks en operationele foutdiagnostiek.
9. Security/privacy review van externe integraties.

## Versnelde batch B — 12 september 2026

- `lib/api-contract.ts` uitgebreid met request-ID-generatie, validatie en responseheaders.
- `lib/rate-limit-policy.ts` toegevoegd als deterministische rate-limitpolicylaag.
- Tests toegevoegd in `lib/rate-limit-policy.test.ts`.
- Details en vervolgstappen staan in `docs/DEVELOPMENT-BATCH-2026-09-12-B.md`.

## Technische kwaliteitsstatus

CI controleert repository hygiene, dependencies/security audit, Prisma schema/migrations/generate, tests, production build, runtime health/readiness, production Compose, Docker image/user en deployment scripts. `staging-smoke` wordt alleen uitgevoerd wanneer de benodigde stagingconfiguratie beschikbaar is.

## Ontwerpregels

1. Human-in-the-loop voor juridische/workflowbeslissingen.
2. Geen autonome reken-, norm- of reviewmutaties.
3. Iedere muterende workflowactie is auditbaar.
4. Iedere serveractie dwingt resource ownership af.
5. Workflow/AI-output blijft herleidbaar tot bron/object.
6. Herhaalde automation requests mogen geen ongecontroleerde duplicaten maken.
7. Privacy by design.
8. API-, norm-, reken- en import/exportcontracten blijven expliciet versieerbaar.

## Ontwikkelvolgorde

**Nu:** F3 lifecycle hardening en endpointtests afronden.  
**Daarna:** F4 persistente webhook delivery, import/export-hardening en contracttests.  
**Vervolgens:** F5 verder productiseren.  
**Parallel:** CI groen houden; geen fase als afgerond markeren zolang relevante tests/build niet groen zijn.

## GitHub-locatie

Dit centrale register staat op `docs/PROJECT-STATUS.md`. De fasebeschrijving staat op `docs/PHASE-F.md`; F4-detail op `docs/PHASE-F4.md`; het machineleesbare API-contract op `docs/openapi-v1.yaml`.
