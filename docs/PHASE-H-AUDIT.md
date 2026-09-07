# Phase H — Pre-launch audit

Audit target: `main` at commit `58e99ca77b9292576467ae4a2afee45ab838a95a` before H1/H2 hardening.

## Scope

- authentication, sessions and MFA
- authorization and tenant isolation
- API and webhook boundaries
- rate limiting and request origin controls
- secrets and sensitive-data handling
- database schema, migrations and retention
- Docker/Nginx deployment posture
- Stripe billing lifecycle
- production health/readiness
- calculation/review/provenance integrity
- CI and dependency hygiene

## Findings

### High priority — addressed in H1/H2

1. **Distributed rate-limit race condition.** The previous bucket implementation performed a read followed by an update, allowing concurrent requests to increment from the same count. H1 changes this to an atomic PostgreSQL `INSERT ... ON CONFLICT DO UPDATE` operation.
2. **Billing POST endpoints lacked an explicit same-origin guard.** SameSite cookies already reduce browser CSRF exposure, but H1 adds `Origin`/Fetch Metadata validation to Stripe checkout and portal mutations.
3. **Stripe checkout lacked an explicit production HTTPS/APP_URL gate.** H2 now requires `APP_URL` and HTTPS in production and uses parsed same-origin URLs for checkout redirects.
4. **Stripe subscription metadata was not consistently propagated from checkout to the subscription.** H2 attaches the user and selected plan metadata to `subscription_data` as well as the Checkout Session.

### Medium priority — follow-up after H1/H2

1. Organization/team membership is present, but dossier access remains user-scoped rather than organization-shared. This is intentional current scope and must not be mistaken for shared-dossier authorization.
2. The security audit API accepts client-supplied audit events. Security-sensitive audit events should increasingly be generated server-side and the endpoint narrowed or removed.
3. Rate-limit bucket cleanup should be scheduled so expired rows do not accumulate indefinitely.
4. Production observability should add structured error tracking, metrics and alerting.
5. Backup/restore should be executed as a real operational drill, not only validated by script syntax in CI.
6. Stripe live-mode configuration, webhook signing, tax/invoice settings and Customer Portal configuration still require an actual Stripe test/live environment verification.
7. Full API authorization should remain a release gate: every resource route must verify the authenticated owner/tenant before read or mutation.

## Positive controls already present

- password hashing with bcrypt
- signed 8-hour sessions with HttpOnly/SameSite cookies
- MFA/TOTP support
- authenticated/admin route guards
- resource-level user scoping throughout the existing dossier model
- encrypted application secrets
- encrypted document storage payloads
- privacy/retention workflow
- security headers and HTTPS deployment configuration
- non-root production container with read-only filesystem and dropped capabilities
- idempotent Stripe webhook event table
- calculation history, review states and provenance binding
- deterministic regression/unit test suite
- Prisma migrations and CI build/runtime checks

## Release boundary

H1/H2 must not alter the alimentatie calculation engines, norm data, review state machine or report provenance semantics. Those systems are treated as protected production logic during security/commercial hardening.
