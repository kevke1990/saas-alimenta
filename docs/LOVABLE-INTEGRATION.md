# Lovable integration

This branch integrates the UI/UX architecture from `kevke1990/alimenta-pro-hub` into the existing Next.js/Prisma Alimenta Pro application.

## Rules
- Keep the existing calculation engines and calculation snapshot/provenance logic authoritative.
- Do not replace the existing Next.js/Prisma architecture with TanStack Start.
- Port the Lovable design system and screen patterns into Next.js layouts/components.
- Calculation reports must remain bound to persisted calculation snapshots/results.
- Customer references become server-generated unique six-digit numbers.
- Organization/control-mode/subdomain capabilities require explicit Prisma/RBAC changes and audit coverage.

See `kevke1990/alimenta-pro-hub/PORTING.md` for the source mapping.