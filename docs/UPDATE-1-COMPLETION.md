# Update 1 — Product completeness & security

Status: **implemented in code** on `main`.

## Delivered

- Real file intake for PDF, DOCX, TXT, CSV, JPG, PNG and WEBP.
- Server-side document extraction for PDF text and DOCX text.
- Opt-in OCR pipeline for images and scanned PDFs through Tesseract + `pdftoppm`.
- Extraction results are retained with the document AI result and never become calculation input automatically.
- AI analysis keeps the original document extraction provenance when the Gemini result is refreshed.
- API authorization regression scan covering the actual route tree.
- Dynamic resource authorization regression checks for user ownership predicates.
- v1 API-token authentication regression checks.
- Webhook secret/signature regression checks.
- RBAC effective-role hardening: `isAdmin` cannot be shadowed by the default user role.
- Privacy IP hashing no longer falls back to a public/default salt.
- Privacy and security regression tests extended.
- Production/development environment examples document OCR configuration.
- Professional document workspace now supports actual file uploads and AI analysis from the browser.

## Existing controls retained

The update builds on the existing immutable calculation snapshots, calculation fingerprints, case locks, professional overrides, AI income-fact approval workflow, review binding, audit logging, retention tooling, billing lifecycle, mail lifecycle and privacy export/erasure implementation.

## Explicit operational boundary

This update completes the **development implementation**. It does not fabricate external infrastructure credentials or operational evidence. A real deployment still requires the environment, VPS/DNS/TLS, production Stripe/Postmark configuration, AI credentials if enabled, OCR binaries and backup/monitoring destinations from the production configuration phase.
