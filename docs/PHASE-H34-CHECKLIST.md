# H3/H4 Release Checklist

## H3 — UX
- [ ] mobile/responsive smoke test
- [ ] keyboard/accessibility smoke test
- [ ] empty/loading/error states reviewed
- [ ] onboarding and billing paths reviewed
- [ ] calculation/review semantics unchanged

## H4 — Reliability
- [x] bounded metrics utility
- [x] admin-only metrics endpoint
- [ ] production metrics exporter
- [ ] slow-query/index review
- [ ] load test with representative dossier workload
- [ ] backup + restore drill
- [ ] rollback drill
- [ ] alert thresholds and incident owner
- [ ] staging-to-production smoke test

## Gate
CI must be green after every implementation batch. No production claim is made until the outstanding operational checks are completed.
