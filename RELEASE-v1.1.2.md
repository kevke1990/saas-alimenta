# Release v1.1.2

Alimenta Pro v1.1.2 is een hardening-release voor de rekenmotoren.

## Validatie

De 2026 kinderalimentatie-draagkrachttabel is gevalideerd op de officiële schijfgrenzen, inclusief AOW. De partnerengine is gevalideerd tegen het officiële 2026 rekenvoorbeeld van €4.000 NBI → €861 basisdraagkracht.

Daarnaast zijn regressies toegevoegd voor KA-prioriteit, concrete behoefteposten, historische tijdlijnen en complexe inkomenscomponenten.

## Productiestatus

De rekenkundige kern is statisch en runtime gevalideerd. Een volledige `npm test` en `next build` moeten nog worden uitgevoerd in een omgeving waarin de projectdependencies volledig geïnstalleerd zijn.
