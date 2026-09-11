# Alimenta Pro — Projectstatus & ontwikkelregister

**Repository:** `kevke1990/saas-alimenta`  
**Hoofdbranch:** `main`  
**Statusdocument:** `docs/PROJECT-STATUS.md`

Dit document is het centrale ontwikkelregister. Het beschrijft wat is afgerond, wat momenteel in ontwikkeling is en wat nog nodig is. Bij iedere substantiële fasewijziging moet dit bestand worden bijgewerkt.

## Actuele stand

- Fase F1 — Professionele werkplek: **afgerond**
- Fase F2 — Slimme dossierprioritering: **afgerond**
- Fase F3 — Gecontroleerde automatisering: **in afronding / actief uitgewerkt**
- Fase F4 — Integratieplatform: **volgende hoofdfase, voorbereid**
- Fase F5 — Explainable intelligence: **bestaande basis aanwezig; verdere productisering volgt**

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

Afgerond:

- Centraal dossier-workspace op `/cases/[id]/workspace`.
- Bronnen, inkomensfeiten, berekening, historie, scenario's, review, overrides, rapport en audittrail vanuit één werkplek.
- Centrale dossierlijst met zoeken/reviewfilter.
- Centrale werkvoorraad op `/work`.
- Open taken zichtbaar in de werkvoorraad.
- Taken expliciet afronden/annuleren.
- Server-side autorisatie en auditlogging op taakmutaties.
- Geen automatische wijziging van berekening, norm of reviewstatus.

### F2 — Slimme dossierprioritering

Afgerond:

- Deterministische werkscore 0–100.
- Prioriteiten `URGENT`, `HIGH`, `NORMAL`, `LOW`.
- Concrete verklaringen per score.
- Reviewstatus, voorgestelde inkomensfeiten, documentreview en analysefouten.
- Ontbrekende berekening.
- Stale berekening via vergelijking met input snapshot.
- Grote wijziging tussen opeenvolgende berekeningen.
- Deadline-druk door verlopen taken en taken voor vandaag.
- Dezelfde scorelogica in `/work` en `/cases`.
- Prioriteitsfilter.
- Regressietests voor score en determinisme.

## F3 — Gecontroleerde automatisering

### Afgerond

- Workflow-suggesties voor vervolgtaken.
- Prioriteit van workflow-suggesties.
- Expliciet accepteren van een voorgestelde taak.
- Duplicaatbescherming voor open taken.
- Due-date ondersteuning voor geaccepteerde taken.
- Agenda-opvolging met starttijd, duur en reminder.
- E-mailconceptgeneratie.
- E-mailconcepten worden persistent opgeslagen als `MailMessage` met koppeling aan gebruiker, cliënt en dossier.
- Conceptstatus `DRAFT`.
- Concepten kunnen worden bewerkt en opgeslagen.
- Concepten kunnen worden verwijderd.
- Concepten worden pas bij expliciete verzendactie verzonden.
- Audittrail voor automation-acties, taakacceptatie, agenda-creatie en e-mailconcepten.
- Geen autonome wijziging van juridische berekeningen, normen of reviewstatus.

### Nog nodig binnen F3

- Volledige end-to-end lifecycle van suggestie → taak/agenda/conceptmail → opvolging → afronding.
- Dossierweergave waarin communicatiehistorie en open concepten direct zichtbaar zijn.
- Sterkere deduplicatie/idempotency voor agenda- en mailacties.
- Eenduidige statusmachine voor mailconcepten en verzonden berichten.
- Verzendactie vanuit het opgeslagen concept met behoud van audittrail.
- Koppeling tussen taak en het object dat uit de taak is voortgekomen (agenda/e-mail), zodat provenance zichtbaar blijft.
- Tests voor authorization, ownership, duplicate prevention en lifecycle transitions.
- UX voor fouten, lege ontvanger, ontbrekende afzender en niet-geverifieerde identiteit.
- Security review van alle automation endpoints.

## F4 — Begin gemaakt / volgende hoofdfase

