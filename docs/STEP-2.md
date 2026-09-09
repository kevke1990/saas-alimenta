# Step 2 — Portal shell

Step 2 integrates the premium Alimenta Pro workspace direction into the existing Next.js application without replacing authentication or the calculation engine.

## Included

- Premium dark customer workspace shell.
- Refined responsive sidebar and navigation.
- Secure-workspace header and user identity treatment.
- Premium login experience using the existing `/api/auth/login` endpoint.
- Existing dashboard data queries and routes remain the source of truth.
- Styling is isolated in `app/portal-premium.css` so report/print `.paper` styling is not unintentionally changed.

## Deliberately not changed

- Authentication/session implementation.
- Prisma data model.
- Calculation engine semantics.
- Billing, mail, AI or admin backend contracts.

Next integration batches should connect the new visual system to clients, calculations, reports, and then the admin control center.
