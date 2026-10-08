# Merelo Pilot Scope

This document defines the functional scope of the Merelo pilot release, focused exclusively on synthetic data.

## Supported Workflows
- **2026 Child Support Calculation:** Core support implemented based on 2026 norm guidelines, pending full external professional verification. Includes standard capacity, NBI/NBGI/KGB integrations, and care discounts.
- **2026 Partner Support Calculation:** Scope implemented, pending full external professional verification.
- **Dossier Management:** Core workflow for creating and managing cases and clients works end-to-end.
- **Reports:** Generation of PDF reports reflecting the *latest approved* calculation snapshot. Unapproved or stale calculations yield "CONCEPT" reports.

## Exclusions & Limitations
- **Historical Norms (2006-2025):** These periods are explicitly *excluded* from the current executable engine. Any attempt to run calculations for these periods will fail closed with a `REVIEW_REQUIRED` error unless full parameters and explicit verification artifacts are present.
- **Legal Advice:** The software provides mathematical calculations based on entered data and selected norms. It does *not* provide legal advice.
- **Real Personal Data:** The current pilot candidate is restricted to **synthetic data only**. No actual client data may be processed until explicit, documented approvals (DPIA, processing agreements) are completed by the product owner.

## Pilot Candidate Requirements
- A green CI run is necessary but insufficient.
- Final validation requires human visual review of the staging environment and product owner sign-off.
