# Historical batch 2017–2020

## Scope

Batch implementation checklist for converting the catalogued 2017–2020 Alimentatienormen sources into executable, provenance-backed historical inputs.

## Period coverage

- 2017-01-01..2017-06-30
- 2017-07-01..2017-12-31
- 2018-01-01..2018-06-30
- 2018-07-01..2018-12-31
- 2019-01-01..2019-06-30
- 2019-07-01..2019-12-31
- 2020-01-01..2020-06-30
- 2020-07-01..2020-12-31

## Required parameter families

1. Need tables / NIBUD-derived child-cost inputs
2. Capacity thresholds and formulas
3. Care discount
4. KGB and child-regulation treatment
5. ZVW / social premiums
6. Tax / net-income conversion inputs used by the adapter
7. Minimum-income / assistance thresholds
8. Indexation
9. Exceptional historical rules documented in the relevant report

## Evidence rule

Every executable value must have an official source, effective period, and locator. Missing evidence remains pending and blocks execution.

## Validation

- Boundary tests at every 1 January and 1 July transition.
- Reference calculations for low, middle and high NBI.
- Regression tests for KGB, care discount and tax/social-premium changes.
- No fallback from another year when a historical value is absent.
