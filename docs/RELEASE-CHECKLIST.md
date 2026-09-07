# Production release checklist

Use this checklist for every production release. Do not mark a release complete from CI alone.

## Build & integrity

- [ ] CI is green for the exact release commit.
- [ ] Engine version recorded.
- [ ] Norm version recorded.
- [ ] Reference/regression suite green.
- [ ] Prisma migration reviewed.
- [ ] Backup completed before migration.
- [ ] Docker image built from the exact release commit.

## Security & privacy

- [ ] No secrets committed.
- [ ] Production secrets rotated where required.
- [ ] MFA/passkey enabled for privileged accounts.
- [ ] Tenant/resource authorization smoke-tested.
- [ ] Logs checked for dossier data, credentials and tokens.
- [ ] Privacy/retention documentation matches the deployed behavior.

## Deployment

- [ ] Health endpoint returns 200.
- [ ] Database migrations completed successfully.
- [ ] Application starts without migration/runtime errors.
- [ ] Login and authenticated dossier workflow tested.
- [ ] Document upload/review tested with fictional data.
- [ ] Calculation + snapshot + approval binding tested.
- [ ] Professional report provenance checked.

## Recovery

- [ ] Previous application release/image is available.
- [ ] Backup location verified.
- [ ] Restore procedure has a recent successful drill.
- [ ] Rollback owner identified.
- [ ] Incident communication channel/owner identified.

## Sign-off

Record with the release:

- version:
- commit:
- engine:
- norm:
- migration range:
- deployment timestamp:
- operator:
- rollback target:
- backup identifier:
- reference-suite result:
- known issues:
