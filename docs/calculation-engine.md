# Alimenta calculation engine audit

## Current architecture

The repository has one central production calculation path in `lib/calculator.ts`, shared capacity logic in `lib/support-engine.ts`, income normalization in `lib/income-engine.ts`, partner support logic in `lib/partner-engine.ts` / `lib/partner-calculator.ts`, and versioned norm data in `lib/norms.ts`. The Prisma schema already contains `Calculation`, `ProfessionalOverride`, `NormVersion`, case review status and JSON result/input snapshots.

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

## Integrated child + partner calculation

The production case PATCH/recalculation route now distinguishes two different child-support amounts:

- `childSupportByParent`: the actual transfer/payment amount after the child-support calculation, including the effect of care discount;
- `childCostShareByParent`: the parent's allocated share in the children's costs before treating the transfer as the payment amount.

For partneralimentatie, the second value is the relevant priority amount. The 2026 Expertgroep states that child support has priority and that, after the child-support draagkrachtvergelijking, the parent's share in the costs of the children is deducted from the partner-support capacity. The case route therefore no longer feeds the final transfer/payment amount into the partner calculation.

The resolver in `lib/combined-case-support.ts` makes this distinction explicit and records whether the value came from the child calculation or from an explicit professional override. The integrated case result persists both the cost share and the payment amounts, so reports can explain the difference instead of conflating them.

## Capacity and NormSets

The production child-support path resolves `normYear` (default 2026) through `getNormSet()` and passes the selected NormSet into the shared capacity engine. Child need tables, WSF periods, care-discount calculations and parent capacity therefore use the selected historical year rather than silently falling back to 2026.

For NBI above the applicable 2026 child-support formula threshold, the formula is:

`70% × [NBI − (0.30 × NBI + €1,365)]`

The lower-income ranges use the official fixed table amounts. Actual housing above the 30% budget must not be silently deducted merely because it was entered.

The shared partner-capacity engine uses the partner route separately from the child-support table and applies the 60% partner-support percentage over the draagkrachtruimte. KGB is not added to partner-support NBI. The current rich `partner-engine.ts` production route remains a 2026-norm implementation and must be versioned explicitly before historical partner calculations are exposed as production functionality.

## Norm versioning

`lib/norms.ts` exposes a `NORM_SETS` registry for 2024, 2025 and 2026 containing source metadata, need tables, capacity thresholds and care-discount rules. Existing 2026 exports remain backward compatible for older callers.

The production child engine selects these NormSets dynamically. The standalone `partner-calculator.ts` also supports historical NormSets; the richer `partner-engine.ts` still has a fixed 2026 norm version and is therefore an explicit remaining integration item.

Regression coverage includes historical minor-child calculations, historical parent capacity, historical WSF calculations, integrated child-cost-share priority, professional override provenance and separation of historical NormSet selection from statutory indexation.

## Snapshot and auditability

Combined support calculations expose an immutable fingerprint containing the calculation contract, norm version, input hash and result hash. The case persistence path stores the integrated result in the same recalculation transaction as the case update and audit log.

The persisted combined result intentionally keeps both the child-cost share used for partner priority and the actual child-support payment. This is required for reproducibility and professional explanation of a combined calculation.

## Historical inputs, compatibility and rounding

Historical calculations now use an explicit `historicalPeriod` object containing the historical NBGI, an explicit KGB-inclusion flag, optional calculation/effective dates and provenance metadata. The legacy `historicalNBGI` scalar remains supported for backward compatibility.

The compatibility helpers `childNeed()` and `capacity()` accept an explicit `normYear` and resolve the corresponding `NormSet`; their default remains 2026 for legacy callers.

Monetary rounding is centralized in `lib/calculation-engine-v2.ts`: `roundMoney()` is the intermediate cents policy and `roundWholeEuro()` is the final whole-euro policy. Fingerprints are calculated from the canonical unrounded JSON snapshots, so rounding policy changes remain auditable.

## Known remaining audit items
- immutable snapshots exist in the Prisma model conceptually, but the full normalized-input/intermediate-result snapshot contract must be enforced at persistence time.
- `partner-engine.ts` now resolves an explicit 2024/2025/2026 NormSet for its capacity calculation; historical PAL support still requires a full audit of fiscal/brutering inputs and historical fiscal tables before it should be treated as production-ready.
- the partneralimentatie engine still needs a full end-to-end audit against chapter 3.3 and chapter 4.4 of the 2026 report, including recipient resources, earning capacity, the Hofnorm route, income comparison, brutering and duration. The standalone `partner-calculator.ts` now treats substantiated earning capacity as additional resources on top of current NBI, matching the 2026 worked example.
- actual-housing professional overrides need a complete typed override path and report/audit presentation.
- the standalone `/partneralimentatie` API now resolves the persisted child-cost share from the latest child calculation when a payer index is supplied; explicit `currentChildSupport` remains a traceable manual override.

These items should be completed against the corresponding official report section and regression cases rather than guessed or silently implemented as legal rules.
