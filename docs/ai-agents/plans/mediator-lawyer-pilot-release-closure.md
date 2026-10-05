# Mediator and lawyer pilot release-closure batch

## Goal

Prepare Merelo for a controlled, time-bounded pilot with a small number of mediators and lawyers, then decide from recorded evidence whether a broader production release is ready. A pilot is not a public v1 release. It must not use real client data until the privacy, security, hosting and professional review gates below have evidence and named approval.

## Current state

- Current `main` is `09c8c3adec9bb06e6d18de36fe05bd8aaa7eee6b`; its GitHub Actions CI run #1187 succeeded.
- No published GitHub Release or tag exists.
- PRs #52, #53 and #26 were closed as superseded after comparison with current `main`; their rationales are recorded in GitHub. #26’s only remaining useful detail is isolated in PR #65. Open PRs are #61 and #62 for incomplete historical data, #63 for this coordination plan, #64 for the README correction, and #65 for the loading-shell fix. #62 and #63 are drafts.
- Historical periods without complete verified parameters are designed to return `REVIEW_REQUIRED`; preserve this fail-closed behavior.
- On `main`, the README still calls the product “Alimenta Pro” and “v1.0 — Eerste stabiele release”, while repository governance calls it Merelo and describes a demo/development basis. PR #64 corrects this contradiction; its exact-head CI run #1270 passed. The correction is not on `main` until that PR is merged.
- Release-gate evidence is not yet recorded for tenant/resource isolation, staging, restore drills, TLS/monitoring, legal/privacy review or pilot operations.
- Production and Homey were not accessed or changed for this plan.
- Preliminary source inventory at current `main`: all 83 API route handlers were scanned. Public auth, health/readiness/release and signed-webhook handlers are intentional; the remaining handlers contain recognizable authentication mechanisms, and all four `/api/v1` handlers use API-token authentication plus user-scoped lookups.
- This inventory is not an end-to-end authorization proof. `tests/api-authorization.test.ts` checks explicit authentication markers, verifies token-auth markers on all `/api/v1` handlers, and checks for a static ownership/RBAC predicate marker on dynamic resource routes. `lib/authorization-hardening.test.ts` exercises tenant helper behavior in isolation. These checks do not execute every route against foreign-user/foreign-practice resources or establish role behavior end-to-end. The README itself still lists resource-level multi-tenant authorization as unfinished. No complete route-by-route, role-by-role practice-isolation evidence is recorded.

### Open historical PR reconciliation (GitHub compare against current main)

- PR #26 was 6 commits ahead and 90 behind its merge base. Its current `app/clients/page.tsx` exactly matches `main`; all 137 CSS selectors in its branch are already in `main`. The unique AppShell wrapper from its loading skeleton is isolated in PR #65. PR #26 was closed as superseded, with rationale recorded in its description.
- PR #52 was 5 commits ahead and 67 behind its merge base; it reintroduced older `lib/historical-alimentatie-norms.ts` and test files and was marked not mergeable. It was closed on 5 October 2026 as superseded after diff comparison; the rationale is recorded in the PR.
- PR #53 was 7 commits ahead and 67 behind, changing those same two old files. Current `main` already has a newer registry, parameter-readiness gate, invalid-date checks, and tests for fail-closed behavior. It was closed on 5 October 2026 as superseded after diff comparison; the rationale is recorded in the PR.
- PR #61 is one documentation commit for an incomplete 2011 source manifest. Its own description leaves parameter families and independent calculations open.
- PR #62 is a 44-commit draft that adds 2006 source data and updates historical manifests/registries, but its own description leaves the January 2006 child-cost table and other parameter families/reference calculations incomplete. Its exact head CI was reported green earlier; that does not complete its source gaps.
- Keep the historical objective (complete verified coverage through 2006 and onward) as a separate workstream. It need not block a narrowly declared current-norm pilot, provided historical requests remain blocked and the pilot wording does not imply historical support.

### Preliminary calculation evidence review

