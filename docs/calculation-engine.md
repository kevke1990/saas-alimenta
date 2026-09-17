# Alimenta calculation engine audit

## Current architecture

The repository has one central production calculation path in `lib/calculator.ts`, shared capacity logic in `lib/support-engine.ts`, income normalization in `lib/income-engine.ts`, partner support logic in `lib/partner-calculator.ts`, and versioned norm data in `lib/norms.ts`. The Prisma schema already contains `Calculation`, `ProfessionalOverride`, `NormVersion`, case review status and JSON result/input snapshots.

The UI/PDF/API must remain consumers of the calculation result; they must not independently calculate alimentatie values.

## Critical finding: zorgkorting

The requested rule `careDiscount = percentage × payingParentOwnShare` is **not** the 2026 Expertgroep formulation.

The official 2026 report states that care costs are calculated as a percentage of the **eigen aandeel van de ouders in de kosten van de kinderen** (the table-based child-cost amount), excluding extra costs. After the draagkrachtvergelijking, that care discount is deducted from the relevant parent's calculated share.

Therefore the semantic flow is:

1. determine total child need/eigen aandeel from the applicable norm table;
2. determine each parent's capacity;
3. if combined capacity is sufficient, allocate the need pro rata;
4. calculate care discount as the applicable percentage of the relevant child need/eigen-share, excluding extra costs;
5. deduct that discount from the payer's allocated share;
6. if combined capacity is insufficient, apply the separate verzilverbaarheid rule.

Regression tests protect this distinction and the insufficient-capacity handling.

## Capacity and NormSets

The production child-support path now resolves `normYear` (default 2026) through `getNormSet()` and passes the selected NormSet into the shared capacity engine. Child need tables, WSF periods, care-discount calculations and parent capacity therefore use the selected historical year rather than silently falling back to 2026.

For NBI above the applicable 2026 table threshold, the child-support formula is:

`70% × [NBI − (0.30 × NBI + €1,365)]`

The lower-income ranges use the official fixed table amounts. Actual housing above the 30% budget must not be silently deducted merely because it was entered.

Partner support was also moved to NormSet selection in engine version 2.1.0. Historical partner calculations expose both `normYear` and `normVersion`, while statutory indexation remains a separate input/output concern.

## Norm versioning

`lib/norms.ts` exposes a `NORM_SETS` registry for 2024, 2025 and 2026 containing source metadata, need tables, capacity thresholds and care-discount rules. Existing 2026 exports remain backward compatible for older callers.

The production child and partner engines now select these NormSets dynamically. Regression coverage includes historical minor-child calculations, historical parent capacity, historical WSF calculations and separation of historical NormSet selection from statutory indexation.

## Known remaining audit items

- `calculator.ts` still exposes compatibility helper functions (`childNeed()` and `capacity()`) that intentionally default to 2026; the main `calculate()` path is NormSet-aware. These helpers should be migrated or explicitly deprecated once all callers are identified.
- `historicalNBGI` remains a scalar override. A complete historical period object should eventually capture the relevant historical NBGI, KGB treatment, calculation/ingangsdatum and provenance together.
- calculation rounding is mostly whole-euro rounding in the engine; a centralized documented intermediate/final rounding policy is still required.
- immutable snapshots exist in the Prisma model conceptually, but the full normalized-input/intermediate-result snapshot contract must be enforced at persistence time.
- partneralimentatie and combined child/partner capacity still need a full end-to-end audit against the 2024/2025/2026 reports, including the exact treatment of recipient resources, earning capacity, and the Hofnorm route.
- actual-housing professional overrides need a complete typed override path and report/audit presentation.

These items should be completed against the corresponding official report section and regression cases rather than guessed or silently implemented as legal rules.
