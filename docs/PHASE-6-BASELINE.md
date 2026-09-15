# Fase 6 — Berekening wijzigen, versies en scenario’s

## Baseline vastgesteld op 15 september 2026

De huidige codebase bevat al een substantiële basis voor Fase 6:

- `/cases/[id]/edit` verwijst naar de bestaande wijzigingswizard;
- de wizard laadt de bestaande dossiergegevens en biedt wijziging van dossier-, ouder-, inkomens-, woon- en kindgegevens;
- opslaan gebruikt `PATCH /api/cases/[id]` en herberekent het dossier;
- de berekeningshistorie bewaart meerdere berekeningen per dossier;
- historische berekeningen kunnen afzonderlijk worden bekeken;
- er is een vergelijkingsroute voor twee snapshots;
- historische snapshots kunnen gecontroleerd worden hersteld;
- er bestaan aparte routes voor versies en scenario’s;
- goedgekeurde/definitieve dossiers worden in de wijzigings- en herstelworkflow geblokkeerd.

## Fase 6-doel

Een professional moet een bestaande berekening kunnen aanpassen zonder eerdere uitkomsten te verliezen, verschillen tussen versies kunnen beoordelen en gecontroleerd scenario’s kunnen gebruiken voordat een nieuwe actuele versie wordt vastgesteld.

## Nog te verifiëren en uit te bouwen

1. End-to-end controleren dat iedere wijziging een nieuwe `Calculation`-snapshot oplevert en geen oude snapshot overschrijft.
2. Controleren dat `calculationVersion`, reviewstatus, auditlog en rapportverwijzingen na herberekening consistent worden bijgewerkt.
3. Vergelijking uitbreiden van alleen totalen naar invoerwijzigingen, uitkomstwijzigingen en duidelijke delta’s.
4. Scenario’s expliciet scheiden van de actuele dossierberekening en voorzien van terugzetten/kopiëren naar nieuwe versie.
5. Rapportage laten verwijzen naar een expliciete berekeningsversie.
6. Autorisatie, vergrendeling en foutafhandeling op alle versie- en scenario-endpoints nalopen.

## Eerste ontwikkelvolgorde

- Slice 1: snapshot- en versie-integriteit;
- Slice 2: betekenisvolle versie-delta’s;
- Slice 3: scenario-workflow;
- Slice 4: rapportage per versie;
- Slice 5: integratie- en regressietests.

Dit document is een technische baseline; Fase 6 is hiermee **niet afgerond**.
