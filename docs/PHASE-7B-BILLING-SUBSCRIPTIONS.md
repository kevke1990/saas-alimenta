# Fase 7B — Billing en abonnementen

## Doel
Een betrouwbare, controleerbare billinglaag voor SaaS-Alimenta, met duidelijke abonnementsstatussen, server-side entitlement checks en veilige Stripe-webhookverwerking.

## Bestaande basis
- `User` bevat al `plan`, `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus` en `subscriptionEndsAt`.
- `Subscription` bevat een Stripe-subscription, prijs-ID, status en periode-einde.
- `StripeConfig`, `StripePlan` en `StripeEvent` zijn aanwezig als basis voor beheerconfiguratie, prijsplannen en idempotente webhookverwerking.
- Stripe is als dependency opgenomen.

## Implementatievolgorde
1. Eén centrale server-side entitlementfunctie maken; UI-velden en client-input mogen nooit bepalen welke functies beschikbaar zijn.
2. Plan- en featurematrix vastleggen voor `FREE`, `PRIVATE`, `PRO`, `PRACTICE` en `ENTERPRISE`.
3. Alle betaalde API-routes laten controleren op actieve entitlement en accountstatus.
4. Checkout- en customer-portalflows controleren op eigenaarschap van de ingelogde gebruiker.
5. Webhooks strikt valideren met de Stripe-signature, idempotent verwerken via `StripeEvent` en subscriptionstatus atomair bijwerken.
6. Downgrade, annulering, `PAST_DUE`, verlopen proefperiode en ontbrekende Stripe-data expliciet afhandelen.
7. Billing-overzicht en foutmeldingen toevoegen zonder geheime Stripe-informatie naar de browser te sturen.
8. Tests toevoegen voor entitlementgrenzen, webhook-idempotentie, verkeerde gebruikerskoppelingen en statusovergangen.

## Acceptatiecriteria
- Geen betaalde functionaliteit is uitsluitend door frontendlogica afgeschermd.
- Een gebruiker kan alleen zijn eigen Stripe customer/subscription beheren.
- Een webhook kan veilig opnieuw worden aangeboden zonder dubbele mutaties.
- Onbekende of ongeldige webhook-events worden geweigerd of veilig genegeerd.
- `PAST_DUE`, `CANCELED` en verlopen abonnementen leiden tot voorspelbare featurebeperkingen.
- Secrets en webhook-signatures worden nooit gelogd of teruggegeven aan de client.

## Veiligheidsregel
Bestaande `userId`-scoping en autorisatie blijven verplicht. Billing mag nooit toegang geven tot data van een andere gebruiker of tenant.
