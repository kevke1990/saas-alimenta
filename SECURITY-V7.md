# V7 Security Architecture

## Threat model

Protected assets:
- client personal data;
- financial data;
- calculation inputs/results;
- credentials;
- Stripe/customer billing information;
- norm version history.

Primary threats:
- account takeover;
- cross-tenant data access;
- SQL/injection attacks;
- CSRF;
- XSS;
- SSRF;
- malicious file uploads;
- webhook spoofing;
- exposed database;
- leaked secrets;
- vulnerable dependencies;
- compromised VPS.

## Controls

- Passwords: bcrypt.
- Sessions: short-lived HttpOnly Secure SameSite=Strict cookie.
- Authorization: every server route resolves current user and filters by userId.
- Admin: separate authorization gate.
- Database: internal only.
- App: loopback binding.
- TLS: Let's Encrypt.
- Headers: CSP, HSTS, frame denial, MIME sniffing protection.
- Host: nftables + fail2ban + unattended upgrades.
- Containers: read-only root filesystem, no-new-privileges, dropped Linux capabilities.
- Audit: security-sensitive actions recorded.
- Stripe: webhook signature verification.
- Data: backups + tested restore.
- Dependencies: keep Next.js on supported LTS and patch security releases promptly.

## What still needs a professional security review

No source code alone can prove a system is "fully secure". Before selling:
1. automated dependency scanning;
2. SAST;
3. DAST;
4. authenticated penetration test;
5. tenant-isolation tests;
6. backup restore drill;
7. incident response exercise;
8. external review of authentication and payment flows.
