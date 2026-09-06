# Architectuur

Browser
→ Next.js application
→ PostgreSQL / Prisma
→ Stripe Billing
→ PDF/report worker (volgende release)
→ email provider (volgende release)

## Tenant isolation

Elke Client en Case bevat userId. Elke serveractie controleert de huidige user en gebruikt daarna userId als filter. Dit moet bij iedere nieuwe route verplicht blijven.

## Calculation immutability

Elke Calculation bevat:
- engineVersion
- normVersion
- inputSnapshot
- result
- timestamp

Daardoor kunnen oude rapporten worden gereproduceerd nadat normtabellen later veranderen.

## Normbeheer

NormVersion is een aparte tabel. Productie moet admin-only editing krijgen en iedere wijziging moet worden geaudit.

## Security

- HttpOnly sessiecookie
- bcrypt password hashing
- HTTPS
- server-side authorization
- rate limiting
- security headers
- audit log
- database backups
- restore tests
