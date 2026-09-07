# Fase F — Workflow intelligence & actiecentrum

Fase F maakt van Alimenta Pro een actieve professionele werkplek in plaats van alleen een reken- en dossierapplicatie.

## Doel

De professional moet direct kunnen zien welk werk prioriteit heeft, zonder door meerdere schermen te zoeken.

## F2 — Slimme dossierprioritering

De F2-release geeft ieder dossier een uitlegbare werkscore van 0–100. De score is geen juridisch oordeel en verandert geen berekening, norm, reviewstatus of dossierdata. Signalen omvatten taken, reviewstatus, openstaande inkomensfeiten, document-/AI-review, ontbrekende berekeningen en afwijkende normversies. De score wordt server-side berekend en resource-geïsoleerd weergegeven.

### F2 status
- [x] reviewworkflow-signalen
- [x] ontbrekende professionele goedkeuring
- [x] verouderde normversie
- [x] document-/AI-review
- [x] uitlegbare prioriteitsscore
- [x] server-side resource isolation
- [x] geen automatische juridische conclusie of berekeningswijziging

## F3 — Gecontroleerde automatisering

F3 bouwt voort op de dossierworkflow met een gecontroleerde automatiseringslaag. Vanuit `/cases/[id]/automation` kan de professional:

- [x] opvolgtaken laten voorstellen op basis van dossierstatus en concrete workflowsignalen
- [x] een voorgestelde taak expliciet accepteren en aan de werkvoorraad toevoegen
- [x] een agenda-opvolging aanmaken met instelbare herinnering
- [x] een e-mailconcept genereren vanuit dossiercontext
- [x] verzending uitsluitend als expliciete professionele actie laten plaatsvinden
- [x] iedere geaccepteerde taak/agenda-actie auditten

Automatisering wijzigt nooit zelfstandig een berekening, norm of reviewstatus. De huidige F3-release gebruikt bestaande `Task`- en `CalendarEvent`-gegevens; er wordt geen aparte scheduler of externe AI vereist voor de workflowvoorstellen.

## F1 status
- [x] open taken tonen
- [x] verlopen taken apart tonen
- [x] taken voor vandaag tonen
- [x] open dossiers prioriteren
- [x] resource-level autorisatie

## F4 — Integratieplatform
- [ ] versioned API
- [ ] scoped API credentials
- [ ] webhook events
- [ ] import/export contracten
- [ ] integratie-audittrail
- [ ] rate limiting en entitlement checks

## F5 — Intelligence
- [ ] explainable dossier health
- [ ] afwijkingsdetectie ten opzichte van eerdere berekeningen
- [ ] AI als signaleringslaag, nooit als autonome juridische beslisser
- [ ] expliciete provenance van ieder intelligent signaal

## Definition of Done

Fase F is volledig afgerond wanneer een professional vanuit één actiecentrum zijn werkvoorraad kan prioriteren, relevante signalen kan opvolgen, reminders kan automatiseren en gecontroleerde externe integraties kan gebruiken zonder verlies van auditability, privacy of berekeningsprovenance.
