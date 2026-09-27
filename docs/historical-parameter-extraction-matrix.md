# Historical parameter extraction matrix

This matrix is the controlled intake checklist for historical Alimentatienormen. A period must not be marked `parameters-verified` until every required parameter has an official source and an exact source locator.

## Official archive structure

The Rechtspraak Expertgroep Alimentatie archive lists separate reports, behoeftetabellen, bijlagen and draagkrachttabellen for the historical periods. The archive shows distinct January/July material for 2018–2026, half-year material for 2014–2017, and special April/July material for 2013.

## Required extraction set

| Key | Required evidence | Verification rule |
|---|---|---|
| `tableAmount` | Official behoeftetabel / Eigen Aandeel table | Exact table/page recorded |
| `childBudget` | Official child-cost / budget input where applicable | Exact table/page recorded |
| `incomeTaxParameters` | Official report/bijlage or authoritative referenced tax parameters | Effective date recorded |
| `socialPremiumParameters` | Official report/bijlage or authoritative referenced premium parameters | Effective date recorded |
| `minimumIncome` | Official draagkracht/minimum input | Exact source locator recorded |
| `careReduction` | Official report/bijlage rule and percentage | Effective period recorded |
| `otherRequiredNormInputs` | Every remaining input required by the calculation adapter | No unverified fallback allowed |

## Period intake order

1. 2013 — special transition period; verify April and July changes separately.
2. 2014–2017 — verify January/first-half and second-half documents separately.
3. 2018–2020 — verify annual report plus January/July appendices and tables.
4. 2021–2023 — verify annual report plus January/July appendices and tables.
5. 2024–2026 — reconcile existing executable norm sets against the official archive.
6. 2006–2012 — complete the older source set before enabling those periods.

## Hard rules

- A source URL alone does not make a parameter verified.
- A period status is not executable merely because a report exists.
- Never copy a value from an adjacent period as a fallback.
- Never silently substitute 2026 values for a historical calculation.
- If an official value cannot be independently located, leave the parameter `pending` and return `REVIEW_REQUIRED`.

The official Rechtspraak archive is the authoritative source index for this intake. The recommendations are not statutory law and can be departed from in individual cases; Merelo therefore records the source/version rather than presenting a norm as legislation.
