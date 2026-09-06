# Alimenta Pro — Changelog

Alle historische changelog- en release-notities zijn samengebracht in dit ene centrale document. Vanaf v1.3.1-rc1 worden geen losse `CHANGELOG-*` of `RELEASE-*` bestanden meer bijgehouden.

## v1.3.1-rc1 — Demo Release Candidate
- Demo mode en zichtbare demo-banner.
- Geautomatiseerde Debian 13 deployment als primaire VPS-demo route.
- Idempotente secret-generatie; bestaande secrets worden behouden.
- PostgreSQL private-only deployment, Nginx reverse proxy, UFW en fail2ban.
- Prisma `migrate deploy` vóór productie-start.
- `alimenta` CLI voor doctor, status, logs, backup, update en restore.
- Backup met SHA-256 checksum en 30-daagse retentie.
- Update met databasebackup, previous-image fallback en healthcheck.
- Preflight-controles en fictieve demo-seed.
- TOTP-MFA operationeel, database-backed authentication rate limiting en dagelijkse retention job.
- Passkey credential-model aanwezig; volledige WebAuthn browser ceremony is nog geen RC-feature.

## v1.3.0 — Hardening & professional review
- ProfessionalOverride model/API/UI.
- Reviewworkflow: `INCOMPLETE → READY_FOR_REVIEW → REVIEWED → APPROVED → FINAL`.
- Audit events voor statuswijzigingen en overrides.
- Rapport uitgebreid met professionele status en afwijkingen.
- Authentication rate limiting.
- Role/MFA/passkey security fundament.
- Versioned Prisma migration en hardening/regressietests.

## v1.2.0 — Scenario & Wijzigingen Engine
- Immutable `CalculationScenario` records.
- Scenario's kopiëren gevalideerde case-input en wijzigen alleen expliciete velden.
- KA wordt opnieuw berekend met de production engine.
- PAL wordt, indien aanwezig, opnieuw berekend met scenario-KA als prioritaire kinderalimentatie.
- SHA-256 scenario fingerprints en audit events.
- Scenario UI per dossier.
- Inkomensscenario's voor ouder A/B en leeftijdswijziging per kind.

## v1.1.2 — Calculation hardening
- Officiële 2026 draagkrachttabel-ankerpunten en AOW-ankerpunten als regressietests.
- Numeriek stabiele afronding.
- Partnerengine bugfix voor hypotheekrentevoordeel.
- Concrete behoefteposten worden opgeteld.
- Tijdlijn- en onmogelijke historische invoer geeft waarschuwingen.
- Deterministische PAL pre-flight validatie.
- Woonlast boven het 30%-woonbudget wordt zichtbaar gehouden en niet stilzwijgend afgetrokken.

## v1.1.1 — Complexe partneralimentatie
- Meerjarige ondernemerswinst en variabel inkomen.
- Dividend, Box 3 en overige vermogensinkomsten.
- Gescheiden bedrijfsinkomen en verdiencapaciteit.
- Eigen woning/fiscale correcties.
- Pensioen/lijfrentevoorzieningen en meerdere onderhoudsverplichtingen.
- SHA-256 fingerprint per PAL-berekening.

## v1.1.0 — Partneralimentatie
- Zelfstandige deterministische partneralimentatie-engine voor 2026.
- Hofnorm, aanvullende behoefte, partnerdraagkracht en KA-prioriteit.
- Inkomensvergelijking en brutering.
- Duurmodule met professionele uitzonderingskeuze.
- Immutable Calculation snapshots.
- Professionele PAL UI en API.

## v1.0.0 — Kinderalimentatie production engine
- Production-ready 2026 kinderalimentatie-engine.
- Geharde draagkrachtlogica en lage-inkomensminimums.
- Correcte woonbudgetbehandeling en zorgkortingbasis.
- Shortfall/care-discount rule.
- Calculation fingerprint en production regression tests.

## v0.9.9 — AI Document Intelligence & dossierworkflow
- Gestructureerde AI-documentextractie en stateless Gemini verwerking.
- IncomeFact met confidence, pagina/sourceHint en menselijke accordering.
- Batchanalyse per dossier en audit trail voor AI-runs.
- Dossier Health/completeness score.
- Automatische inbound e-mail → cliënt/dossier matching.
- PWA/service-worker basis en professionele income review.

## v0.9.8 — Mobile, documents & mail
- Mobiele scanmodule en camera capture.
- Versleutelde documentopslag en SHA-256-integriteit.
- Gemini documentanalyse.
- Professionele e-mailcomposer, Postmark Sender Signature en inbound routes.
- Uitgebreidere AVG-export en operationeel wissen.
- PWA/mobile metadata.

## v0.9.7 — AVG & AI
- Privacycentrum, inzage/export en download/verwijder workflow.
- PrivacyRequest en ConsentRecord.
- Pseudonimisering van relevante auditmetadata bij verwijdering.
- Gemini inkomensdocumentextractie en AI opt-out.

## v0.9.6 — Income Engine
- Structured income profiles per ouder.
- NBI/net/gross routes en jaarlijkse brug naar geschat maand-NBI.
- 2026 Box 1 tarieven, heffingskortingen, IACK, IKB/PKB en toeslag-/inkomenscomponenten.
- Pensioen, arbeidsongeschiktheid, bonussen, overwerk en Box 3 als afzonderlijke componenten.
- Auditable income warnings en calculation components.

## v0.9.5 — Professional calculation core
- Behoefte, draagkracht, draagkrachtvergelijking, zorgkorting en indicatieve bijdrage als afzonderlijke stappen.
- 2026 draagkrachttabel/formule.
- NBGI-basis met NBI en historisch KGB.
- Zorgkorting 5/15/25/35%.
- Hoofdverblijf A/B en 50/50.
- WSF-basis voor 18–21 jaar.
- Bijzondere lasten en overige onderhoudsverplichtingen als expliciete correcties.
- Regressietests en auditinformatie.

## v0.9.4 — Dossier/resultaat workflow
- `/cases` dossieroverzicht en professioneler resultaatdashboard.
- Afdrukbaar rapport endpoint.
- Case metadata en uitgesplitste zorgkorting.
- Normversie en engineversie afzonderlijk zichtbaar.

## v0.9.2 — UI foundation & calculation wizard
- Professionele app-shell, dashboard, cliënten- en dossierflows.
- Zesstaps berekeningswizard.
- Gestructureerde ouder-, kind-, inkomen-, zorg- en toeslagenvelden.
- Server-side Zod-validatie en ownership checks.
- Responsive desktop/tablet/mobile UI.

## V8 — Branding & white-label foundation
- Tenant/customer branding met logo, favicon, kleuren, fonts en rapporttitel.
- Server-side branding endpoint en veilige allowlisting.
- Tenant-isolatie op basis van user ownership.

## V10 — Custom domains, agenda & mail foundation
- Cloudflare for SaaS custom-hostname provisioning en lifecycle.
- Tenant-based custom domain lookup.
- Agenda met cliëntkoppeling.
- E-mailidentiteiten per tenant en Postmark sending adapter.

## Juridische en productpositionering
Alimenta Pro is een professioneel reken- en dossiervoeringshulpmiddel. De rekenmotor volgt geïmplementeerde uitgangspunten uit het Rapport Alimentatienormen 2026, maar software-uitvoer is geen rechterlijk oordeel en vervangt geen professionele beoordeling. De aanbevelingen van de Expertgroep Alimentatienormen zijn geen wet; individuele omstandigheden kunnen afwijking rechtvaardigen.

Voor de actuele status en openstaande beperkingen: zie `README.md` en de actuele documenten onder `docs/`.
