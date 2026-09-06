# Alimenta Pro v1.1.0 — Partneralimentatie

## Nieuw
- Deterministische partneralimentatie-engine voor 2026.
- Hofnorm: 60% × (historisch NBGI − eigen aandeel kosten kinderen).
- Indexatie van historische behoefte.
- Aanvullende behoefte op basis van huidig NBI en expliciete verdiencapaciteit.
- Partnerdraagkracht via gedeelde support-capacity layer met 60%-formule.
- Kinderalimentatie-prioriteit: KA-aandeel wordt vóór partneralimentatie van de draagkracht afgetrokken.
- Inkomensvergelijking als expliciete aanvullende toets.
- Brutering volgens 2026 Buijs-methode / voorzienbaar fiscaal voordeel.
- Duurmodule met hoofdregel en expliciete uitzonderingskeuze.
- Immutable Calculation snapshot via bestaande Calculation-tabel.
- Nieuwe API: `POST /api/cases/[id]/partneralimentatie`.
- Nieuwe professionele UI: `/cases/[id]/partneralimentatie`.

## Bewuste grenzen
- Ondernemers-/dividendinkomen, complexe vermogenscomponenten en diepgaande concrete behoeftelijsten zijn niet automatisch juridisch beslist.
- Verdiencapaciteit is een expliciete professionele invoer, geen AI-beslissing.
- Duur-uitzonderingen worden gesignaleerd maar vereisen menselijke verificatie.
