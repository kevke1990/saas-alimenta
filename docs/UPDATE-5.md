# Update 5 — Professional SaaS

Update 5 converts Alimenta Pro from a strong RC/demo foundation into a production-oriented professional SaaS.

## Parallel tracks

- Track A: Calculation Engine 2.0 — versioned norms, transparent intermediate results, regression coverage and historical calculation inputs.
- Track B: AI 2.0 — document classification, extraction proposals, provenance, confidence, conflict handling and mandatory professional approval.
- Track C: Client Portal 2.0 — scoped dossier sharing, least-privilege access, expiry/revocation and auditability.
- Track D: Billing 2.0 — Stripe subscription lifecycle, VAT-aware billing, invoices and entitlement enforcement.
- Track E: Professional Suite — dashboard, tasks, dossier pipeline and production reporting.

## Delivery rule

Every independent batch must remain backwards compatible where possible and must pass the complete CI pipeline before it is considered complete. No production claim is made from code presence alone.

## Definition of done

A track is complete only when its server-side authorization, data model, UI/API behavior, tests and production build are covered. Cross-track integration is validated before the release candidate is promoted.
