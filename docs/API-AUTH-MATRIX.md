# API authorization matrix — Update 1

This document is the development security contract for the Next.js API surface. The regression suite in `tests/api-authorization.test.ts` scans the actual `app/api/**/route.ts` files so a new endpoint cannot silently ship without an explicit authentication mechanism.

## Route classes

| Route class | Required control | Resource boundary |
|---|---|---|
| `/api/auth/**` | Endpoint-specific token/password controls | No authenticated session required for login/register/recovery flows |
| `/api/health`, `/api/ready`, `/api/release` | Public by design | No dossier data |
| `/api/stripe/webhook` | Stripe signature verification | Only mutates the account identified by the verified Stripe event |
| `/api/mail/inbound` | `POSTMARK_INBOUND_SECRET` | Mailbox hash resolves to the owning user |
| `/api/v1/**` | API token + scope + rate/entitlement checks | Token owner is the resource owner |
| All other `/api/**` | `requireUser`, `requireRole` or `requireAdmin` | ID-based queries must include the authenticated owner or explicit RBAC boundary |

## Dynamic-resource rule

For case, client, document and income-fact endpoints, an ID is never authorization. The authenticated user must be part of the database predicate (`userId`) or the endpoint must be explicitly protected by the administrator/team RBAC boundary.

## Calculation integrity

- A dossier in `APPROVED` or `FINAL` state is calculation-locked.
- Editing an unlocked dossier creates a new immutable `Calculation` snapshot.
- Approved AI income facts must have an explicit parent assignment before they can be applied.
- Applying or changing approved facts invalidates the previous review and requires a new review of the resulting snapshot.
- Snapshot provenance remains linked to the approved income facts and their source documents.

## AI/document boundary

Document upload and local extraction never directly changes a calculation. PDF, DOCX, TXT, CSV and image files are encrypted at rest. Local extraction is stored as an extraction proposal alongside the document AI result. AI extraction remains proposal-only until a professional explicitly reviews and approves the resulting income facts.

OCR is opt-in (`OCR_ENABLED=true`) and uses the configured Tesseract binary. If OCR tooling is unavailable, upload remains safe and the document is marked as locally unextractable instead of fabricating text.

## Privacy boundary

- IP hashes are only generated when `PRIVACY_HASH_SALT` is configured with a sufficiently long secret; there is no insecure fallback salt.
- Account/client exports contain application data needed for access/portability but never password hashes or MFA secrets.
- Erasure is performed through the authenticated owner boundary and removes the associated client-scoped records.

## Regression requirement

Run `npm test` before every release. The authorization matrix test is intentionally filesystem-based: adding a new API route changes the test surface automatically.
