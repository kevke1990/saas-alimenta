# Release v1.2.0

Alimenta Pro v1.2.0 introduceert de Scenario & Wijzigingen Engine.

## Kern

Een professional kan vanuit een bestaand dossier een scenario berekenen zonder de basisberekening te wijzigen. De scenario-input, wijzigingen, output en SHA-256 fingerprint worden als immutable record opgeslagen.

## Gecombineerde KA/PAL

Als het dossier eerder een partneralimentatie-input heeft opgeslagen, gebruikt het scenario de nieuw berekende kinderalimentatie als `currentChildSupport` voor de PAL-berekening. Daarmee kan een wijziging in KA doorwerken naar resterende PAL-draagkracht.

## Productiestappen vóór demo

1. `npx prisma db push` of gecontroleerde migratie uitvoeren.
2. `npm ci`.
3. `npm test`.
4. `npm run build`.
5. Staging deploy.
6. E2E smoke tests voor login, dossier, KA, PAL, scenario's, rapport en billing.
7. Testdatabase reset/seed en demo-dossier aanmaken.
