# Alimenta Pro — AVG/Privacy-by-design v0.9.7

## Scope
Deze release bouwt technische ondersteuning voor de AVG/GDPR in. Het is **geen juridische certificering** en vervangt geen privacyjurist, FG/DPO, DPIA, verwerkingsregister, bewaarbeleid of verwerkersovereenkomst.

## Rechten van betrokkenen
De applicatie ondersteunt operationeel:
- inzage (Art. 15)
- rectificatie (Art. 16; procesmatig, via de behandelaar)
- beperking (Art. 18; procesmatig)
- bezwaar (Art. 21; procesmatig)
- dataportabiliteit (Art. 20)
- wissing/vergetelheid (Art. 17), voor zover geen uitzondering geldt

De AP beschrijft deze rechten en de verantwoordingsplicht; EDPB-richtsnoeren ondersteunen onder meer transparantie, dataportabiliteit, DPIA en geautomatiseerde besluitvorming.

## Download + verwijderen
Een tenant-operator kan vanuit `/privacy` een beveiligde, eenmalige cliëntlink genereren. De link is een bearer credential en is 7 dagen geldig. De betrokkene kan:
1. de gegevens als JSON exporteren; of
2. de export laten genereren en daarna de operationele cliëntgegevens laten verwijderen.

De export bevat cliëntgegevens, gekoppelde dossiers, calculation snapshots, agenda-events, usage events, privacyverzoeken en consent records.

### Belangrijke uitzondering
Niet elk gegeven mag altijd worden gewist. Wettelijke bewaarplichten, rechtsvorderingen, fiscale/boekhoudkundige verplichtingen en noodzakelijke verantwoordingsinformatie kunnen verwijdering beperken. De workflow verwijdert daarom operationele cliëntdata; audit/accountability informatie kan alleen worden behouden waar dat noodzakelijk en proportioneel is en wordt waar mogelijk gepseudonimiseerd.

## Beveiliging
- bearer tokens worden alleen als SHA-256 hash opgeslagen
- tokens zijn 7 dagen geldig
- privacy-exporten krijgen `Cache-Control: no-store`
- de export wordt niet via een publieke index beschikbaar gemaakt
- tenant-isolatie blijft verplicht op alle operator-endpoints
- AI kan centraal worden uitgeschakeld met `AI_PROCESSING_DISABLED=true`

## AI / Google AI Studio
De Gemini-adapter is ontworpen voor extractie van inkomenscomponenten uit documenttekst. De AI geeft alleen een voorstel terug. De professional moet de gegevens controleren.

Voor productie moet de controller vóór activering beoordelen:
- doel en grondslag van AI-verwerking
- verwerkers-/subverwerkersafspraken
- doorgifte buiten de EER en passende waarborgen
- bewaartermijnen
- welke persoonsgegevens daadwerkelijk naar het model mogen
- DPIA indien de verwerking waarschijnlijk een hoog risico oplevert
- Art. 22-implicaties wanneer geautomatiseerde besluitvorming juridische of vergelijkbaar significante gevolgen kan hebben

## Governance die voor v1.0 nog nodig is
- tenant-configureerbaar verwerkingsregister (RoPA)
- bewaartermijnmatrix per gegevenscategorie
- verwerkersovereenkomst/DPA-flow
- subprocessor register
- datalekregister en 72-uurs workflow
- DPIA-module
- consent register met rechtsgrond per doel
- privacy notice/versioning
- automatische retention jobs met uitzonderingsregels
- export in machine-readable én mensleesbare vorm
- identity verification voor externe cliëntverzoeken
- rate limiting en abuse protection op publieke privacy-links
- formele legal review
