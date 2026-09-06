# Alimenta Pro v0.9.8

v0.9.8 brengt Alimenta Pro van een rekenapplicatie naar een mobiel dossier-, document- en communicatieplatform.

## Kern
- Document Intelligence
- mobiele scanworkflow
- Gemini documentanalyse
- e-mail vanuit de werkplek
- inbound mail forwarding
- uitgebreidere AVG-portabiliteit en wissing

## Vereiste productievariabelen
Zie `.env.example` voor `POSTMARK_SERVER_TOKEN`, `POSTMARK_ACCOUNT_TOKEN`, `POSTMARK_INBOUND_SECRET`, `INBOUND_DOMAIN`, `GOOGLE_AI_API_KEY` en de bestaande encryptie-/databasevariabelen.

## Inbound Postmark
Configureer de inbound webhook op:

`https://<app-domain>/api/mail/inbound?secret=<POSTMARK_INBOUND_SECRET>`

Gebruik Postmark Inbound Domain Forwarding om een eigen adres naar het gegenereerde inboundadres te laten wijzen.

## Mobiel
De camera werkt in een HTTPS secure context. Voor iOS/Android is de fallback "Bestand kiezen" beschikbaar.

## AVG
De export bevat documentinhoud als base64 zodat de cliënt een complete machineleesbare export kan ontvangen. Controleer vóór productie de toepasselijke bewaarplichten en wettelijke uitzonderingen op wissing.
