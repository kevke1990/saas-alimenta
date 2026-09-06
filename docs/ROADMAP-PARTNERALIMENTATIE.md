# Alimenta Pro — Roadmap partneralimentatie

## Doel

Partneralimentatie wordt een zelfstandige module binnen dezelfde alimentatie-architectuur als kinderalimentatie. De modules delen dossierdata, documenten, goedgekeurde feiten, de Income Engine, fiscale parameters, calculation snapshots en audit trail.

## Juridisch/rekenkundig uitgangspunt 2026

- Kinderalimentatie heeft voorrang boven partneralimentatie.
- Als beide worden gevraagd, wordt eerst kinderalimentatie berekend.
- Voor partneralimentatie wordt vervolgens een afzonderlijke draagkrachtberekening gemaakt; het aandeel van de ouder in de kosten van de kinderen wordt daarop in mindering gebracht.
- KGB wordt bij kinderalimentatie in het NBI betrokken, maar niet op dezelfde wijze bij partneralimentatie.
- Partneralimentatie kent daarnaast een eigen behoefte-/behoeftigheidsanalyse, draagkrachtanalyse, inkomensvergelijking en fiscale component.
- De Expertgroep-aanbevelingen zijn geen wet; professionele beoordeling en afwijkingen moeten mogelijk blijven.

## Releasepad

### v0.9.10 — AI/Case Review
- deterministische pre-flight dossiercontrole;
- ontbrekende inkomensbasis, historische NBGI, documentanalyse en accordering signaleren;
- bijzondere kosten, andere onderhoudsverplichtingen en woonlasten markeren;
- jongmeerderjarigen apart signaleren;
- reviewscore en prioriteiten;
- expliciete disclaimer: signalering, geen juridische beslissing.

### v0.9.11 — Calculation Engine Refactor
- KA-capacity loskoppelen van generieke support capacity;
- aparte child-support en partner-support capacity services;
- fiscale engine als zelfstandige laag;
- norm/tariefversies centraal;
- calculation type en volledige input/output snapshots;
- regressietests voor 2026.

### v1.0 — Kinderalimentatie Production
- KA-engine stabiliseren;
- volledige regression suite;
- professionele rapportage;
- scenario's;
- audit trail en reproduceerbaarheid;
- production hardening.

### v1.1 — Partneralimentatie
1. relatie- en scheidingshistorie;
2. historisch NBGI/NBGI-periode;
3. hofnorm en concrete behoefte;
4. behoeftigheid/eigen inkomen;
5. verdiencapaciteit als professionele input;
6. PAL-draagkracht;
7. kinderalimentatie als voorliggende verplichting;
8. inkomensvergelijking;
9. fiscaal voordeel en brutering;
10. duur/ingangsdatum/indexatie;
11. gecombineerd KA + PAL resultaat;
12. volledig rapport en audit.

### v1.1.1 — Complexe PAL-zaken
- ondernemers;
- wisselende inkomsten;
- meerdere onderhoudsverplichtingen;
- eigen woning;
- pensioen;
- bijzondere lasten;
- vermogen/dividend;
- wijzigingsberekeningen;
- uitzonderingssituaties.

### v1.2 — Scenario & wijziging
- wat-als scenario's;
- inkomenswijziging;
- herberekening KA → PAL;
- verschilrapport;
- datumgestuurde vergelijking.

### v1.3 — AI Case Review Pro
- document-overstijgende inconsistenties;
- ontbrekende bewijsstukken;
- signalen rond bonus/IKB/13e maand;
- historische versus actuele inkomenscontrole;
- professionele review queue.

## Architectuurdoel

```text
Documents → AI extraction → Approved Facts → Income Engine
                                             ↓
                                      Alimentatie Engine
                                      ↙               ↘
                              Kinderalimentatie   Partneralimentatie
                                      ↓               ↑
                                      └── priority ───┘
                                             ↓
                                      Combined Result
                                             ↓
                                Report / Scenario / Audit
```

## Ontwerpprincipes

- AI stelt voor; professional accordeert.
- Geen automatische juridische conclusie.
- Elke berekening is reproduceerbaar via versioned snapshots.
- Historische en actuele inkomensperioden blijven gescheiden.
- Fiscale logica staat los van de alimentatiemodule.
- Partneralimentatie kan nooit ongecontroleerd vóór kinderalimentatie worden berekend.
- Afwijkingen en overrides zijn expliciet zichtbaar.
