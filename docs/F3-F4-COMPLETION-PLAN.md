# F3 / F4 completion plan

This document is the execution checklist for closing the API and webhook foundations.

## F3 — Public API hardening

- [x] Versioned response envelope (`apiVersion: v1`).
- [x] Request correlation through `x-request-id`.
- [x] Consistent authentication and scope failures.
- [x] Rate-limit response headers and `Retry-After` on throttling.
- [x] Monthly entitlement enforcement.
- [x] Shared pagination primitives and list-response helper.
- [x] Regression test for list response pagination and request correlation.
- [ ] Apply the shared list helper to every remaining list endpoint.
- [ ] Add contract tests for every documented v1 endpoint.
- [ ] Keep OpenAPI response schemas synchronized with runtime envelopes.

## F4 — Webhook delivery

- [x] Delivery state machine and retry policy.
- [x] Deterministic payload envelope and payload hash.
- [x] Delivery signature generation.
- [x] Idempotency key `(subscriptionId, eventId)`.
- [x] Queue, claim and attempt semantics.
- [x] Repository abstraction independent of persistence technology.
- [x] Worker attempt classification.
- [x] Bounded worker orchestration.
- [x] Migration for durable delivery history.
- [ ] Prisma-backed repository implementation.
- [ ] Transactional enqueue from domain events.
- [ ] Authenticated webhook subscription management endpoints.
- [ ] Delivery replay/cancel operations.
- [ ] End-to-end tests against a disposable database.

## Release gate

F3 and F4 are complete only when the remaining unchecked items are implemented and the
full CI pipeline is green on the resulting commit. A skipped staging smoke test is not
counted as a successful staging verification.
