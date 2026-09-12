# Fase F — Workflow intelligence & actiecentrum

Fase F maakt van Alimenta Pro een actieve professionele werkplek in plaats van alleen een reken- en dossierapplicatie.

## F1 — Professionele werkplek

**Status: afgerond.**

- [x] centraal professioneel dossier-werkblad (`/cases/[id]/workspace`)
- [x] dossieronderdelen vanuit één scherm
- [x] centrale actieve dossierlijst met zoeken en reviewfilter
- [x] centrale werkvoorraad (`/work`)
- [x] open taken zichtbaar in de werkvoorraad
- [x] expliciet afronden/annuleren van taken
- [x] taakstatusmutaties server-side geautoriseerd en geaudit
- [x] geen automatische mutatie van berekeningen, normen of reviewstatus

## F2 — Slimme dossierprioritering

**Status: afgerond.**

- [x] werkscore 0–100 met URGENT / HIGH / NORMAL / LOW
- [x] uitlegbare redenen en deterministische regressietests
- [x] review, inkomensfeiten, documenten, fouten en ontbrekende berekening
- [x] stale berekening en grote wijzigingen
- [x] verlopen taken en taken voor vandaag
- [x] dezelfde scorelogica in werkvoorraad en dossierlijst

## F3 — Gecontroleerde automatisering

**Status: hardening in uitvoering — kernfunctionaliteit operationeel.**

- [x] voorgestelde opvolgtaken
- [x] expliciet taak aanmaken met prioriteit en due date
- [x] duplicaatbescherming voor open taken
- [x] agenda-opvolging
- [x] agenda-deduplicatie op eigenaar, cliënt, titel, start- en eindtijd
- [x] e-mailconcepten persistent opslaan
- [x] concept bewerken en verwijderen
- [x] opgeslagen concept expliciet verzenden met `DRAFT → SENT`
- [x] provider-ID, MailLog en audittrail bij verzending
- [x] dossiercommunicatiehistorie
- [ ] taak → voortgekomen object provenance
- [ ] uitgebreide authorization/ownership/lifecycle tests
- [ ] E2E-test van suggestie tot afronding en audit
- [ ] security review van automation/mail endpoints

## F4 — Integratieplatform

**Status: gestart — eerste documentatie- en contractstap afgerond.**

- [x] versioned API v1-basis
- [x] scoped API credentials-basis
- [x] webhook subscriptions/events-basis
- [x] import/export-contracten-basis
- [x] integratie-audittrail-basis
- [x] rate limiting/plan-entitlements-basis
- [x] eerste API v1-documentatie en curl-voorbeelden (`docs/API-V1.md`)
- [ ] credential rotatie/intrekken verder verharden
- [ ] webhook retries, idempotency en delivery history
- [ ] import/export validatie en foutcontracten in code
- [ ] provenance voor integratie-events
- [ ] uitgebreide rate-limit hardening
- [ ] staging integration smoke tests zodra secrets beschikbaar zijn
- [ ] operationele monitoring/diagnostiek
- [ ] security/privacy review externe integraties

Detailstatus: `docs/PHASE-F4.md`. API-handleiding: `docs/API-V1.md`. Centraal register: `docs/PROJECT-STATUS.md`.

## F5 — Explainable intelligence

**Status: bestaande basis; verdere productisering volgt na F3/F4-hardening.**

- [x] unieke signal key en categorie
- [x] severity en confidence
- [x] concrete evidence en uitlegbare reden
- [x] voorgestelde professionele vervolgstap
- [x] document-/inkomensreview en human-in-the-loop
- [x] ontbrekende/verouderde berekeningen/normen
- [x] grote wijzigingen en dossierwijzigingen na laatste berekening
- [x] server-side resource isolation

## Definition of Done

Fase F is volledig afgerond wanneer een professional vanuit één actiecentrum zijn werkvoorraad kan prioriteren, relevante signalen kan opvolgen, reminders kan automatiseren en gecontroleerde externe integraties kan gebruiken zonder verlies van auditability, privacy of berekeningsprovenance.
