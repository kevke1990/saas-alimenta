# Fase F — Workflow intelligence & actiecentrum

Fase F maakt van Alimenta Pro een actieve professionele werkplek in plaats van alleen een reken- en dossierapplicatie.

## F2 — Slimme dossierprioritering

De F2-release geeft ieder dossier een uitlegbare werkscore van 0–100. De score is geen juridisch oordeel en verandert geen berekening, norm, reviewstatus of dossierdata.

## F3 — Gecontroleerde automatisering

F3 voegt gecontroleerde opvolgtaken, agenda-opvolging en e-mailconcepten toe. Iedere muterende automatiseringsactie is expliciet en wordt geaudit. Automatisering wijzigt nooit zelfstandig een berekening, norm of reviewstatus.

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
