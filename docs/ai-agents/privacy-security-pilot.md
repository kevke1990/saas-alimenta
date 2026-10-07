# Merelo Pilot Privacy & Security Baseline

This document defines the security and privacy boundaries for the Merelo synthetic-data pilot.

## Access & Roles
- **Tenant Model:** Data is strictly segregated by organization/tenant. Users cannot read or mutate data outside their assigned tenant.
- **Role-Based Access Control (RBAC):**
  - `READ_ONLY`: Can view dossier and calculation data. Cannot mutate cases, calculations, or documents.
  - `PROFESSIONAL`: Can create, update, delete cases, calculations, and approve final reports.
  - `ADMIN`: Full access to the organization's settings.

## Data Processing & AI
- **Document Handling:** Uploaded documents are processed for text extraction. OCR is only executed if explicitly enabled (`OCR_ENABLED`).
- **AI Proposal Boundary:** AI may suggest values based on extracted document text, but it is strictly a proposal. All AI-suggested values must be explicitly reviewed and bound by a `PROFESSIONAL` user before they affect approved calculations.
- **Data Retention:** Audit logs and document storage adhere to strict retention windows. Data beyond the cutoff period is irreversibly deleted.

## Risk Register
| Risk | Severity | Status | Evidence/Action Needed | Owner |
|---|---|---|---|---|
| Use of Real Data | HIGH | OPEN | Requires signed DPIA and processing agreements. Current pilot restricted to synthetic data. | Product Owner |
| Historical Calculation Fallback | HIGH | CLOSED | Implemented `REVIEW_REQUIRED` fail-closed mechanism in engine adapter. | Jules/Codex |
| Unapproved PDF Export | MED | OPEN | Logic implemented, but real integration DB tests are missing. | Jules/Codex |
| Tenant Isolation Breach | HIGH | OPEN | Logic implemented, but real integration DB tests are missing. | Jules/Codex |
| Backup/Restore Drill | HIGH | OPEN | Requires staging/prod restore drill with documented RPO/RTO. | DevOps/Operations |

*Note: Do not mark a risk as CLOSED without verified repository evidence (code + tests).*
