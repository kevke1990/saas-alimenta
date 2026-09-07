# Phase H — Production hardening & commercial SaaS

## H1 — Production hardening

- [x] Pre-launch architecture/security audit recorded in `docs/PHASE-H-AUDIT.md`.
- [x] Distributed rate limiting made atomic at PostgreSQL level.
- [x] Billing mutation endpoints protected by same-origin / Fetch Metadata checks.
- [x] Authenticated sessions now immediately stop working for locked accounts.
- [x] Stripe admin actions rate-limited and audited.
- [x] Stripe admin credential input validates key prefixes and webhook-secret format.
- [x] Production Stripe endpoints require configured `APP_URL` and HTTPS.
- [x] Existing non-root container, read-only filesystem, dropped capabilities, security headers, encrypted secrets and retention controls retained.

## H2 — Commercial SaaS

- [x] Central annual pricing configuration retained as the single source of plan prices.
- [x] Stripe Checkout supports subscription creation per configured plan.
- [x] Stripe Customer Portal supports subscription/payment management.
- [x] Checkout propagates user/plan metadata to the subscription.
- [x] Stripe webhook verification and event idempotency retained.
- [x] Subscription lifecycle maps Stripe status to Alimenta plan/status fields.
- [x] Stripe admin can sync Products/Prices from the central pricing configuration.
- [x] Billing UI exposes plan selection, usage and customer-portal access.

## Remaining production gate

Code support is complete, but live commercial launch still requires an actual Stripe test/live configuration, webhook endpoint verification, Customer Portal configuration, tax/invoice settings, backup/restore drill, monitoring and operational sign-off.

## Protected logic

H1/H2 intentionally do not modify the child-support/partner-support calculation engines, norm data, review state machine or report provenance semantics.
