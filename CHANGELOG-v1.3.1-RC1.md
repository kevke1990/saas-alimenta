# v1.3.1-rc1

## Demo Release Candidate
- Demo mode + zichtbare demo-banner.
- Debian 13 automatische deployment als primaire demo-installatieroute.
- Idempotente secret-generatie: bestaande secrets worden bij herinstallatie behouden.
- Verbeterde update/rollback met aparte previous image tag.
- Preflight script voor VPS/Compose/Prisma controles.
- Demo deploymentdocumentatie.
- Bestaande v1.3.1 security completion blijft inbegrepen: TOTP MFA, database-backed rate limiting, retention cron en RBAC helpers.
