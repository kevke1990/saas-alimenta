# Merelo AI Development Contract

This repository is the source code for Merelo, a professional Dutch alimentatie workspace. Use this file as the agent map; detailed project knowledge lives in `docs/` and `README.md`.

## Source of truth

- `README.md`: product scope, architecture, deployment and release context.
- `docs/ai-agents/README.md`: Jules/Codex operating model.
- `docs/ai-agents/JULES.md`: Jules-specific workflow.
- `docs/ai-agents/CODEX.md`: Codex-specific workflow.
- `docs/ai-agents/RELEASE-GATE.md`: production gate and 1 January 2027 target.
- `docs/ai-agents/PLANS.md`: execution-plan format for substantial work.
- Existing calculation code and tests are authoritative over prose when they disagree; investigate and document the discrepancy rather than silently changing behavior.

## Non-negotiable rules

1. Do not replace or rewrite the existing calculation engine merely to simplify a task.
2. Treat calculation behavior as safety-critical business logic: every material change needs regression coverage and provenance.
3. Never guess historical alimentatienormen, legal parameters, source values, or missing financial inputs.
4. Historical periods must fail closed with `REVIEW_REQUIRED` when the complete executable norm set is not verified.
5. Never silently fall back from an unsupported historical period to current norms.
6. Never disable, weaken, delete, skip, or falsify a test/check merely to obtain green CI.
7. Never commit secrets, real client data, production credentials, or private documents.
8. Preserve authentication, authorization, tenant boundaries, auditability, approval bindings and immutable calculation snapshots unless the task explicitly changes them.
9. AI-extracted facts are proposals until professional approval; never promote AI output directly into final calculation input.
10. Do not make unrelated cleanup changes in a feature/bugfix PR.

## Working method

For small changes, inspect only the relevant code and tests. For substantial changes, create or update an ExecPlan using `docs/ai-agents/PLANS.md`.

Before implementation:
- identify the requested behavior and acceptance criteria;
- inspect the relevant routes, services, domain code, schema and tests;
- identify invariants and release risks;
- state assumptions explicitly;
- prefer the smallest safe change.

After implementation:
- run the most relevant focused tests first;
- run the full repository validation required by CI before declaring completion;
- inspect the final diff for unintended changes;
- document remaining uncertainty or manual validation.

## Calculation integrity

For calculation work, preserve and verify:
- input snapshot;
- engine version;
- norm version/period;
- provenance/source status;
- calculation result;
- warnings/review requirements;
- approval binding and stale-approval behavior.

A calculation change is not complete because the numeric result looks plausible. It is complete only when the rule, provenance, regression coverage and review behavior are correct.

## CI and release discipline

The repository CI is the minimum quality bar. Current CI covers repository hygiene, dependency installation, security audit, Prisma validation/migrations/generation, tests, production build, runtime health/readiness, production Compose, Docker image checks and deployment-script syntax.

Do not merge a PR with a failing required check. Do not claim production readiness from a local test alone.

## Git workflow

- Work from current `main` unless the task explicitly names another base.
- Use focused branches and focused PRs.
- Prefer one coherent change per PR.
- Use descriptive conventional commit messages.
- Never force-push or rewrite shared history unless explicitly requested.
- A PR is not done until its final head has passed required CI and the diff has been reviewed.

## Definition of done

A task is done only when implementation, tests, documentation where needed, security/release impact, and CI validation are all addressed. For release work, also satisfy every item in `docs/ai-agents/RELEASE-GATE.md`.
