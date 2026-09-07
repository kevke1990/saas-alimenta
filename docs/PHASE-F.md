# Fase F — Workflow intelligence & actiecentrum

Fase F maakt van Alimenta Pro een actieve professionele werkplek in plaats van alleen een reken- en dossierapplicatie.

## Doel

De professional moet direct kunnen zien welk werk prioriteit heeft, zonder door meerdere schermen te zoeken.

## Eerste release

De eerste Fase-F release bevat `/dashboard/attention` met drie werkstromen:

1. **Achterstallige taken** — open taken waarvan de deadline is verstreken.
2. **Taken voor vandaag** — open taken met een deadline binnen de huidige dag.
3. **Dossiers met opvolging** — oudste niet-definitieve dossiers eerst.

Alle queries zijn strikt gescopeerd op de ingelogde gebruiker. Het actiecentrum leest uitsluitend bestaande dossier- en taakgegevens en verandert geen berekening of reviewstatus.

## Ontwerpprincipes

- Geen automatische juridische conclusies.
- Geen wijziging van berekeningsuitkomsten zonder expliciete professionele actie.
- Prioritering moet uitlegbaar zijn.
- Tenant/resource isolation blijft server-side verplicht.
- Persoonsgegevens worden niet naar externe AI gestuurd voor alleen dashboardprioritering.

## Volgende stappen binnen Fase F

### F1 — Actiecentrum

- [x] open taken tonen
- [x] verlopen taken apart tonen
- [x] taken voor vandaag tonen
- [x] open dossiers prioriteren op ouderdom
- [x] resource-level autorisatie

### F2 — Slimme dossierprioritering

- [ ] signalen uit reviewworkflow meenemen
- [ ] ontbrekende professionele goedkeuring detecteren
- [ ] verouderde berekening/normversie signaleren
- [ ] openstaande document-/AI-review signaleren
- [ ] één uitlegbare prioriteitsscore per dossier

### F3 — Automatisering

- [ ] taken automatisch voorstellen op basis van dossierstatus
- [ ] configureerbare reminders
- [ ] agenda-opvolging
- [ ] e-mailconcepten vanuit dossiercontext
- [ ] professionele bevestiging vóór verzending

### F4 — Integratieplatform

- [ ] versioned API
- [ ] scoped API credentials
- [ ] webhook events
- [ ] import/export contracten
- [ ] integratie-audittrail
- [ ] rate limiting en entitlement checks

### F5 — Intelligence

- [ ] explainable dossier health
- [ ] afwijkingsdetectie ten opzichte van eerdere berekeningen
- [ ] AI als signaleringslaag, nooit als autonome juridische beslisser
- [ ] expliciete provenance van ieder intelligent signaal

## Definition of Done

Fase F is volledig afgerond wanneer een professional vanuit één actiecentrum zijn werkvoorraad kan prioriteren, relevante signalen kan opvolgen, reminders kan automatiseren en gecontroleerde externe integraties kan gebruiken zonder verlies van auditability, privacy of berekeningsprovenance.
