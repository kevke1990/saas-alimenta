# Historical implementation batch 2017-2020

This batch moves the historical work from planning to implementation requirements.

## Rules
- Never silently reuse a parameter from another year.
- Every period requires parameter provenance and a reference calculation.
- Missing required parameters fail closed.
- January/July transitions are explicit period boundaries.
- 2013's April transition remains handled separately.

## Validation matrix
Years: 2017, 2018, 2019, 2020.

For each year validate:
1. NBI bands and thresholds.
2. Carrying-capacity percentages and fixed deductions.
3. Minimum carrying capacity.
4. AOW/non-AOW variants where applicable.
5. Child need and care discount inputs.
6. KGB treatment.
7. Tax/ZVW inputs used by the net-income adapter.
8. Boundary dates and rounding.
9. Official source locator.
10. At least one reference calculation.

This file intentionally contains no unverified numeric parameters; numeric data must be added only from the primary historical sources and covered by tests.
