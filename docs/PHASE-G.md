# Fase G — Production SaaS

## G1 — Multi-tenant foundation

- [x] Organization/practice entity
- [x] Organization membership
- [x] Owner / Admin / Professional / Read-only roles
- [x] Automatic tenant provisioning for new registrations
- [x] Legacy-user lazy tenant provisioning
- [x] Organization settings API
- [x] Member listing and role management API
- [x] Invitation creation and acceptance API
- [x] Invitation tokens stored as SHA-256 hashes
- [x] Tenant membership isolated from user-owned resources

**Security boundary:** in G1 blijven bestaande dossiers, cliënten en berekeningen eigenaar-gebonden (`userId`). Een organisatielid krijgt daardoor niet automatisch toegang tot data van een collega. G3 breidt dit gecontroleerd uit naar expliciete gedeelde tenant-resources en permissions.

## G2 — Billing & entitlements

- [x] Stripe Checkout
- [x] Stripe Customer Portal
- [x] subscription webhook synchronization
- [x] idempotent Stripe event processing
- [x] plan synchronization to application entitlements
- [x] central client-dossier entitlement helper
- [x] server-side active-client limit enforcement
- [x] upgrade route to billing
- [x] plan usage visibility on billing page

### Planmodel

De applicatie gebruikt de bestaande plan-enum (`FREE`, `PRO`, `PRACTICE`, `ENTERPRISE`). De commerciële prijsstaffels blijven in `lib/pricing.ts`; Stripe Price IDs worden via `StripePlan` gekoppeld.

## Definition of Done G1 + G2

Een gebruiker krijgt bij registratie een eigen praktijkorganisatie. Organisatieleden kunnen veilig worden uitgenodigd en krijgen een expliciete rol. Bestaande resource-isolatie blijft intact. Abonnementen kunnen via Stripe worden afgesloten/beheerd en server-side entitlements blokkeren het aanmaken van nieuwe actieve cliëntdossiers zodra de planlimiet is bereikt.
