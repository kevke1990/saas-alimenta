# Merelo execution plans

Use an execution plan for multi-file features, calculation changes, security hardening, migrations, deployment work, or any task likely to take more than one focused implementation cycle.

## Required sections

```markdown
# Title

## Goal
What outcome must exist when the work is complete?

## Current state
What exists now, including relevant files, routes, data and tests?

## Constraints / invariants
What must not change or what must remain true?

## Approach
The chosen implementation and why it is safe.

## Steps
1. ...
2. ...
3. ...

## Validation
Exact tests, checks, CI and manual validation required.

## Rollback / recovery
How to safely revert or recover if the change fails.

## Risks / open questions
Known uncertainty that must not be silently guessed.

## Completion evidence
Links/commits/CI runs or concrete evidence after implementation.
```

## Rules

Plans are implementation contracts, not permanent documentation. Update them when the implementation materially changes. Once complete, record the final evidence and move the plan to the appropriate completed area if a task-specific plan file is created.

Never use a plan to justify skipping tests or release gates.
