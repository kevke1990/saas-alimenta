# Merelo production release gate

## Target

Target first public production release: **1 January 2027**.

This is a target date, not permission to waive unresolved blockers. If a blocker remains unresolved near the target, record it rather than hiding it.

## Gate 1 — Product scope

- [ ] Public product identity and copy are consistently Merelo.
- [ ] Core dossier workflow works end-to-end.
- [ ] Child-support calculation workflow works end-to-end.
- [ ] Partner-support workflow is clearly scoped and professionally reviewable.
- [ ] Results explain inputs, intermediate steps, assumptions, warnings and final obligations.
- [x] Reports/PDF use the latest approved calculation snapshot.
- [ ] Demo mode is clearly separated from production behavior.

## Gate 2 — Calculation integrity

- [ ] Current executable norm set is source-backed and versioned.
- [x] Historical periods execute only when their complete parameters are verified.
- [x] Unsupported/incomplete periods fail closed with `REVIEW_REQUIRED`.
- [x] No silent current-norm fallback for historical requests.
- [ ] Calculation engine/version and norm/version are persisted with snapshots.
- [ ] Regression/reference cases cover supported rules and known edge cases.
- [ ] Indexation, capacity, NBI/NBGI/KGB, care discount, mixed-child and young-adult behavior are covered where applicable.
- [ ] Professional overrides are explicit, auditable and reproducible.
- [ ] Stale approval bindings cannot produce a final result.

## Gate 3 — Security and privacy

- [ ] Authentication and session behavior verified.
- [ ] Authorization/RBAC paths verified for every protected resource class.
- [x] Tenant isolation tested at resource level.
- [ ] Secrets absent from Git and logs.
- [ ] Document storage and AI extraction boundaries verified.
- [ ] Audit trail covers security-sensitive and professional review actions.
- [ ] Retention/privacy/export flows verified where in scope.
- [ ] Dependency audit has no unresolved high-severity release blocker.

## Gate 4 — Data and database

- [ ] Prisma schema validates.
- [ ] All production migrations apply cleanly to a fresh database.
- [ ] Upgrade path from the release candidate database is tested.
- [ ] No normal production procedure depends on `prisma db push`.
- [ ] Backup creation succeeds.
- [ ] Backup verification succeeds.
- [ ] Restore procedure has been tested and documented.

## Gate 5 — Application and CI

- [ ] Repository hygiene passes.
- [ ] Dependency installation passes.
- [ ] Security audit passes.
- [ ] Prisma validate/migrate/generate passes.
- [ ] Full test suite passes.
- [ ] Production build passes.
- [ ] `/api/health` smoke test passes.
- [ ] `/api/ready` readiness check passes.
- [ ] Production Compose validation passes.
- [ ] Production Docker image builds and runs with expected non-root user.
- [ ] Deployment scripts pass syntax/validation checks.
- [ ] Final release candidate has a complete green CI run on its exact commit.

## Gate 6 — Deployment and operations

- [ ] Clean Debian 13 installation path verified.
- [ ] Environment validation rejects incomplete production configuration.
- [ ] TLS/reverse proxy configuration verified for chosen production host.
- [ ] Health/readiness monitoring exists.
- [ ] Logs are usable without leaking sensitive data.
- [ ] Backup/restore operational procedure is documented.
- [ ] Update/rollback procedure is documented.
- [ ] At least one staging smoke test has been completed on the release candidate.

## Gate 7 — Release readiness

- [ ] No open BLOCKER/HIGH release findings.
- [ ] All release PRs are merged or explicitly deferred with owner and rationale.
- [ ] Version metadata is consistent.
- [ ] Release notes are prepared.
- [ ] Known limitations are documented for professionals.
- [ ] Privacy/legal/product wording has been reviewed for accuracy.
- [ ] Production environment is provisioned and secrets are configured outside Git.
- [ ] Final release tag/commit is recorded.

## AI-agent rule

Jules and Codex can implement and validate work, but neither agent can waive this gate. The release candidate is accepted only from concrete repository, CI, staging and operational evidence.
