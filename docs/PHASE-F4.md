# Phase F4 — Integratieplatform

Status: in uitvoering

## API v1

Base path: `/api/v1`

Authentication uses a scoped Bearer token created through `/api/integrations/api-keys`.

Available endpoints:

- `GET /api/v1/cases` — list dossiers (`cases:read`)
- `GET /api/v1/cases/:id` — dossier detail (`cases:read`)
- `GET /api/v1/export/cases/:id` — versioned JSON export (`cases:read`)
- `POST /api/v1/import/cases` — import contract v1.0 (`cases:write`)

The API is resource-scoped to the authenticated user. API usage is rate-limited and counted against the user's plan entitlement.

The machine-readable contract is maintained at `docs/openapi-v1.yaml`.

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

Delivery policy primitives are implemented in `lib/webhook-delivery.ts` and covered by `lib/webhook-delivery.test.ts`:

- SHA-256 payload signing using `secret + '.' + payload`.
- Retryable statuses: `408`, `425`, `429` and `5xx`.
- Exponential backoff starting at one second, capped at one hour.
- Maximum of five attempts before permanent failure.
- Explicit states: `PENDING`, `RETRYING`, `DELIVERED` and `FAILED`.

### Persisted delivery history

Migration `20260912100000_webhook_delivery_history` adds the `WebhookDelivery` table. It stores the tenant owner, subscription/event identifiers, payload, signature, status, attempt counters, last response/error, retry timing and delivery timestamps.

The unique constraint on `(subscriptionId, eventId)` is the database-level idempotency boundary. The migration is intentionally separated from the live dispatcher; the next implementation step is the repository/worker layer that claims due records safely and applies the retry policy.

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

## Next implementation blocks

1. Webhook delivery repository and safe queue/worker execution.
2. Credential rotation/revocation lifecycle tests.
3. Import/export schema validation and explicit error codes.
4. API contract tests against the OpenAPI document.
5. Operational monitoring and integration smoke tests.
