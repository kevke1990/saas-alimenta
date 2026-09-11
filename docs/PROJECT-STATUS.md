# Alimenta Pro — Projectstatus & ontwikkelregister

**Repository:** `kevke1990/saas-alimenta`  
**Hoofdbranch:** `main`  
**Statusdocument:** `docs/PROJECT-STATUS.md`

Dit document is het centrale ontwikkelregister. Het beschrijft wat is afgerond, wat momenteel in ontwikkeling is en wat nog nodig is. Bij iedere substantiële fasewijziging wordt dit bestand bijgewerkt.

## Actuele stand

- Fase F1 — Professionele werkplek: **afgerond**
- Fase F2 — Slimme dossierprioritering: **afgerond**
- Fase F3 — Gecontroleerde automatisering: **vrijwel afgerond; lifecycle hardening loopt**
- Fase F4 — Integratieplatform: **start gemaakt; basis aanwezig, hardening/documentatie loopt**
- Fase F5 — Explainable intelligence: **bestaande basis aanwezig; verdere productisering volgt**

## Recente voortgang

- Persistente e-mailconcepten hebben nu een volledige server-side send lifecycle: een opgeslagen `DRAFT` wordt bij expliciete verzending naar `SENT` gemuteerd in hetzelfde `MailMessage`-record.
- Verzenden vanuit een opgeslagen concept gebruikt een ownership-check, geverifieerde afzender, geregistreerde provider-ID, `MailLog` en auditactie `MAIL_DRAFT_SENT`.
- Dossier-workspace heeft een aparte communicatiepagina met e-mailhistorie en open concepten.
- De workspace verwijst nu direct naar communicatie als onderdeel van de dossierwerkruimtes.
- Automatische verzending blijft uitgesloten: alleen een expliciete professionele verzendactie kan een concept verzenden.

## Wat al is gebouwd

### Reken- en dossierfundament

- Alimentatieberekening en partneralimentatie-engine.
- Normversies en versieerbare rekeninput.
- Berekeningssnapshots en historie.
- Bestaande berekeningen kunnen via de edit-wizard worden aangepast en opnieuw berekend; wijzigingen creëren een nieuwe immutable calculation snapshot.
- Goedkeurings-/reviewstatussen en bescherming tegen ongecontroleerde wijzigingen aan goedgekeurde/finale berekeningen.
- Professionele overrides met reden en auditability.
- Scenario-engine en scenariovergelijking.
- Rapportage, provenance en audittrail.

### AI/documentlaag

- Documentregister.
- Documentanalyse/statussen.
- AI-voorstellen voor `IncomeFact`.
- Professionele review/goedkeuring van voorgestelde inkomensfeiten.
- AI-runs en provenancegegevens.

### F1 — Professionele werkplek

Afgerond: centrale dossier-workspace, dossierlijst/search, werkvoorraad, taakafhandeling, server-side autorisatie/audit en bescherming tegen autonome juridische mutaties.

### F2 — Slimme dossierprioritering

Afgerond: deterministische 0–100 werkscore, prioriteiten, verklaringen, review/facts/documenten/errors, stale/large-change detection, deadline-druk, dezelfde logica in `/work` en `/cases`, filters en regressietests.

## F3 — Gecontroleerde automatisering

### Afgerond

- Workflow-suggesties en prioriteiten.
- Expliciete taakacceptatie, due dates en duplicaatbescherming voor open taken.
- Agenda-opvolging met starttijd, duur en reminder.
- Persistent e-mailconcept als `MailMessage` met user/client/case-koppeling.
- Concept bewerken, opslaan en verwijderen.
- Server-side verzenden van een opgeslagen concept met lifecycle `DRAFT → SENT`.
- Provider-ID, `MailLog` en audittrail bij verzending.
- Dossiercommunicatiehistorie en directe toegang tot conceptbeheer.
- Geen autonome wijziging van juridische berekeningen, normen of reviewstatus.

### Nog nodig binnen F3

1. Sterkere idempotency/deduplicatie voor agenda- en automation-acties.
2. Taak → voortgekomen agenda/e-mail provenance explicieter maken.
3. Uitgebreidere authorization/ownership/duplicate/lifecycle endpointtests.
4. Eenduidige fout- en statusafhandeling in de mail-UI.
5. Security review van alle automation- en mail-endpoints.
6. E2E-pad testen: suggestie → actie → object → opvolging → afronding → audit.

## F4 — Integratieplatform

### Basis aanwezig

- Versioned API v1.
- Scoped API credentials.
- Webhook subscriptions/events.
- Import/export-contracten.
- Integratie-audittrail.
- Rate limiting en plan-entitlements.

### Eerste F4-stap gestart

De bestaande F4-basis is nu als aparte integratiefase geregistreerd. De volgende implementaties worden production-ready uitgewerkt zonder bestaande tenant-isolatie of reviewgrenzen te omzeilen.

### F4 nog uit te werken

1. API v1 volledig documenteren per endpoint/resource.
2. Credential lifecycle: scopes, rotatie, intrekken en audit.
3. Webhook retries, idempotency en delivery history.
4. Import/export validatie, versiebeheer en foutmeldingen.
5. Integratie-events koppelen aan dossier-, cliënt- en communicatieprovenance.
6. Rate limiting per credential/route/plan verharden.
7. Staging integration smoke tests activeren zodra secrets beschikbaar zijn.
8. Monitoring, health checks en operationele foutdiagnostiek uitbreiden.
9. Security/privacy review van externe integraties.
10. API-documentatie en voorbeeldrequests.

## F5 — Bestaande basis

De explainable-intelligence-laag bestaat al en is bewust signalerend in plaats van autonoom juridisch beslissend. Verdere productisering volgt na F3/F4-hardening.

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

**Nu:** F3 lifecycle hardening afronden.  
**Direct daarna:** F4 API/webhook/integratie-hardening verder uitbouwen.  
**Daarna:** F5 verder productiseren.  
**Parallel:** CI groen houden; geen fase als afgerond markeren zolang relevante tests/build niet groen zijn.

## GitHub-locatie

Dit centrale register staat op `docs/PROJECT-STATUS.md`. De fasebeschrijving staat op `docs/PHASE-F.md`; F4-detail op `docs/PHASE-F4.md`.
