# Changelog v1.3.1

## Deployment automation
- Volledig geautomatiseerde Debian 13 installer.
- Docker CE + Compose plugin via officiële repository.
- Idempotente `/opt/alimenta` installatie.
- Automatische secret generatie.
- PostgreSQL private-only deployment.
- Prisma `migrate deploy` vóór productie-start.
- Nginx reverse proxy en automatische Let's Encrypt poging.
- UFW + fail2ban basis-hardening.
- `alimenta` beheer-CLI.
- Doctor health/security/dependency checks.
- Database backup, SHA-256 checksum en 30-daagse retention.
- Update met backup, previous-image fallback en healthcheck.
- Expliciete restore-beveiliging.
- Demo/prod-configuratie gescheiden van broncredentials.
- Health endpoint bumped to v1.3.1.


## Security completion
- TOTP MFA setup/verify/disable toegevoegd.
- MFA secret encrypted at rest (AES-256-GCM).
- MFA verplicht bij login wanneer ingeschakeld.
- Login/register rate limiting verplaatst naar gedeelde PostgreSQL bucket.
- Passkey model toegevoegd als basis voor WebAuthn.
- Dagelijkse retention job toegevoegd aan Debian deployment.
- RBAC helper en ADMIN-compatibiliteit gehard.
- Security unit tests voor TOTP en secret encryption toegevoegd.
