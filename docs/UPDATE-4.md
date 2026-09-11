# Update 4 — Professional SaaS

Update 4 turns the Release Candidate into a production-oriented professional SaaS. Work is split into five parallel tracks.

## Track A — Calculation engine
- Centralize norm/reference metadata and effective dates.
- Expand 2026 child-support and partner-support regression coverage.
- Make rounding, indexation, capacity and allocation rules explicit.
- Preserve deterministic snapshots and professional overrides.

## Track B — AI/document workflow
- Classify documents before extraction.
- Extract proposed facts with confidence and source/page provenance.
- Require professional approval before facts become calculation input.
- Keep AI runs and failures auditable.

## Track C — Client portal + security
- Secure, scoped client access to a single case.
- No cross-case access through portal links.
- Expiring/revocable sharing and audit events.
- Harden resource-level authorization and authentication.

## Track D — Billing/subscriptions
- Stripe subscription state remains server authoritative.
- Add billing entitlements and invoice-ready financial primitives.
- Enforce plan/dossier limits server-side.
- Support VAT-aware invoice calculations and payment failure states.

## Track E — Professional dashboard/reporting
- Turn the dashboard into a work queue.
- Surface reviews, AI facts, documents and tasks by urgency.
- Improve professional report metadata, provenance and branding.
- Keep report output bound to an immutable calculation snapshot.

## Delivery rule

Tracks are developed in parallel, but every batch must pass the existing CI gate before it is considered complete. No feature is treated as production-ready merely because its UI exists; server-side authorization, auditability and regression tests are required.
