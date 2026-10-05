# Historical data completion gate

Merelo must never silently substitute a newer norm set for an older calculation date.
The target is executable, source-traceable data for every supported period from 2006 through 2026, including intra-year transitions where Rechtspraak publishes them.

## Required periods

- 2006–2010: January/July appendices; gate each effective half-year separately
- 2011–2017: H1/H2 periods where applicable
- 2018–2019: annual reports
- 2020: H1/H2
- 2021–2022: annual reports
- 2023: annual norm set
- 2024–2025: annual norm sets
- 2026: January + July norm periods
- 2027: separate engine contract; activate only after official publication

## Required parameter families per executable period

1. child-cost/need tables
2. capacity tables and formula thresholds
3. income-tax parameters used by NBI calculation
4. social-insurance/Zvw parameters
5. minimum-income / assistance-norm inputs
6. care-discount rules/tables
7. KGB and other child-related adjustments used by the applicable report
8. source URL + exact source locator
9. independent reference calculation(s)
10. regression tests at boundaries and transitions

## Release rule

A period is executable only when all required parameter families are verified and its reference calculations pass. A registered source or a partial table is not enough.

## 2027 activation rule

The 2027 module is present now so product/API work can proceed. It remains explicitly provisional until the official 2027 Rapport Alimentatienormen and tables are published. No 2026 fallback is permitted.
