# Fase 7B — Billing en abonnementen

## Doel
Een betrouwbare, controleerbare billinglaag voor SaaS-Alimenta, met duidelijke abonnementsstatussen, server-side entitlement checks en veilige Stripe-webhookverwerking.

## Implementatie
- Eén centrale server-side entitlementlaag in `lib/billing.ts`.
- Planmatrix voor `FREE`, `PRIVATE`, `PRO`, `PRACTICE` en `ENTERPRISE`.
- `PRIVATE` en `PRO` gebruiken server-side actieve-dossierlimieten van respectievelijk 1 en 5.
- `PRACTICE` en `ENTERPRISE` kunnen als beheerde entitlements actief blijven zonder Stripe-status.
- `FREE` heeft geen betaalde entitlement; dit blijft bewust los van demo/offline-functionaliteit, die in Stap 17 wordt gescheiden.
- Case-creatie controleert de entitlement en actieve-dossierlimiet server-side; frontendwaarden zijn niet autoritatief.
- Stripe checkout en customer portal blijven eigendom van de ingelogde gebruiker via de bestaande `requireUser()`-flow.
- Stripe webhook-signatures worden server-side geverifieerd.
- `StripeEvent` is de idempotency-key op applicatieniveau.
- De `StripeEvent`-claim en subscription-mutaties worden in één PostgreSQL-transactie verwerkt. Bij een fout rolt de claim terug zodat Stripe veilig kan retryen.
- Na een succesvolle verwerking wordt een event niet verwijderd.
- Subscriptionstatussen worden expliciet gemapt; `PAST_DUE` blijft tijdelijk entitled, terwijl `CANCELED` en verlopen/incomplete staten geen betaalde entitlement geven.
- Stripe secrets blijven server-side en versleuteld in de bestaande `StripeConfig`-opslag.

## Bewust niet gewijzigd
- Calculation engine, formules, normen, percentages, afronding en berekeningsresultaten.
- Bestaande Stripe-prijzen en productconfiguratie.
- Bestaande PostgreSQL/Prisma-persistence.
- Geen tweede billingdatabase of lokale billingstaat.
- Geen productie-deployment of productie-migratie tijdens de hardening-fase.

## Acceptatiecriteria
- Geen betaalde functionaliteit is uitsluitend door frontendlogica afgeschermd.
- Een gebruiker kan alleen zijn eigen Stripe customer/subscription beheren.
- Een webhook kan veilig opnieuw worden aangeboden zonder dubbele lokale mutaties.
- Een mislukte webhooktransactie laat geen halfverwerkte `StripeEvent`-claim achter.
- `PAST_DUE`, `CANCELED` en incomplete abonnementen hebben voorspelbare entitlementregels.
- Secrets en webhook-signatures worden nooit gelogd of teruggegeven aan de client.

## Veiligheidsregel
Bestaande `userId`-scoping en tenant-autorisatie blijven verplicht. Billing mag nooit toegang geven tot data van een andere gebruiker of tenant.
