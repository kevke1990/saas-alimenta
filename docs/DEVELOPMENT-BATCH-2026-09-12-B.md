# Development batch B — 12 september 2026

## Doel

Deze batch legt herbruikbare beveiligings- en API-fundamenten vast zodat bestaande en nieuwe endpoints versneld en consistent kunnen worden verbeterd.

## Uitgevoerd

- Request-ID-generatie met `crypto.randomUUID()`.
- Hergebruik van een aangeleverde `x-request-id` wanneer deze geldig en begrensd is.
- Consistente `x-request-id`-responseheader voor API-successen en -fouten.
- Rate-limit policy primitives met veilige grenzen.
- Rate-limitbeslissingen met `remaining` en `retryAfterSeconds`.
- Standaardheaders voor rate-limitinformatie.
- Tests voor ongeldige limieten, toegestane requests, blokkering en headers.

## Bewuste grens

De rate-limitmodule is een deterministische policylaag. Er wordt nog geen proceslokale of gedistribueerde teller als productiebeveiliging geclaimd. De volgende stap is koppeling aan een gedeelde opslaglaag of bestaande infrastructuur, met expliciete tenant- en route-sleutels.

## Volgende implementatieblok

1. Request-ID doorvoeren in geselecteerde API-routes en audit-events.
2. Uniforme foutresponses toepassen op v1-endpoints.
3. Paginering toevoegen aan dossier-, mail- en delivery-history endpoints.
4. Prisma-backed `WebhookDeliveryStore` implementeren.
5. Worker-endpoint beveiligen met interne authenticatie, scopecontrole en idempotency.
6. OpenAPI-contracttests laten controleren of implementatie en documentatie overeenkomen.
7. Endpointtests toevoegen voor ownership, rate limiting en foutcontracten.

## Validatie

Elke codewijziging moet door de volledige bestaande CI-pipeline gaan voordat de status als groen wordt geregistreerd.
