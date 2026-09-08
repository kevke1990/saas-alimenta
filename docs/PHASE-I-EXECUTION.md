# Phase I — Launch Execution

Phase I is executed in three release batches. Each batch is intentionally deployable and must pass CI before the next batch is started.

## Batch 1 — Security & regression gate
- security helper regression tests
- rate-limit exhaustion regression test
- retention-policy regression tests
- repository hygiene, dependency audit, Prisma validation, tests and production build remain mandatory

## Batch 2 — Privacy & data lifecycle
- subject export and erasure hardened
- account-level portability endpoint
- destructive actions require explicit confirmation
- privacy actions are audited without exposing raw personal data in audit metadata
- retention job remains deterministic and runnable from deployment

## Batch 3 — Production operations & launch gate
- backup integrity verification
- restore verification workflow
- production smoke/rollback runbook
- release metadata and operational documentation
- final launch checklist distinguishes code-complete items from infrastructure/manual acceptance items

## Definition of done
Code is not considered launch-ready merely because it builds. The final gate requires green CI, a successful staging migration/restore drill, real TLS/DNS, real mail delivery, live Stripe webhook verification, and a production smoke test. Those external checks cannot be truthfully marked complete from GitHub alone.
