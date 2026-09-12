# F4 — Webhook worker boundary

## Implemented

`lib/webhook-delivery-worker.ts` orchestrates one delivery attempt using injected dependencies:

- claims a due delivery through the repository;
- never calls the transport when a delivery cannot be claimed;
- converts transport exceptions into a retryable `503` result;
- applies the central retry/state policy;
- persists `DELIVERED`, `RETRYING`, or `FAILED` outcomes;
- returns a structured result for a scheduler, queue, or HTTP worker to consume.

## Deliberate boundaries

The worker does not create its own timer, background loop, network client, or credentials. The caller supplies the transport and controls scheduling. This keeps the delivery logic deterministic and prevents accidental autonomous outbound traffic.

## Still required

- Prisma-backed implementation of `WebhookDeliveryStore`;
- authenticated worker endpoint or queue consumer;
- transaction-safe database claim/lease semantics;
- operational delivery-history view;
- integration tests against PostgreSQL.
