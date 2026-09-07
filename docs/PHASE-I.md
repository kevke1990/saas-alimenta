# Phase I — Production Readiness & Launch

Doel: Alimenta Pro van technisch volwassen naar gecontroleerd live kunnen brengen.

## I1 — Security & authorization release audit
- [x] Admin portal achter `requireAdmin`
- [x] Muterende admin-acties same-origin + rate limited
- [x] Admin mutaties audit logged
- [x] Secrets nooit teruggeven aan browser
- [ ] Volledige API-route matrix met auth/RBAC/tenant ownership
- [ ] IDOR regression suite voor alle resource-id endpoints
- [ ] Production dependency audit + license review

## I2 — Billing & subscription operations
- [x] Handmatig plan toewijzen vanuit admin
- [x] Account lock/unlock vanuit admin
- [x] Stripe subscription beëindigen vanuit admin
- [x] Bestaande Stripe product/configuratie beschikbaar
- [ ] Live-mode end-to-end checkout test
- [ ] Webhook replay/idempotency test in staging
- [ ] Upgrade/downgrade/cancel/recovery matrix
- [ ] Failed payment support runbook

## I3 — Data, privacy & recovery
- [ ] Backup uitvoeren in staging
- [ ] Restore uitvoeren en verifiëren
- [ ] Restore RPO/RTO vastleggen
- [ ] Retention job controleren
- [ ] Privacy export/delete volledig doorlopen
- [ ] Database index/slow-query review

## I4 — Observability & incident response
- [x] Health endpoint
- [x] Readiness endpoint
- [x] Bounded in-process performance metrics
- [x] Admin metrics endpoint
- [ ] Structured application logging
- [ ] Error tracking
- [ ] Alert thresholds
- [ ] Incident owner/runbook

## I5 — Deployment & release engineering
- [x] Production Docker hardening
- [x] Production Compose validation in CI
- [x] Deployment script syntax checks in CI
- [ ] Staging deployment
- [ ] Staging smoke test including auth/billing/calculation
- [ ] Production migration rehearsal
- [ ] Rollback rehearsal
- [ ] Versioned release/tag

## I6 — Launch acceptance
- [ ] Registration → verification → login
- [ ] Trial/free → paid conversion
- [ ] Customer portal
- [ ] Calculator → calculation → scenario → review → approval → final
- [ ] Report/export
- [ ] Mail delivery
- [ ] AI assistive workflow, with deterministic calculation guardrail
- [ ] Mobile smoke test
- [ ] Accessibility keyboard smoke test
- [ ] Legal/privacy/cookie pages reviewed
- [ ] Monitoring active
- [ ] Backup verified

## I7 — Launch gate
Production is **not** considered live-ready until all I1–I6 release blockers are green. Documentation checkboxes marked `[x]` only indicate repository implementation; operational checks must be executed against staging/production before launch.
