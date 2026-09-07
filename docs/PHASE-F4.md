# Phase F4 — Integratieplatform

Status: implemented

## API v1

Base path: `/api/v1`

Authentication uses a scoped Bearer token created through `/api/integrations/api-keys`.

Available endpoints:

- `GET /api/v1/cases` — list dossiers (`cases:read`)
- `GET /api/v1/cases/:id` — dossier detail (`cases:read`)
- `GET /api/v1/export/cases/:id` — versioned JSON export (`cases:read`)
- `POST /api/v1/import/cases` — import contract v1.0 (`cases:write`)

The API is resource-scoped to the authenticated user. API usage is rate-limited and counted against the user's plan entitlement.

## API credentials

Tokens are generated with a cryptographically secure random value. Only the SHA-256 token hash is persisted. Tokens are scoped and revocable. The full token is returned once at creation.

Supported scopes:

- `cases:read`
- `cases:write`
- `clients:read`
- `clients:write`
- `webhooks:manage`

## Webhooks

Webhook subscriptions are managed through `/api/integrations/webhooks`.

Events:

- `case.created`
- `case.updated`
- `case.calculated`
- `case.approved`

Delivery uses HTTPS POST and includes `x-alimenta-event` and `x-alimenta-signature` headers. The signature is a SHA-256 digest over `secret + '.' + payload`.

The dispatcher is deliberately best-effort: an external integration can never change a calculation, review state, norm version, or approval state from an outbound webhook.

## Import/export contract

Exports contain `schemaVersion: "1.0"`, source metadata, client/case data, calculations, income facts, tasks and professional overrides. Binary document storage is not exported through this API.

Imports create a new tenant-scoped client/case and always start in `DRAFT` / `INCOMPLETE`. Imported data cannot directly create an approved or final calculation state.

## Security boundaries

- Session authentication remains separate from API-token authentication.
- Every API request is tenant/resource scoped by `userId`.
- No API endpoint bypasses professional review/approval rules.
- API credentials and webhook lifecycle changes are written to the audit log.
- API request usage is recorded for entitlement enforcement.

## Next

F5 can add explainable intelligence and AI signals on top of the existing workflow without allowing AI to silently alter legal inputs or professional decisions.
