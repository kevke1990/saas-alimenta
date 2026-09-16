# Alimenta calculation engine audit

## Current architecture

The repository already has a central calculation path in `lib/calculator.ts`, with shared capacity logic in `lib/support-engine.ts`, income normalization in `lib/income-engine.ts`, and norm data in `lib/norms.ts`. The Prisma schema already contains `Calculation`, `ProfessionalOverride`, `NormVersion`, case review status and JSON result/input snapshots.

The UI/PDF/API must remain consumers of the calculation result; they must not independently calculate alimentatie values.

## Critical finding: zorgkorting

The requested rule `careDiscount = percentage × payingParentOwnShare` is **not** the 2026 Expertgroep formulation.

The official 2026 report states that care costs are calculated as a percentage of the **eigen aandeel van de ouders in de kosten van de kinderen** (the table-based child-cost amount), excluding extra costs. After the draagkrachtvergelijking, that care discount is deducted from the relevant parent's calculated share. The 2026 report is explicit on this point.

Therefore the semantic flow is:

1. determine total child need/eigen aandeel from the applicable norm table;
2. determine each parent's capacity;
3. if combined capacity is sufficient, allocate the need pro rata;
4. calculate care discount as the applicable percentage of the relevant child need/eigen-share, excluding extra costs;
5. deduct that discount from the payer's allocated share;
6. if combined capacity is insufficient, apply the separate verzilverbaarheid rule.

A regression test was added to protect this distinction.

## 2026 capacity

For NBI above the applicable 2026 table threshold, the child-support formula is:

`70% × [NBI − (0.30 × NBI + €1,365)]`

The lower-income ranges use the official fixed table amounts. Actual housing above the 30% budget must not be silently deducted merely because it was entered.

## Norm versioning

`lib/norms.ts` now exposes a `NORM_SETS` registry for 2024, 2025 and 2026 containing source metadata, need tables, capacity thresholds and care-discount rules. Existing 2026 exports remain backward compatible.

Important: registering historical NormSets is not the same as wiring the production calculator to select a historical NormSet. That integration remains a required follow-up before claiming full historical-engine support.

## Known remaining audit items

- `calculator.ts` currently has a 2026-specific public input/result contract and still imports the backward-compatible 2026 constants. It therefore does not yet select a historical NormSet dynamically.
- `calculate()` currently uses `historicalNBGI` as a scalar override but does not model a complete historical period object containing norm year, historical KGB and calculation date.
- calculation rounding is mostly whole-euro rounding in the engine; a centralized documented intermediate/final rounding policy is still required.
- immutable snapshots exist in the Prisma model conceptually, but the full normalized-input/intermediate-result snapshot contract must be enforced at persistence time.
- partneralimentatie and combined child/partner capacity need a full end-to-end audit against the 2024/2025/2026 reports.
- actual-housing professional overrides need a complete typed override path and report/audit presentation.

These are intentionally not guessed or silently implemented as legal rules. They should be completed against the corresponding official report section and regression cases.
