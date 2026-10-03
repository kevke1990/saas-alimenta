# Merelo AI Development Team

## Goal

Use Jules and Codex as complementary engineering agents while keeping GitHub, the repository, tests and CI as the source of truth. The objective is a controlled path to a production release targeted for **1 January 2027**, without sacrificing calculation integrity or security.

## Roles

### Jules — implementation agent

Jules is the primary asynchronous builder. Give Jules scoped GitHub issues or clearly bounded implementation tasks. Jules should inspect the repository, propose a plan, implement the change, add/update tests, run validation and publish a branch/PR for review.

Jules must not be treated as the final authority on correctness. Its output always enters the normal PR and CI process.

### Codex — senior reviewer/fixer

Codex is the independent second pair of eyes. Use Codex after Jules produces a meaningful PR, or directly for CI failures, security hardening, difficult debugging and release audits.

Codex should challenge assumptions, inspect the actual diff, identify regressions and missing tests, and fix confirmed issues rather than merely reporting them.

### GitHub CI — objective gate

Neither agent can declare a release ready by assertion. Required CI, production checks and release-gate evidence are the objective engineering gates.

## Standard loop

```text
Issue / approved plan → Jules → implementation + tests → PR → Codex review → fixes → full CI → release gate
```

## Task routing

| Work | Primary | Secondary |
|---|---|---|
| New bounded feature | Jules | Codex review |
| Normal bug fix | Jules | Codex review |
| CI failure | Codex | Jules if broader implementation is required |
| Security audit | Codex | Jules implementation |
| Calculation-rule change | Jules | Codex independent audit |
| Historical norm work | Jules | Codex + source/provenance audit |
| Large refactor | Codex plan + Jules implementation | Independent review |
| Release audit | Codex | Jules remediation |
| Production incident | Codex | Jules follow-up implementation |

## Guardrails

- No direct-to-production changes from an agent.
- No merge while required CI is red.
- No historical/legal parameter guessing.
- No calculation-engine rewrite as a shortcut.
- No test deletion or weakening to hide regressions.
- No secret or real client data in the repository.
- No broad autonomous cleanup mixed into product work.

## Daily operating pattern

1. Select well-defined issues.
2. Jules implements bounded work.
3. Review each PR for scope and calculation/security impact.
4. Run Codex review on substantial PRs and all calculation/security/release changes.
5. Fix findings.
6. Run full CI on the final PR head.
7. Merge only after branch/release criteria are satisfied.
8. Keep the release checklist and known-risk register current.

## Important current repository state

The repository contains substantial v1.0 hardening and historical-norm work. Old PRs and old CI results must never be assumed to represent current `main`; always inspect the current branch and PR head.
