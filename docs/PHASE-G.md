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

## G3 — Team & permissions

- [x] Team overview at `/team`
- [x] Server-side role enforcement
- [x] Role management with owner safeguards
- [x] Member removal with owner safeguards
- [x] Security-sensitive team mutations are audited
- [x] Existing user-owned dossier isolation preserved

## G4 — Enterprise security

- [x] Central security-event helper
- [x] Authenticated security-events endpoint
- [x] No secret values exposed through security reporting
- [x] Existing authentication, passkeys and security headers preserved

## G5 — Production readiness

- [x] `/api/health` liveness/dependency check
- [x] `/api/ready` production readiness gate
- [x] Database readiness check
- [x] Required production secret presence checks without secret disclosure
- [x] `/api/release` non-sensitive release metadata
- [x] Production release checklist and rollback requirements retained

## G6 — Commercial launch

- [x] Public `/pricing` page
- [x] Central pricing configuration reused by public pricing
- [x] Registration CTA
- [x] Stripe production configuration gate documented
- [x] Commercial launch gate documented
- [x] Professional/legal disclaimer retained

## Definition of Done G3 + G4

Een gebruiker krijgt veilige team- en rolfunctionaliteit zonder dat bestaande resource-isolatie, berekeningen of provenance ongemerkt veranderen.

## Definition of Done G5 + G6

De applicatie heeft een afzonderlijke readiness-gate en release metadata, naast de bestaande healthcheck. De commerciële plannen zijn publiek zichtbaar en gekoppeld aan de centrale prijsconfiguratie. Productiebetalingen en echte klantdata blijven geblokkeerd totdat CI, deployment, security, privacy, billing, backup/restore en end-to-end functionele release-evidence aantoonbaar groen zijn.
