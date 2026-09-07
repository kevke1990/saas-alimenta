# Phase I — Launch Checklist

## Release blockers
- [ ] CI volledig groen op laatste commit
- [ ] Prisma migrations clean apply op lege database
- [ ] Prisma migrations upgrade vanaf huidige demo database
- [ ] `/api/health` 200
- [ ] `/api/ready` 200
- [ ] productie `.env` gevalideerd zonder placeholders
- [ ] Docker image non-root bevestigd
- [ ] production compose config gevalideerd

## Security
- [ ] login/register abuse tests
- [ ] session expiry + locked account tests
- [ ] MFA/passkey regression
- [ ] same-origin tests op alle muterende admin endpoints
- [ ] tenant/resource IDOR matrix
- [ ] role/organization authorization matrix
- [ ] rate-limit exhaustion tests
- [ ] secret exposure scan
- [ ] dependency audit
- [ ] security headers verification

## Customer lifecycle
- [ ] registration
- [ ] email verification
- [ ] login/logout
- [ ] password recovery
- [ ] MFA
- [ ] onboarding
- [ ] client creation
- [ ] case creation
- [ ] calculation
- [ ] scenario
- [ ] review
- [ ] approval
- [ ] final
- [ ] report/export
- [ ] archive/delete

## Billing
- [ ] Free plan
- [ ] Professional checkout
- [ ] Practice checkout
- [ ] Enterprise path
- [ ] Stripe Customer Portal
- [ ] webhook signature validation
- [ ] webhook idempotency
- [ ] payment failed
- [ ] subscription canceled
- [ ] subscription renewed
- [ ] admin manual plan grant
- [ ] admin cancellation
- [ ] billing UI consistency

## Communication
- [ ] provider configured
- [ ] sender verified
- [ ] reply-to
- [ ] inbound webhook
- [ ] delivery logging
- [ ] failure handling
- [ ] customer-facing mail templates
- [ ] privacy-safe mail content

## AI
- [ ] provider configuration in admin
- [ ] encrypted API key
- [ ] model configuration
- [ ] prompt configuration
- [ ] AI disabled fallback
- [ ] extraction disclaimer
- [ ] AI run audit
- [ ] no AI authority over calculation/norm/approval
- [ ] provider timeout/error handling
- [ ] token/input limits

## Data & privacy
- [ ] retention job
- [ ] privacy request workflow
- [ ] data export
- [ ] deletion
- [ ] consent records
- [ ] backup
- [ ] restore
- [ ] restore verification
- [ ] RPO/RTO documented

## Observability
- [ ] performance telemetry integrated into critical paths
- [ ] metrics endpoint protected
- [ ] structured logs
- [ ] error monitoring
- [ ] alerting
- [ ] uptime monitoring
- [ ] deployment version visible
- [ ] incident runbook

## UX
- [ ] desktop smoke test
- [ ] tablet smoke test
- [ ] mobile smoke test
- [ ] keyboard navigation
- [ ] form validation
- [ ] loading states
- [ ] error states
- [ ] empty states
- [ ] destructive action confirmations
- [ ] accessible labels

## Deployment
- [ ] staging VPS
- [ ] DNS
- [ ] TLS
- [ ] PostgreSQL persistence
- [ ] encrypted secrets
- [ ] backup schedule
- [ ] restore drill
- [ ] migration rehearsal
- [ ] rollback drill
- [ ] production smoke test
- [ ] live Stripe test
- [ ] live mail test

## Launch acceptance
- [ ] clean registration works
- [ ] customer can complete one real calculation
- [ ] professional report is reproducible
- [ ] payment lifecycle works
- [ ] admin can support customer without database access
- [ ] no known high-severity security issue
- [ ] no known calculation regression
- [ ] backup/restore verified
- [ ] monitoring active
- [ ] launch version tagged
