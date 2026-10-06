# Merelo pilot completion batch — Jules execution brief

**Status:** execution plan; not evidence that any gate has passed.  
**Baseline:** inspect the latest `main` at task start; the audit that prompted this plan saw `c95b402f6d244ac94c9d2562e2e94050ddb4532f`.  
**Product boundary:** Merelo remains a pre-release/demo until the evidence below exists. This plan does not authorize merging, deployment, restart, release/tag publication, production-data use, or contact with staging operators.

## Objective

Prepare one substantial, coherent, reviewable repository change for a narrowly scoped **synthetic-data pilot candidate**, and report every remaining human/environment gate honestly. Work from the latest `main`. Preserve calculation provenance, audit history, authentication, tenant boundaries, approval binding, and fail-closed historical behavior.

A green CI run is necessary but does not by itself make Merelo pilot-ready. Do not claim legal certification or that the software provides legal advice.

## First: repair the delivery problem

The currently open PR #67 does not contain the implementation claimed by its description. Its diff contains only a gitlink named `saas-alimenta` pointing to an unavailable subproject commit.

1. Do not build on or preserve that gitlink.
2. Work in the root of `kevke1990/saas-alimenta`, based on the latest `main`.
3. Use a clean branch and produce a real PR whose changed files are visible in GitHub. If replacing PR #67, leave the old PR open until the replacement is reviewable; report which PR the owner should close.
4. Keep the PR in draft until implementation and exact-head CI are complete. Do not merge it.

## Repository work to complete in the batch

### A. Make calculation reports approval-safe — release blocker

- Fix the PDF route so it cannot silently export an unapproved, stale, or unbound calculation as a professional report.
- Use the latest calculation snapshot and the same review/approval binding rules as the HTML report and finalization flow.
- Choose and implement an explicit safe behavior for non-approved/stale snapshots: reject export, or produce a clearly marked draft that cannot be mistaken for an approved report. Do not weaken approval rules.
- Ensure the PDF shows Merelo branding consistently, calculation date, engine/norm version, review/provenance status, relevant warnings, and an appropriate non-legal-advice statement.
- Add focused tests for approved-current, unapproved, recalculated/stale, missing-binding, and no-calculation cases. Test route behavior, not only helper behavior.

### B. Prove authorization behavior, not source markers

- Replace or supplement static source-marker checks with request-level tests using isolated synthetic users, practices, and records.
- Cover read and mutation denial across each protected resource family in scope (cases, clients, documents, income facts, reports/PDF, and relevant integrations).
- Cover tenant boundaries and role boundaries, including read-only, assistant/reviewer/professional/admin behavior where implemented.
- Verify both same-tenant allowed cases and cross-tenant denied cases. Ensure denied requests do not mutate data or disclose whether foreign records exist.
- Reuse existing authorization helpers. Do not introduce a second role system or weaken fail-closed behavior.
- If the repository cannot support meaningful route-level tests without an unsafe shortcut, implement safe fixtures/harness improvements and document exact route families and evidence still missing. Do not mark the gate passed based on a textual match.

### C. Calculation integrity for the declared pilot scope

- Declare a narrow supported scope based on what the current implementation and verified norms actually support. Do not promise every legal scenario or historical year.
- Trace the supported 2026 child-support and partner-support flows from validated input through calculation, persisted snapshot, professional review/approval, recalculation, and report.
- Add independently traceable reference cases only when the official source, page/table locator, effective date, expected intermediate values, warnings, and independent professional verification are available. Never invent amounts or rules.
- Verify that calculation date/norm selection is explicit, persisted, and visible. Historical requests must continue to fail closed with `REVIEW_REQUIRED` unless the complete parameter set and reference cases are verified.
- Keep 2006–2025 incomplete periods blocked. Do not activate periods merely because CI passes or a source manifest exists.
- Check that recalculation invalidates stale approval binding and that reports/finalization consume the exact approved snapshot.

### D. Pilot scope, privacy, and security documentation

Add or update actual repository files (not just the PR description) that define:

- Supported workflows and calculation dates/norms; exclusions and known limitations.
- Synthetic-data-only demo/test behavior and the conditions required before any personal-data pilot.
- Roles, tenant model, access boundaries, document handling, AI proposal/approval boundary, retention/export/deletion, incident/support path, and named decisions still required.
- A risk register with severity, evidence, owner/decision needed, and status. Do not describe a risk as resolved without implementation and verification evidence.
- Clear distinction between repository checks, CI evidence, staging evidence, and human/legal/privacy/professional approvals.

Review copy for consistent Merelo identity. Correct stale product names in user-facing report/export output where safe and consistent with README. Do not claim a DPIA, legal review, security review, or operational approval has happened unless verifiable evidence is supplied.

### E. CI, documentation, and candidate evidence

- Read and follow `AGENTS.md`, `docs/ai-agents/README.md`, `docs/ai-agents/JULES.md`, and `docs/ai-agents/RELEASE-GATE.md`.
- Update the release gate and project/pilot status documents to link to actual evidence and keep unperformed gates unchecked.
- Run the required repository checks and full CI for the exact PR head. Report run URLs and SHA. Fix failures caused by this batch; do not misrepresent skipped or unavailable checks as passes.
- Inspect dependency/security results and record material unresolved findings; do not suppress or downgrade them to make CI green.
- Run a visual review on an accessible local candidate if the repository supports it; capture the actual screens/workflows reviewed, fix clear defects, and list anything not inspected. Do not claim a staging or production visual review without access to that exact candidate.
- Keep the patch focused enough to review despite its size: organize it in logical commits and describe changed files, behavior, evidence, limitations, and rollback considerations in the PR.

## Human/environment gates Jules cannot close by code

Keep these open until the responsible person supplies evidence:

- Professional review and sign-off of calculation reference cases and supported scope.
- Privacy/legal/security decisions, processing agreements, and any required DPIA.
- Hosting, secrets, TLS, monitoring, incident/support ownership.
- A successful backup verification and restore drill with recorded RPO/RTO.
- Exact-version staging smoke/acceptance using synthetic data.
- Product-owner approval to accept the pilot risk and define participants/data boundaries.
- Final candidate visual review on the actual candidate.

## Required PR completion report

In the PR body, include:

1. Exact base SHA and exact PR head SHA.
2. Work completed, grouped by sections A–E above.
3. CI/check links tied to that exact head; list skipped checks separately.
4. Tests added and what behavior they prove (plus what they do not prove).
5. A concise evidence table: gate, status, evidence link, remaining owner/action.
6. Open blockers and the specific source/access/decision needed.
7. Confirmation that no merge, deployment, restart, release/tag, production-data use, or staging contact occurred.

Do not say “pilot-ready” or “all done” while any code, test, professional, privacy, staging, restore, or operational gate is open. Leave the PR draft if exact-head CI or required review evidence is incomplete. The repository owner performs final review and merge.
