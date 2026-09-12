# F4 — Webhook worker orchestration

## Implemented

`lib/webhook-worker-orchestrator.ts` adds an explicit batch boundary around the single-delivery worker.

The orchestration layer:

- accepts an explicit list of delivery IDs;
- removes duplicate and empty IDs;
- processes deliveries with bounded concurrency;
- caps concurrency between 1 and 20;
- delegates all delivery state transitions to the existing worker/repository;
- returns aggregate counts for delivered, retrying, failed and skipped deliveries;
- does not start timers, background loops or hidden network activity.

## Deliberate boundary

The caller still owns:

- selecting due deliveries;
- scheduling the batch;
- supplying the transport;
- authorization and tenant scoping;
- persistence-backed delivery selection.

The next implementation step is a Prisma-backed store and an authenticated operational endpoint that can supply authorized delivery IDs to this orchestrator.
