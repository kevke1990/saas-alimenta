# Phase H3 + H4 — Professional UX, Scale & Reliability

## H3 — Professional UX

Target outcomes:
- responsive professional workspace
- onboarding and operational guidance
- clear dashboard, dossier, review and billing states
- accessible error and success feedback
- no change to calculation/norm/review semantics

## H4 — Scale & reliability

Target outcomes:
- bounded performance telemetry
- protected operational metrics
- database/index performance review
- deterministic smoke/load tests before production scaling
- background work isolated from request latency where required
- backup/restore and rollback remain release gates

## Current implementation

`lib/performance.ts` provides a bounded in-process metrics buffer and p50/p95/p99 summaries. `/api/metrics` is admin-only. This is deliberately a first operational layer; production deployments should export metrics to the chosen monitoring platform rather than treating process-local metrics as durable telemetry.

## Guardrails

H3/H4 must not silently alter alimentatieberekeningen, normsets, review status, approval provenance, or tenant authorization. Performance work must preserve user-scoped and tenant-scoped resource access.
