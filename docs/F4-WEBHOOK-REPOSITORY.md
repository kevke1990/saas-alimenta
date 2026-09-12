# F4 — Webhook repository boundary

Status: repository contract implemented; Prisma adapter and worker remain next.

## Implemented

- `lib/webhook-delivery.ts` contains signing, retry classification and bounded backoff.
- `lib/webhook-delivery-queue.ts` contains idempotency-key, due detection and attempt transitions.
- `lib/webhook-delivery-repository.ts` defines the persistence boundary for enqueue, claim, result update, completion and failure.
- `lib/webhook-delivery-repository.test.ts` covers claiming, due checks, completion and adapter isolation.

## Contract guarantees

1. The persistence adapter owns the transaction and concurrency semantics.
2. `claimDue` must atomically claim one due record; a worker must never rely on a non-transactional read-then-write sequence.
3. `insertIfAbsent` must enforce `(subscriptionId, eventId)` idempotency.
4. Delivery state changes are explicit and must preserve the delivery payload and signature.
5. Outbound delivery cannot mutate calculations, review state, norm versions or approvals.

## Next implementation

- Implement the adapter with Prisma transactions and row-level claim protection.
- Add the worker transport with timeout handling and retry-state mapping.
- Add delivery-history API/UI with tenant ownership checks.
- Add integration tests against PostgreSQL in CI when a database service is available.
