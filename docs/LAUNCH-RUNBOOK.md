# Alimenta Pro — production launch runbook

## 1. Environment
1. Copy `deploy/.env.production.example` to `.env.production`.
2. Generate unique values for database password, `SESSION_SECRET`, `APP_ENCRYPTION_KEY`, privacy salt and webhook secrets.
3. Set a real HTTPS `APP_URL`.
4. Configure Postmark and Stripe credentials in the beheerportaal/production environment.
5. Never commit `.env.production` or secret values.

## 2. First deployment
```bash
./deploy/preflight-demo.sh
./deploy/update.sh
./deploy/doctor.sh
./deploy/verify-demo.sh
```

## 3. Database safety
Before every risky migration or restore, make a backup:
```bash
./deploy/backup.sh
```
Verify a backup before using it:
```bash
./deploy/verify-backup.sh /opt/alimenta/backups/alimenta-postgres-YYYYMMDDTHHMMSSZ.sql.gz
```
Restore only with an explicit confirmation:
```bash
CONFIRM_RESTORE=YES ./deploy/restore.sh /opt/alimenta/backups/alimenta-postgres-YYYYMMDDTHHMMSSZ.sql.gz
```
The restore script validates the checksum/compression and runs the application verification afterwards.

## 4. Smoke test
Confirm:
- `/api/health` returns HTTP 200.
- `/api/ready` returns HTTP 200.
- `/api/release` reports the expected release and commit.
- registration/login works;
- a client and case can be created;
- a real calculation reaches the expected review state;
- an approved professional report is reproducible;
- Stripe checkout, portal and webhook processing work;
- configured mail delivery succeeds.

## 5. Rollback
1. Stop the current release only if the application is unhealthy.
2. Restore the previous image tag using `ALIMENTA_IMAGE_TAG`.
3. Do not run a destructive/down migration unless the release procedure explicitly requires it.
4. If data corruption occurred, restore the most recent verified backup using `CONFIRM_RESTORE=YES`.
5. Re-run `doctor.sh`, `verify-demo.sh` and the smoke tests.

## 6. Incident response
- Freeze deployments.
- Record UTC time, release tag and affected endpoint.
- Preserve relevant logs without copying personal data into tickets/chat.
- Rotate exposed secrets immediately.
- If personal data may have been exposed, follow the privacy/security incident procedure and legal notification requirements.

## 7. Recovery targets
Target RPO: **24 hours** with the standard daily database backup schedule.
Target RTO: **60 minutes** for a prepared VPS with a verified backup and known-good image.
These are operational targets and must be validated in a real restore drill before launch.
