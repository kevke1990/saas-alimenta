# Alimenta Pro v1.3.1

v1.3.1 is de deployment-automation release bovenop v1.3.0.

### Demo deployment
```bash
cd /pad/naar/Alimenta-Pro-v1.3.1
sudo bash deploy/installer.sh
```

Daarna:
```bash
sudo alimenta doctor
sudo alimenta status
```

### Verificatie
De release is statisch gecontroleerd op shell-syntax, package-version, Compose-configuratie en aanwezigheid van deployment-assets. Een volledige `npm test`/`next build` kan alleen in een omgeving met geïnstalleerde dependencies en netwerktoegang worden uitgevoerd.

## Security/operations
- PostgreSQL is never published to the host network.
- Next.js is bound to localhost only and exposed through Nginx.
- Secrets are generated locally and `.env` is mode 600.
- Backups are checksum-protected and automatically pruned after 30 days.
- Update performs a database backup before migration/build.


## Security completion
Deze build maakt de belangrijkste eerder voorbereidende security-onderdelen operationeel. TOTP MFA is end-to-end bruikbaar en wordt bij login afgedwongen; rate limiting is database-backed; retention draait dagelijks via cron; RBAC helpers zijn beschikbaar. Passkeys hebben het persistente credential-model, maar een volledige WebAuthn ceremony vereist nog browser-side enrollment/attestation en blijft daarom expliciet niet als volledig live gemarkeerd.
