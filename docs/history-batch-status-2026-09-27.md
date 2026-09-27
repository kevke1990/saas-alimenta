# Historical batch status — 2026-09-27

This checkpoint documents the remaining historical-engine work without asserting unverified parameters.

## Required coverage

- 2006–2023: historical period coverage is registered.
- 2013: special 1 April methodology boundary is represented.
- Half-year transitions are treated as period boundaries rather than one value per calendar year.

## Verification policy

A period is release-ready only when all of these are verified:

1. required parameters;
2. historical calculation rules;
3. primary-source provenance and locator;
4. reference calculations.

Missing data remains fail-closed. Modern parameters must never silently substitute for a historical period.

## Current known blocker

The 2023 parameter set still has four categories that must be populated and independently verified before 2023 can become executable:

- fiscal parameters;
- social/ZVW parameters;
- minimum-income parameters;
- other required norm inputs.

The same verification chain must then be applied to 2022–2006.

## Next batch

Populate and verify historical parameter registries in multi-year batches, add reference calculations and boundary regressions, then run the complete 2006–2023 matrix before declaring release readiness.
