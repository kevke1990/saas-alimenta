# Fase G5 + G6 — Production readiness & commercial launch

## G5 — Production readiness

- [x] Dedicated `/api/ready` readiness endpoint.
- [x] Database connectivity is checked before reporting ready.
- [x] Required production secret presence is checked without exposing secret values.
- [x] APP_URL and ADMIN_PATH are surfaced only as configured/not-configured status.
- [x] Dedicated `/api/release` endpoint exposes non-sensitive version/release metadata.
- [x] Existing `/api/health` remains the lightweight liveness/dependency check.
- [x] Existing Docker/deployment hardening remains unchanged.
- [x] Release checklist remains mandatory; CI alone is not a production sign-off.

### Operational contract

`/api/health` answers whether the service and PostgreSQL are alive. `/api/ready` answers whether the deployment has the minimum production configuration required to accept traffic. Readiness returns HTTP 503 when a blocking check fails.

The readiness endpoint never returns secret contents. It is an operational gate, not a substitute for the complete release checklist, backup verification, restore drill, security review or calculation regression suite.

## G6 — Commercial launch

- [x] Public pricing page at `/pricing`.
- [x] Pricing page uses the central `lib/pricing.ts` configuration.
- [x] Public CTA routes to account creation.
- [x] Stripe configuration requirements are explicitly surfaced before production billing.
- [x] Commercial positioning and plan structure are documented.
- [x] Legal/product disclaimer remains visible: software support, not legal advice.

### Launch gate

Real customer data and production payments are accepted only after:

1. exact release commit has green CI;
2. `/api/health` and `/api/ready` are green in the deployed environment;
3. Stripe Price IDs and webhook signing are configured and tested;
4. privacy, retention and support documentation are published;
5. backup and restore have been verified;
6. tenant/resource authorization has been smoke-tested;
7. a fictional end-to-end dossier has passed calculation, review, approval, FINAL and report provenance checks;
8. an operational owner and rollback target are recorded.

## Boundary

G5/G6 do not alter the calculation engine, norm logic, review/provenance semantics or existing resource isolation. Commercial availability is gated by configuration and release evidence rather than by silently weakening safety controls.
