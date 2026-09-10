# Production operations — Update 2

Update 2 completes the repository-side production configuration and operational guardrails. External infrastructure values are deliberately supplied at deployment time.

## Required production inputs

- VPS/Debian host and SSH access
- DNS records for the application domain
- TLS certificate (Certbot is supported)
- production `.env` with unique secrets
- Stripe live keys, Price IDs and webhook signing secret
- Postmark server token, sender/domain and inbound secret
- optional Google AI key/model
- backup destination/retention policy
- external monitoring/alert destination

Never commit any of these secrets to Git.

## First deployment

```bash
sudo bash deploy/preflight-demo.sh
sudo bash deploy/installer.sh
sudo alimenta doctor
sudo alimenta status
```

For a real production host, copy `deploy/.env.production.example` to the deployment `.env`, replace every `CHANGE-ME`/placeholder value, then run `deploy/validate-production-env.sh` before starting the application.

## Scheduled operations

Install the host jobs once:

```bash
sudo bash deploy/install-scheduled-jobs.sh
```

Default jobs:

- daily PostgreSQL backup
- daily retention cleanup
- daily Certbot renewal check

The backup is gzip-compressed, checksum-protected and retained according to `BACKUP_RETENTION_DAYS`.

## Backup and restore

Create a backup:

```bash
sudo alimenta backup
```

Verify a backup:

```bash
sudo bash deploy/verify-backup.sh /opt/alimenta/backups/alimenta-postgres-*.sql.gz
```

Restore only with an explicit confirmation:

```bash
sudo CONFIRM_RESTORE=YES alimenta restore /opt/alimenta/backups/alimenta-postgres-YYYYMMDDTHHMMSSZ.sql.gz
```

The restore procedure verifies the checksum/archive, creates a fresh safety backup, restores with `ON_ERROR_STOP`, and runs the production operations check. A real restore drill must still be performed on staging and its RPO/RTO recorded.

## Staging acceptance

Infrastructure smoke:

```bash
STAGING_URL=https://staging.example.nl bash deploy/staging-smoke.sh
```

Authenticated acceptance additionally checks login, dashboard, cases API and billing when a dedicated staging account is provided:

```bash
STAGING_URL=https://staging.example.nl \
STAGING_TEST_EMAIL=smoke@example.nl \
STAGING_TEST_PASSWORD='...' \
bash deploy/staging-acceptance.sh
```

Use a dedicated fictional staging account. Never use a real client or production credential.

## Release and rollback

Before a release:

1. CI must be green on the exact release commit.
2. Run `alimenta backup`.
3. Record the image tag, commit SHA, migration state and backup filename.
4. Deploy the exact image/tag.
5. Run `alimenta doctor` and the staging/production smoke checks.

For rollback, redeploy the previously verified image/tag. **Do not automatically roll back database migrations**; use a forward migration or restore only after the recovery decision has been documented.

## Monitoring baseline

At minimum, monitor:

- `/api/health` for liveness
- `/api/ready` for database/readiness failure
- container restart count
- disk usage, especially `/opt/alimenta/backups`
- backup age and checksum verification
- TLS certificate expiry
- HTTP 5xx rate
- authentication failure spikes
- Stripe/Postmark webhook failures

The application emits JSON structured logs through `lib/observability.ts`; route-level error tracking can be connected to the chosen external provider without exposing dossier contents.

## Launch boundary

Repository configuration being complete does **not** mean production is live. Live customer data and live payments remain blocked until staging acceptance, backup/restore evidence, security/privacy review, billing tests and the release checklist have been executed by an operator.
