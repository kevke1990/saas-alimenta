# F4 — Webhook SQL persistence adapter

## Scope

`lib/webhook-delivery-sql-store.ts` implements the `WebhookDeliveryStore` contract against the existing PostgreSQL `WebhookDelivery` table through Prisma's parameterized `Prisma.sql` queries.

## Guarantees

- `insertIfAbsent` is idempotent on `(subscriptionId, eventId)`.
- `claimDue` performs an atomic conditional update and increments the attempt counter before transport execution.
- Only `PENDING` and due `RETRYING` records can be claimed.
- Records at `maxAttempts` cannot be claimed again.
- `updateResult` persists delivery state, status code, error, retry timestamp and delivery timestamp.
- Database rows are mapped to the worker's `StoredWebhookDelivery` contract without exposing database column names to the worker.

## Deployment order

1. Apply `20260912100000_webhook_delivery_history`.
2. Deploy the application code containing the SQL adapter.
3. Run the unit and integration test suites.
4. Enable the worker scheduler only after the database migration has completed successfully.

The adapter intentionally uses raw, parameterized SQL because the migration already exists while Prisma's generated client model may be regenerated in a later deployment step.
