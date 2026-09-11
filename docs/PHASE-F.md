# Fase F — Workflow intelligence & actiecentrum

Fase F maakt van Alimenta Pro een actieve professionele werkplek in plaats van alleen een reken- en dossierapplicatie.

## F1 — Professionele werkplek

**Status: afgerond.**

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

- [x] werkscore 0–100
- [x] prioriteitsklassen URGENT / HIGH / NORMAL / LOW
- [x] uitleg per score met concrete redenen
- [x] reviewstatus en professionele controlepunten meegenomen
- [x] voorgestelde inkomensfeiten meegenomen
- [x] documenten in review en documentanalysefouten meegenomen
- [x] ontbrekende berekeningssnapshot meegenomen
- [x] stale berekening via opgeslagen input snapshot
- [x] grote wijziging tussen opeenvolgende berekeningen
- [x] verlopen taken en taken voor vandaag verhogen de werkdrukscore
- [x] dezelfde scorelogica in werkvoorraad en dossierlijst
- [x] prioriteitsfilter
- [x] deterministische regressietests

## F3 — Gecontroleerde automatisering

**Status: in afronding — kernfunctionaliteit gebouwd, hardening en E2E volgen.**

- [x] voorgestelde opvolgtaken
- [x] expliciet taak aanmaken
- [x] duplicaatbescherming voor open taken
- [x] due-date ondersteuning
- [x] agenda-opvolging
- [x] e-mailconcepten persistent opslaan
- [x] concept bewerken en verwijderen
- [x] opgeslagen concept expliciet verzenden met `DRAFT → SENT`
- [x] provider-ID, MailLog en audittrail bij verzending
- [x] dossiercommunicatiehistorie
- [ ] sterkere idempotency/deduplicatie voor agenda en automation-acties
- [ ] taak → voortgekomen object provenance
- [ ] uitgebreide authorization/ownership/lifecycle tests
- [ ] E2E-test van suggestie tot afronding en audit
- [ ] security review van automation/mail endpoints

## F4 — Integratieplatform

**Status: gestart — bestaande basis, production hardening volgt.**

- [x] versioned API v1-basis
- [x] scoped API credentials-basis
- [x] webhook subscriptions/events-basis
- [x] import/export-contracten-basis
- [x] integratie-audittrail-basis
- [x] rate limiting/plan-entitlements-basis
- [ ] volledige API v1-documentatie en voorbeelden
- [ ] credential rotatie/intrekken verder verharden
- [ ] webhook retries, idempotency en delivery history
- [ ] import/export validatie en foutcontracten
- [ ] provenance voor integratie-events
- [ ] uitgebreide rate-limit hardening
- [ ] staging integration smoke tests zodra secrets beschikbaar zijn
- [ ] operationele monitoring/diagnostiek
- [ ] security/privacy review externe integraties

Detailstatus: `docs/PHASE-F4.md`. Centraal register: `docs/PROJECT-STATUS.md`.

## F5 — Explainable intelligence

**Status: bestaande basis; verdere productisering volgt na F3/F4-hardening.**

- [x] unieke signal key en categorie
- [x] severity en confidence
- [x] concrete evidence
- [x] uitlegbare reden
- [x] voorgestelde professionele vervolgstap
- [x] signalen voor ontbrekende onderbouwing/lage confidence
- [x] document-/inkomensreview
- [x] review/goedkeuring
- [x] ontbrekende/verouderde berekeningen/normen
- [x] grote wijzigingen tussen berekeningen
- [x] dossierwijzigingen na laatste berekening
- [x] server-side resource isolation
- [x] human-in-the-loop

## Definition of Done

Fase F is volledig afgerond wanneer een professional vanuit één actiecentrum zijn werkvoorraad kan prioriteren, relevante signalen kan opvolgen, reminders kan automatiseren en gecontroleerde externe integraties kan gebruiken zonder verlies van auditability, privacy of berekeningsprovenance.
