# Merelo pilot status after PR #67 merge

**Status checked:** 7 October 2026  
**Repository:** `kevke1990/saas-alimenta`  
**Merged main commit:** `4b95db9475e5fb8ec54f0ff964097bab0cb1376e`  
**PR #67 head:** `3967fe73cb1d8b09931f3de0f604dc74d2ca68d2`  
**PR #67 merge:** https://github.com/kevke1990/saas-alimenta/pull/67  
**Prior detailed execution brief:** [merelo-pilot-completion-batch.md](./merelo-pilot-completion-batch.md)

This document supersedes the PR #67 status statements in the earlier execution brief. It records repository evidence only; it does not certify pilot readiness.

## Executive status

**Merelo is not yet ready for a professional pilot.** PR #67 is merged, but its delivered diff does not include the implementation described in its PR body. The merge adds one Git submodule pointer at repository-root path `saas-alimenta`; it does not add the claimed pilot/privacy documents or authorization tests.

CI run **#1298 succeeded on PR #67 head** `3967fe7...`. This is a green check on the PR head, but the only diff is a gitlink. The checked-out root workflow does not initialize submodules, so this run does not validate files from the referenced subproject. The GitHub status connector did not expose checks on the merge commit itself; confirm the main push run in GitHub Actions before calling the merged baseline validated.

No pilot deployment, staging acceptance, restore drill, privacy/security approval, or professional calculation review is evidenced here. No production or Homey actions were performed.

## What PR #67 actually delivered

The PR diff is exactly one entry:

- `saas-alimenta` — gitlink mode `160000`, pointing at `9fe0b4054c561be23a5aa914fc4e1c5ceeef532d`.

The following files claimed in the PR description are absent from `main` (GitHub returned 404 when read):

- `docs/pilot-scope.md`
- `docs/privacy-security-risks.md`

The merged `tests/api-authorization.test.ts` remains a source-marker scan. It checks for strings such as `requireUser`, `userId`, or tenant-helper names; it does not send requests as one tenant to another tenant's resources.

The merged PDF route remains unchanged: it selects the newest calculation (or the case result fallback) and generates a PDF without checking review status or current approval binding. The PDF also still uses the old “Alimenta Pro” branding. This is a release blocker because the release gate requires reports/PDFs to use the latest approved snapshot.

## Work Jules should pick up next

Use a clean branch from the latest `main`. Work in the root repository, not inside the new `saas-alimenta` gitlink. First inspect whether the gitlink is intentional; unless there is a documented, working submodule design with pinned accessible source and CI coverage, remove this accidental nested gitlink in the implementation PR.

### Priority 0 — establish a real, reviewable delivery

- Replace PR #67's gitlink-only delivery with actual tracked root-repository changes.
- Add the promised pilot scope and privacy/security register as real Markdown files.
- Update this status plan and the release gate only to reflect implemented, verifiable evidence.
- Keep the PR draft while implementation or exact-head CI is incomplete. Do not merge.

### Priority 1 — fix report approval integrity

- Enforce current approval binding for PDF output, consistent with the HTML report/finalization workflow.
- Reject or conspicuously mark unapproved, stale, missing-binding, or absent calculations as draft. Do not present them as approved.
- Add route-level tests for approved-current, unapproved, recalculated/stale, missing approval binding, and no-calculation cases.
- Use Merelo branding and expose calculation date, engine/norm version, provenance/review state, relevant warnings, and a clear non-legal-advice statement.

### Priority 2 — add real tenant and role denial evidence

- Replace or supplement static authorization-marker tests with request-level tests using isolated synthetic users, organizations, and records.
- Cover cross-tenant reads and mutations for protected resource families in scope, including cases, clients, documents, income facts, reports/PDF, and relevant integrations.
- Cover same-tenant allowed behavior plus implemented role limits (including read-only, assistant/reviewer, professional, admin).
- Assert denied requests do not mutate records or reveal foreign-record data. If a test harness or environment is missing, add safe fixtures and clearly state the uncovered cases.

### Priority 3 — bounded calculation/reference evidence

- State the pilot's supported calculations and dates narrowly from the code and verified sources.
- Trace the supported current norm flows through input, calculation snapshot, review, approval, recalculation, and report.
- Add source-located reference cases and intermediate values only when supported by official sources and independently reviewed by a qualified professional. Do not invent expected amounts.
- Preserve historical fail-closed behavior. Keep incomplete 2006–2025 periods blocked until complete parameters, effective dates, and reference cases are verified; a green CI or source manifest does not activate a norm period.

### Priority 4 — tests, CI, and accurate evidence

- Follow `AGENTS.md`, `docs/ai-agents/JULES.md`, and `docs/ai-agents/RELEASE-GATE.md`.
- Run required tests and full CI on the exact final PR head; include direct run links and SHA.
- Distinguish PR-head CI from main push CI, and distinguish both from staging acceptance.
- Report all skipped, unavailable, or failed checks and the exact reason. Do not claim local tests passed unless they were actually run on this change.
- If visual review is possible on an accessible local candidate, record the screens/workflows actually inspected. Do not claim staging or production visual review without access to that exact candidate.

## Gates that remain outside Jules' code authority

Keep these open until evidence and responsible sign-off exist:

- Independent professional review of the calculation scope and reference dossiers.
- Privacy/legal/security decisions and any required processing agreements or DPIA.
- Production-quality hosting, secrets, TLS, monitoring, incident and support ownership.
- Verified backup plus a staging restore drill with recorded RPO/RTO.
- Exact-version staging smoke/acceptance using synthetic data.
- Product-owner decision on pilot participants, boundaries, and whether any personal data may be used.
- Visual/professional review of the exact candidate intended for the pilot.

## Owner workflow after Jules responds

1. Read the complete changed-file diff; verify actual files and behavior are present in the repository root.
2. Confirm exact-head CI is green and check its run belongs to the latest PR SHA. Treat run #1298 as historical evidence for PR #67's gitlink-only head, not validation of Jules' next implementation.
3. Review tests and the evidence/open-gates table. Ask Jules to fix the PR if it overclaims or leaves a code-completable blocker.
4. Make the merge decision yourself; Jules cannot merge.
5. Only after merge, prepare the exact versioned candidate and complete the human/environment gates before any pilot. Do not interpret merge or green CI as pilot approval.

## Required Jules completion report

Jules must state the base/head SHAs; actual changed files; behavior fixed; test coverage and limits; exact CI run links; skipped checks; remaining blockers with owner/action; and confirmation that no merge, deploy, restart, release/tag publication, production-data use, staging contact, or Homey action occurred.
