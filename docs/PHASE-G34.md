# Fase G3 + G4 — Team, permissions & security

## G3
- Organization roles: OWNER, ADMIN, PROFESSIONAL, READ_ONLY.
- Team overview at `/team`.
- Server-side role enforcement for team administration.
- Admins can change non-owner member roles and remove non-owner members.
- Owners can assign OWNER; the current owner cannot accidentally demote themselves through the API.
- Team mutations create audit entries.
- Existing dossier `userId` isolation is intentionally preserved; shared dossier permissions are a later explicit capability.

## G4
- Central security-event helper and authenticated security-events endpoint.
- Security-sensitive team mutations are auditable.
- No secrets are exposed through the security endpoint.
- Existing password hashing, signed sessions, passkeys model and security headers remain in place.

## Boundary
G3/G4 do not silently change the calculation engine, review/provenance workflow, Stripe billing state, or existing resource isolation.