- Current regression suites cover deterministic outputs and selected current-norm details in `lib/calculator-regression-2024-2026.test.ts`, `lib/calculation-engine-audit.test.ts` and `lib/alimentatie-engine-trema-2026.test.ts`.
- Some full-case tests explicitly call examples “illustrative” and avoid treating an example payment as a target. The Trema suite includes a published corrected-assistance-norm example, but that alone is not an independently reconstructed end-to-end reference dossier for each pilot workflow.
- The current `lib/norms.ts` records January and July 2026 source versions and the 2026 table values. A spot-check of the official July 2026 appendix confirms the stated 2026 capacity bands/formula and KGB inputs. The source set is [official Rechtspraak July 2026 appendix](https://www.rechtspraak.nl/binaries/_rts_1782891587557/content/assets/lbvr/an/lbvr-an-bijlagen-rapport-alimentatienormen-versie-juli-2026.pdf). This spot-check does not independently validate the complete engine, tax calculation, case workflow or all edge conditions.
- Batch 1 therefore remains open: construct professionally reviewed, source-located end-to-end reference dossiers for the exact pilot scope and compare all intermediate amounts, warnings and final results.

## Constraints / invariants

- No guessed legal rule, norm value, source locator, or historical financial input.
- Keep unsupported/incomplete historical periods blocked with `REVIEW_REQUIRED`; never silently use current norms.
- Preserve the existing calculation engine, provenance, versioned snapshots, review/approval binding, audit trail, authentication and authorization boundaries.
- AI-extracted content remains a proposal until a professional approves it.
- Never use real client data in development or CI. Pilot use of personal data requires documented privacy/security approval, an appropriate environment and agreements first.
- No deployment, restart, release publication, tag creation, merge, or production data change is authorized by this plan.
- Do not claim legal certification or that software output is legal advice.
- Work in focused, reviewable PRs. This plan coordinates them; it does not turn unrelated code into one mega-PR.

## Approach

Run two tracks with a strict go/no-go point:

1. **Synthetic-data pilot readiness:** make identity/scope truthful, stabilize the supported current-period workflow, finish essential security and operational controls, then verify a staging candidate end-to-end using synthetic cases.
2. **Professional-data pilot authorization:** only after the responsible product owner, security/privacy reviewer, hosting operator and pilot professionals record their approvals and operating boundaries. Begin with a small cohort and explicit incident/feedback handling. A pilot does not waive the public-release gate.

Historical norms are a separate calculation-integrity track. They are not a prerequisite for a pilot that is explicitly limited to supported current norms, but unsupported dates must remain visibly blocked. Do not present historical support as complete until each applicable period is source-backed and independently verified.

## Steps

### Batch 0 — establish one truthful pilot baseline
1. Reconcile the four open historical PRs: inspect all diffs and CI on exact heads, identify duplicate/conflicting changes, and choose a single dependency order. Do not merge merely to clear the PR list.
2. Replace contradictory README release wording with an accurate Merelo product identity, development/pilot status, current-period calculation scope, known limitations and a clear “not for production / no real client data” warning until the relevant gates are evidenced.
3. Record a versioned pilot scope: supported calculation dates/norms, excluded cases, user roles, pilot cohort size, data policy, support contact/process, feedback and incident escalation.
4. Link this plan and a release evidence register from the existing release-gate document. Keep every gate item open until evidence is linked.

### Batch 1 — calculation and workflow integrity
5. Trace the supported current-norm child-support and partner-support flows end-to-end, including input approval, warnings, intermediate amounts, output/report and persisted engine/norm versions.
6. Build/curate independent reference cases for the declared pilot scope, including key boundary cases, care distribution, multiple/mixed-age children, young adults, capacity/NBI/NBGI/KGB, overrides, recalculation and stale approvals.
7. Verify unsupported historical dates consistently show `REVIEW_REQUIRED` in API, UI, exports and reports; test that no path silently selects current norms.
8. Ensure a report can only be generated from the latest approved snapshot and labels scope, assumptions, warnings and professional-review responsibility accurately.
9. Record all unresolved norm/source gaps by period and parameter family. Keep them excluded from pilot scope unless separately completed and reviewed.

### Batch 2 — pilot security and privacy controls
10. Produce a route-by-route authorization matrix for all 83 API handlers, including read, update, delete, export, document, task, portal, report and calculation operations; test cross-user and cross-practice access denial for each protected resource class. The preliminary source inventory above is not sufficient proof.
11. Decide and implement an explicitly supported pilot tenancy model. Until route-level tenant isolation is proven, do not enable shared practice accounts or cross-user case access; any single-user pilot boundary must itself be demonstrated in staging.
12. Review session lifecycle, MFA, password/reset flows, role boundaries, audit coverage, rate limits, document storage, AI-provider transfer/retention and sensitive log output.
13. Define data minimization, lawful basis/consent where applicable, retention/deletion, export, breach response and processor/subprocessor documentation with the privacy owner and counsel. Do not have an agent infer legal sufficiency.
14. Remove pilot-blocking high-severity dependency/security findings or document an accepted, bounded mitigation with owner and expiry.

### Batch 3 — operational pilot candidate
15. Validate clean install and production configuration from documented steps; prove incomplete secrets/configuration fail closed.
16. Apply migrations to a clean database and exercise the supported upgrade path. Verify encrypted/off-host backup, backup integrity and a restore drill in a non-production environment.
17. Verify TLS/reverse proxy, health/readiness monitoring, redacted logs, alert routing, capacity limits, update/rollback instructions and incident contacts.
18. Build and run the exact candidate image as the documented non-root user; capture artifact digest and environment/configuration record.
19. Run full CI on the exact candidate commit, then a staging smoke test with synthetic cases, including auth/access boundaries, calculation/report flow, health/readiness and recovery checks.

### Batch 4 — bounded professional pilot
20. Record the user-authorized pilot audience: mediators and lawyers. Before any pilot launch, obtain written security/privacy and hosting approval, plus participant agreement. Document cohort, duration, supported scope, prohibited use, support hours, incident path and exit/deletion procedure.
21. Start with synthetic or de-identified cases unless and until privacy counsel and the data owner approve personal-data processing and all required safeguards.
22. Record pilot feedback and incidents without copying personal or case-identifying data into GitHub. Triage defects by severity; calculation/security BLOCKER or HIGH findings stop the pilot.
23. Review evidence and pilot outcomes; either extend/fix, close the pilot and delete data, or submit a public-release decision. A passing pilot does not automatically authorize a public release.

### Batch 5 — public release decision
24. Complete every item in `docs/ai-agents/RELEASE-GATE.md`; explicitly defer only with named owner, rationale and date.
25. Reconcile product name, version metadata, release notes, limitations and privacy/legal wording.
26. Independently review the final diff, migrations, security posture and evidence; require complete green CI on the exact release commit.
27. Present the verified candidate commit and evidence to the product owner for a release decision. Tagging, publishing and deploying require separate explicit authorization.

## Validation

For implementation PRs, run relevant focused tests, then repository CI-equivalent checks required by the workflow: repository hygiene, dependency install/audit, Prisma validate/migrate/generate, full tests, build, health/readiness, production Compose, Docker image/user and deployment-script checks. Do not claim validation until exact results are linked.

For pilot readiness, also require:
- independent reference-case comparison and fail-closed historical-date evidence;
- authorization-denial tests for each protected resource class;
- clean install, migration/upgrade, backup verification and restore-drill records;
- exact candidate image digest and configuration record;
- staging smoke-test report using synthetic data;
- signed/dated pilot scope and approvals, with no unresolved BLOCKER/HIGH finding.

## Rollback / recovery

- Revert a code PR through a reviewed follow-up commit; do not rewrite shared history.
- If a staging check fails, stop the candidate, retain sanitized diagnostics, restore staging from its verified backup if needed, and fix in a new PR.
- For a pilot incident, suspend access, follow the approved incident and data-retention procedure, preserve required audit evidence, and notify the named owner. Do not use a production restart or data restore as an unreviewed workaround.
- A failed gate returns the work to the relevant batch; it does not get waived by relabeling the build “final”.

## Risks / open questions

- The exact pilot deployment boundary, hosting operator, cohort size, support owner and permitted data class are not evidenced in the repository.
- Resource-level tenant isolation, full browser WebAuthn, privacy/legal review and tested backup/restore are listed as unfinished in current documentation.
- Historical source and parameter completeness varies by effective period; the 2006 and 2011 PRs explicitly list open gaps. Do not promise all history in the pilot.
- Product identity and v1.0 wording are inconsistent.
- The user has requested a mediator/lawyer pilot as soon as safely possible. Treat this as authorization to prepare the pilot, not as authorization to deploy, process production data or waive privacy/security evidence. A closed pilot is a separate decision from the existing 1 January 2027 public-release target; changing that public target requires an explicit product decision.

## Completion evidence

This plan is complete only when each step links to reviewed PRs/issues, exact passing CI runs and the required staging/operational/pilot evidence. The plan itself is not evidence that any release gate has passed.
