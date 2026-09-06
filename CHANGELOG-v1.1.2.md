# Alimenta Pro v1.1.2

## Hardening & rekenkundige validatie

- Officiële 2026 draagkrachttabel-ankerpunten als geautomatiseerde regressietests toegevoegd.
- AOW-ankerpunten afzonderlijk gevalideerd.
- Afronding rond exacte halve euro's numeriek stabiel gemaakt.
- Partnerengine bug opgelost waarbij hypotheekrentevoordeel vóór initialisatie werd gebruikt.
- Concrete behoefteposten worden opgeteld in plaats van gemiddeld.
- Tijdlijn- en onmogelijke historische invoer geven expliciete waarschuwingen.
- Complexe PAL-input krijgt een deterministische pre-flight validatie.
- Woonlast boven 30%-woonbudget blijft zichtbaar en wordt niet stilzwijgend als aftrek toegepast; professionele beoordeling blijft vereist.
- Runtime anchor validation uitgevoerd zonder afwijkingen.
- Volledige Vitest/Next productiebuild kon in de buildomgeving niet worden uitgevoerd omdat dependencies niet beschikbaar kwamen binnen de uitvoeringstimeout.

## Normbasis

De validatie gebruikt de officiële Rechtspraak draagkrachttabel 2026 en het Rapport Alimentatienormen 2026. De aanbevelingen van de Expertgroep zijn geen wet en individuele omstandigheden kunnen afwijking rechtvaardigen.
