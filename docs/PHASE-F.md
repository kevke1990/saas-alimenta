# Fase F — Workflow intelligence & actiecentrum

Fase F maakt van Alimenta Pro een actieve professionele werkplek in plaats van alleen een reken- en dossierapplicatie.

## F1 — Professionele werkplek

**Status: afgerond.**

De professional kan vanuit één centrale werkplek door een dossier werken en direct naar de juiste vervolgstap springen.

- [x] centraal professioneel dossier-werkblad (`/cases/[id]/workspace`)
- [x] dossieronderdelen vanuit één scherm: bronnen, inkomensfeiten, berekening, historie, scenario's, review, overrides, rapport en audittrail
- [x] centrale actieve dossierlijst met zoeken en reviewfilter
- [x] centrale werkvoorraad (`/work`)
- [x] open taken vanuit dossiers zichtbaar in de werkvoorraad
- [x] expliciet afronden/annuleren van taken
- [x] taakstatusmutaties server-side geautoriseerd en geaudit
- [x] geen automatische mutatie van berekeningen, normen of reviewstatus

## F2 — Slimme dossierprioritering

**Status: afgerond.**

De F2-release geeft ieder actief dossier een deterministische, uitlegbare werkscore van 0–100. De score is geen juridisch oordeel en verandert geen berekening, norm, reviewstatus of dossierdata.

- [x] werkscore 0–100
- [x] prioriteitsklassen URGENT / HIGH / NORMAL / LOW
- [x] uitleg per score met concrete redenen
- [x] reviewstatus en professionele controlepunten meegenomen
- [x] voorgestelde inkomensfeiten meegenomen
- [x] documenten in review en documentanalysefouten meegenomen
- [x] ontbrekende berekeningssnapshot meegenomen
- [x] stale berekening gedetecteerd via vergelijking met de opgeslagen input snapshot
- [x] grote wijziging tussen opeenvolgende berekeningen gedetecteerd
- [x] verlopen taken en taken voor vandaag verhogen de werkdrukscore
- [x] dezelfde scorelogica in werkvoorraad en dossierlijst
- [x] prioriteitsfilter in de centrale werkvoorraad
- [x] deterministische regressietests voor score, redenen, deadline-druk en grote wijzigingen

## F3 — Gecontroleerde automatisering

F3 voegt gecontroleerde opvolgtaken, agenda-opvolging en e-mailconcepten toe. Iedere muterende automatiseringsactie is expliciet en wordt geaudit. Automatisering wijzigt nooit zelfstandig een berekening, norm of reviewstatus.

- [x] voorgestelde opvolgtaken
- [x] expliciet taak aanmaken
- [x] agenda-opvolging
- [x] e-mailconcepten
- [x] audittrail op muterende automation-acties
- [x] expliciet afronden/annuleren van taken

## F4 — Integratieplatform

- [x] versioned API v1
- [x] scoped API credentials
- [x] webhook subscriptions/events
- [x] import/export contracten
- [x] integratie-audittrail
- [x] rate limiting en plan-entitlements

API-documentatie en operationele uitgangspunten staan in `docs/PHASE-F4.md`.

## F5 — Explainable intelligence

F5 is bewust een **signalering- en controlelaag**, geen autonome juridische beslisser. De engine `lib/explainable-intelligence.ts` werkt deterministisch en produceert per signaal:

- [x] unieke signal key en categorie
- [x] severity en confidence
- [x] concrete evidence waarop het signaal is gebaseerd
- [x] uitlegbare reden
- [x] voorgestelde professionele vervolgstap
- [x] signalen voor ontbrekende onderbouwing en lage confidence
- [x] signalen voor openstaande document-/inkomensreview
- [x] signalen voor review/goedkeuring
- [x] signalen voor ontbrekende of verouderde berekeningen/normen
- [x] detectie van grote wijzigingen tussen opeenvolgende berekeningen
- [x] detectie van dossierwijzigingen na de laatste berekening
- [x] server-side resource isolation
- [x] human-in-the-loop: geen automatische wijziging van berekening, norm of reviewstatus

De signalen zijn beschikbaar via `/api/cases/[id]/intelligence` en in de bestaande dossierpagina `/cases/[id]/intelligence`.

### Provenance-principe

Een intelligent signaal mag alleen verwijzen naar gegevens die de server daadwerkelijk heeft aangetroffen. Daarom bevat elk signaal `evidence`, `explanation`, `confidence` en `action`. Confidence is een betrouwbaarheid van het **signaal**, niet een juridische waarschijnlijkheid of bewijswaarde.

### Grenzen

F5 geeft controlehints en kan geen juridische juistheid vaststellen. Een professional blijft verantwoordelijk voor broncontrole, interpretatie, berekening, review en goedkeuring. Externe generatieve AI is niet nodig om F5 te laten functioneren.

## Definition of Done

Fase F is volledig afgerond wanneer een professional vanuit één actiecentrum zijn werkvoorraad kan prioriteren, relevante signalen kan opvolgen, reminders kan automatiseren en gecontroleerde externe integraties kan gebruiken zonder verlies van auditability, privacy of berekeningsprovenance.
