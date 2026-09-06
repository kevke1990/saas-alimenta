# Alimenta Pro v1.2.0

## Scenario & Wijzigingen Engine

- Immutable `CalculationScenario` persistence.
- Scenario's maken een volledige kopie van de gevalideerde case-input en wijzigen alleen expliciet opgegeven velden.
- Kinderalimentatie wordt opnieuw berekend met de bestaande production engine.
- Indien partneralimentatie-input aanwezig is, wordt PAL automatisch opnieuw berekend met de scenario-KA als prioritaire kinderalimentatie.
- Scenario fingerprints via SHA-256.
- Audit events voor aanmaken/verwijderen.
- Scenario UI per dossier.
- Ondersteuning voor inkomensscenario's ouder A/B en leeftijdswijziging per kind.
- Hoofddossier blijft onveranderd.
