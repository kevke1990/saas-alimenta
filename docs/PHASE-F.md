# Fase F — Workflow intelligence & actiecentrum

Fase F maakt van Alimenta Pro een actieve professionele werkplek in plaats van alleen een reken- en dossierapplicatie.

## Doel

De professional moet direct kunnen zien welk werk prioriteit heeft, zonder door meerdere schermen te zoeken.

## F2 — Slimme dossierprioritering

De eerste F2-release bouwt voort op `/dashboard/attention` en geeft ieder dossier een **uitlegbare werkscore van 0–100**. De score is nadrukkelijk geen juridisch oordeel en verandert geen berekening, norm, reviewstatus of dossierdata.

De score gebruikt uitsluitend bestaande, server-side geautoriseerde workflowgegevens:

- achterstallige taken: +35
- taken voor vandaag: +10
- wachten op professionele review: +30
- professionele review nog incompleet: +25
- review uitgevoerd maar goedkeuring ontbreekt: +20
- voorgestelde inkomensfeiten die beoordeling vragen: +25
- documenten die nog geen professionele/AI-review hebben afgerond: +15
- geen berekening beschikbaar: +20
- berekening gebruikt een andere actieve normversie: +20

De totaalscore wordt begrensd op 100. **Hoog** is 60+, **middel** is 30–59 en **laag** is 0–29. De onderliggende signalen worden naast de score getoond zodat de professional kan zien waarom een dossier hoger staat.

### F2 status

- [x] signalen uit reviewworkflow meenemen
- [x] ontbrekende professionele goedkeuring detecteren
- [x] verouderde berekening/normversie signaleren
- [x] openstaande document-/AI-review signaleren
- [x] één uitlegbare prioriteitsscore per dossier
- [x] server-side resource isolation behouden
- [x] geen automatische juridische conclusie of berekeningswijziging

## Eerste release

De eerste Fase-F release bevat `/dashboard/attention` met drie werkstromen:

1. **Achterstallige taken** — open taken waarvan de deadline is verstreken.
2. **Taken voor vandaag** — open taken met een deadline binnen de huidige dag.
3. **Dossiers met opvolging** — dossiers met de hoogste uitlegbare werkscore eerst.

Alle queries zijn strikt gescopeerd op de ingelogde gebruiker. Het actiecentrum leest uitsluitend bestaande dossier-, taak-, document-, inkomensfeit-, berekenings- en normgegevens en verandert geen berekening of reviewstatus.

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
- [x] open dossiers prioriteren
- [x] resource-level autorisatie

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
