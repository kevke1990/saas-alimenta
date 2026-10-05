# Historical 2011 source manifest

## Status

`2011` remains `REVIEW_REQUIRED` until the complete historical parameter set and independent reference calculations are verified. No 2011 calculation may silently fall back to a later year.

## Official source

The Rechtspraak Expertgroep Alimentatie archive identifies a 2011 historical appendix. The currently available official source is:

- **Bijlage 2011, tweede helft — July 2011**
- Official publisher: Rechtspraak / Werkgroep Alimentatienormen
- Source: https://www.rechtspraak.nl/binaries/_rts_1769091122481/content/assets/lbvr/an/lbvr-an-bijlage-2011-tweede-helft.pdf

The July 2011 appendix explicitly documents the July 2011 net method, including the following historical inputs:

- bijstandsnorm inclusief vakantiegeld: €1,320 gehuwden; €1,188 alleenstaande ouder; €924 alleenstaande;
- average basic rent: €210 per month;
- nominal ZVW component included in the assistance norm: €45 per month for a single person and €83 per month for a married couple;
- mandatory excess: €170 per year;
- capacity percentages: 50% for a family and 70% for a single person in the documented net method.

## Required completion work

Before 2011 can become executable, Merelo must separately verify and test:

1. first-half / second-half applicability and any transition dates;
2. complete child-need tables and own-share tables applicable in 2011;
3. complete income/capacity parameters and tax/social-insurance inputs;
4. care discount rules and any historical changes;
5. KGB and related child-component treatment;
6. special-cost and debt-treatment rules;
7. provenance for every numeric parameter;
8. at least one independently reconstructed reference calculation per applicable period;
9. boundary and regression tests;
10. resolver integration without fallback to 2012+ rules.

## Safety rule

Do not change the historical registry from `REVIEW_REQUIRED` to executable merely because a source document exists. Each required parameter category must be independently verified first.