F4 is het integratieplatform rond Alimenta Pro. De repository bevat al een basis voor:

- Versioned API v1.
- Scoped API credentials.
- Webhook subscriptions/events.
- Import/export-contracten.
- Integratie-audittrail.
- Rate limiting en plan-entitlements.

### F4 nog verder uit te werken

1. API v1 volledig documenteren per endpoint en resource.
2. Credential lifecycle: aanmaken, scopes, rotatie, intrekken en audit.
3. Webhook lifecycle: subscriptionbeheer, signing, retries, idempotency en delivery history.
4. Import/export validatie, versiebeheer en foutmeldingen.
5. Integratie-events koppelen aan dossier-, cliënt- en communicatieprovenance.
6. Rate limiting per credential/route/plan verder verharden.
7. Staging integration smoke tests activeren zodra staging secrets beschikbaar zijn.
8. Monitoring, health checks en operationele foutdiagnostiek uitbreiden.
9. Security/privacy review van externe integraties.
10. API-documentatie en voorbeeldrequests toevoegen.

## F5 — Bestaande basis

De explainable-intelligence-laag bestaat al en is bewust signalerend in plaats van autonoom juridisch beslissend.

Aanwezig:

- Unieke signal keys en categorieën.
- Severity en confidence.
- Evidence, explanation en voorgestelde action.
- Signalen voor ontbrekende onderbouwing/lage confidence.
- Document-/inkomensreview.
- Review/goedkeuring.
- Ontbrekende/verouderde berekeningen en normen.
- Grote wijzigingen tussen berekeningen.
- Dossierwijzigingen na laatste berekening.
- Server-side resource isolation.
- Human-in-the-loop.

Verdere productisering van F5 volgt na de integratie- en automation-hardening.

## Technische kwaliteitsstatus

De CI-pipeline controleert minimaal:

- repository hygiene
- dependency installation
- security audit
- Prisma schema/migrations/generate
- tests
- production build
- runtime health/readiness
- production Compose
- production Docker image
- image user
- deployment scripts

De `staging-smoke` job kan worden overgeslagen wanneer de vereiste stagingconfiguratie/secrets niet beschikbaar zijn. Dat is geen reden om lokaal of in CI een groene stagingtest te simuleren.

## Belangrijke ontwerpregels

1. **Human-in-the-loop:** automatisering mag signaleren, voorbereiden en uitvoeren na expliciete professionele actie, maar beslist niet zelfstandig over juridische inhoud.
2. **Geen autonome rekenmutaties:** workflow automation mag geen norm, berekening of reviewstatus zelfstandig wijzigen.
3. **Auditability:** iedere muterende professionele workflowactie moet traceerbaar zijn.
4. **Resource isolation:** alle serveracties moeten ownership op gebruiker/dossier/cliënt afdwingen.
5. **Provenance:** AI- en workflowresultaten moeten terug te leiden zijn naar concrete bronnen/objecten.
6. **Idempotency:** herhaalde automation requests mogen geen ongecontroleerde duplicaten produceren.
7. **Privacy by design:** communicatiegegevens en dossierdata worden niet onnodig geëxporteerd of blootgesteld.
8. **Versioning:** API-, norm-, reken- en import/exportcontracten moeten expliciet versieerbaar blijven.

## Ontwikkelvolgorde vanaf hier

**Nu:** F3 volledig afronden en end-to-end maken.  
**Daarna:** F4 hardening en integratiecontracten production-ready maken.  
**Daarna:** F5 verder productiseren op basis van de stabiele workflow- en integratielaag.  
**Parallel:** CI groen houden; geen fase als afgerond markeren zolang de relevante tests en productie-build niet groen zijn.

## GitHub-locatie

Dit register staat bewust op:

`docs/PROJECT-STATUS.md`

De bestaande fasebeschrijving staat op:

`docs/PHASE-F.md`

`docs/PHASE-F.md` beschrijft de fase; `docs/PROJECT-STATUS.md` is het actuele centrale projectregister voor **gedaan / bezig / nog nodig / volgende stap**.
