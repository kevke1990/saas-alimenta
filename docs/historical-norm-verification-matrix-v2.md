# Historical norm verification matrix v2

This document is the release gate for historical alimentatie calculations. A period is not executable merely because a source document exists. Every required parameter must be extracted from the applicable official version and independently verified.

## Official source model

The Rechtspraak Expertgroep Alimentatie archive publishes period-specific reports and supporting tables. For 2013 the archive lists April and July reports plus separate first/second-half appendices and two draagkrachttabellen. From 2014 onward, multiple periods likewise have separate reports/appendices. From 2018 through 2026 the archive explicitly lists January reports, July appendices, needs tables and draagkracht tables. See the official archive: https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/expertgroep-alimentatienormen

## Required evidence per executable period

| Key | Required evidence | Verification rule |
|---|---|---|
| tableAmount | applicable behoeftetabel/eigen-aandeel table | exact table/version and effective date recorded |
| childBudget | child-cost inputs and applicable table rules | source locator recorded; no cross-period fallback |
| incomeTaxParameters | applicable tax/NBI inputs | source/version and effective period recorded |
| socialPremiumParameters | applicable social-premium inputs | source/version and effective period recorded |
| minimumIncome | applicable minimum/draagkrachtloos income | exact source locator recorded |
| careReduction | applicable zorgkorting rule/percentage | exact version and effective period recorded |
| otherRequiredNormInputs | every additional input required by the period's model | explicit checklist closure |

## Period transition rules

1. A period boundary is determined by the effective date stated by the applicable official document, not by an inferred calendar convention.
2. January and July versions are separate where the official archive provides both.
3. Special transition publications (for example the 2013 April and July publications) must be represented explicitly before execution is enabled.
4. A parameter from a later period must never be used to fill an earlier period.
5. A missing or ambiguous source locator keeps the parameter `pending`.
6. A source document may support a parameter only after the exact table/page/section has been recorded.
7. `parameters-verified` is a derived state: it is valid only when all required keys are independently verified.

## Current implementation gate

The repository currently contains executable current norm sets for the supported current years. Historical periods remain fail-closed until the registry contains complete verified parameter records. The execution adapter must never substitute the current norm set for a historical date.

## 2026 special handling

The official 2026 archive lists a January report, a January appendix, a July appendix, a needs table and a draagkracht table. The January 2026 report also states that the Expertgroep is revising the appendices and that some underlying data are sourced from government/agency publications. The implementation therefore treats the effective period and source provenance separately rather than treating all 2026 material as one immutable document.

## Release checklist

- [ ] source document identified
- [ ] effective date verified
- [ ] exact table/page/section recorded
- [ ] all seven required parameter categories verified
- [ ] regression cases at period boundaries
- [ ] historical calculation output compared with approved reference cases
- [ ] CI green on current `main` base
- [ ] no production deployment/restart as part of data verification
