# Fase E — Product launch, operations & scale

Fase E is the transition from a technically hardened release candidate to an operational SaaS product that can be launched, observed and supported safely.

## Release gates

A production release is only eligible when all gates below are green:

1. CI: tests, Prisma migrations, build, Docker and runtime smoke test.
2. Database: migration is reviewed and backup exists before deployment.
3. Security: no known blocking vulnerability, secrets outside Git, least-privilege runtime.
4. Privacy: processing register/DPIA decision, retention policy and data-subject workflow are documented.
5. Calculation integrity: reference dossiers and regression suite pass on the exact engine + norm versions being released.
6. Workflow integrity: AI facts require professional approval; approved calculations remain bound to their calculation snapshot.
7. Operations: health/readiness checks work and logs contain no sensitive dossier data.
8. Rollback: previous application image and database restore procedure have been rehearsed.
9. Support: incident severity, response owner and customer communication procedure are defined.

## Operational model

### Health

`/api/health` is the liveness/dependency check. It must return HTTP 200 only when the application can reach PostgreSQL. Monitoring should alert on repeated 503 responses rather than on a single transient failure.

### Data protection

Production databases and document storage must be backed up according to the documented retention policy. Restore tests must be performed periodically and recorded. A backup that has never been restored is not considered a verified backup.

### Incident response

- **SEV-1:** suspected data exposure, cross-tenant access, destructive data loss or complete production outage. Stop risky changes, preserve evidence, isolate the issue and communicate immediately.
- **SEV-2:** major functionality unavailable or incorrect calculations affecting active work. Mitigate, investigate and publish a recovery update.
- **SEV-3:** non-critical defect or degraded functionality. Fix through the normal release process.

Calculation correctness and tenant isolation take priority over feature delivery.

## Release discipline

Every production release must identify:

- product version;
- calculation engine version;
- norm version(s) used;
- database migration range;
- reference/regression result;
- deployment timestamp;
- operator;
- rollback target.

Never mutate an existing calculation snapshot in place. A changed engine, norm or approved input creates a new calculation snapshot and requires the existing professional approval binding to be re-established.

## Commercial launch

Before accepting real customer data:

- configure production domain/TLS;
- configure verified outbound/inbound mail where used;
- configure billing and webhook signing where enabled;
- create an operational admin account with MFA/passkey protection;
- confirm backup and restore jobs;
- configure uptime and error monitoring;
- publish privacy, retention and support documentation;
- execute a full fictional reference dossier through the production deployment;
- record the release evidence.

## Scale roadmap

After the first stable production cohort:

1. measure calculation latency, database latency and document/AI processing time;
2. add queue-based processing for expensive asynchronous work;
3. introduce database connection-pool controls and query/index monitoring;
4. add application error aggregation with privacy-safe metadata;
5. load-test the most important authenticated workflows;
6. introduce controlled feature flags for risky releases;
7. formalize SLOs and capacity thresholds.

No scale optimization may weaken tenant isolation, auditability, calculation reproducibility or privacy controls.

## Definition of done

Fase E is complete when a real customer can safely create a dossier, upload and review documents, perform a calculation, obtain a provenance-bound professional report, receive support, and have the service recovered from a simulated outage without losing or silently changing approved calculation history.
