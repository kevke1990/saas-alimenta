# Alimenta Pro API v1

**Status:** eerste documentatieversie — F4 gestart

Deze pagina beschrijft de publieke integratie-ingang voor externe applicaties. De API werkt uitsluitend op resources van de eigenaar van het API-token.

## Basis

- Base path: `/api/v1`
- Content type: `application/json`
- Authenticatie: `Authorization: Bearer <token>`
- Tokens worden aangemaakt via `/api/integrations/api-keys`.
- Gebruik altijd HTTPS buiten een lokale ontwikkelomgeving.

## Scopes

| Scope | Doel |
|---|---|
| `cases:read` | Dossiers lezen en exporteren |
| `cases:write` | Dossiers importeren/bijwerken volgens het importcontract |
| `clients:read` | Cliëntgegevens lezen waar ondersteund |
| `clients:write` | Cliëntgegevens wijzigen waar ondersteund |
| `webhooks:manage` | Webhook-abonnementen beheren |

## Endpoints

### Dossiers

`GET /api/v1/cases`

Geeft een lijst van dossiers die bij het token horen. Vereist `cases:read`.

`GET /api/v1/cases/:id`

Geeft het dossierdetail voor een dossier dat bij het token hoort. Vereist `cases:read`.

### Export

`GET /api/v1/export/cases/:id`

Geeft een versioned JSON-export. Vereist `cases:read`.

Voorbeeld:

```bash
curl -H "Authorization: Bearer $ALIMENTA_TOKEN" \
  https://example.invalid/api/v1/export/cases/case_123
```

Een export bevat minimaal `schemaVersion: "1.0"` en bron-/provenancegegevens. Binaire documenten worden niet via deze route geëxporteerd.

### Import

`POST /api/v1/import/cases`

Maakt een nieuw tenant-scoped cliënt/dossier aan op basis van importcontract `1.0`. Vereist `cases:write`.

Voorbeeld:

```bash
curl -X POST \
  -H "Authorization: Bearer $ALIMENTA_TOKEN" \
  -H "Content-Type: application/json" \
  --data @case-import-v1.json \
  https://example.invalid/api/v1/import/cases
```

Imports starten als `DRAFT` / `INCOMPLETE`. Een import kan nooit rechtstreeks een goedgekeurde of definitieve berekening creëren.

## Foutcontract

Integraties moeten rekening houden met deze HTTP-statussen:

- `401` — ontbrekende of ongeldige authenticatie
- `403` — token heeft onvoldoende scope
- `404` — resource bestaat niet of behoort niet tot de token-eigenaar
- `409` — conflict, bijvoorbeeld een niet-toegestane statusovergang
- `422` — inhoudelijke validatiefout
- `429` — rate limit of plan-entitlement bereikt
- `5xx` — tijdelijke serverfout; retry alleen met backoff en zonder dubbele mutatie

Foutresponses horen een bruikbare tekst of JSON-foutmelding te bevatten. Externe clients mogen geen juridische status of berekeningsuitkomst aannemen op basis van een mislukte mutatie.

## Veilig gebruik

1. Bewaar tokens uitsluitend server-side.
2. Log nooit het volledige token.
3. Gebruik een aparte token per integratie.
4. Trek tokens in wanneer een integratie niet langer nodig is.
5. Behandel exports als persoonsgegevens en beperk opslagduur en toegang.
6. Voor muterende requests moet de integratie een eigen idempotency-sleutel bijhouden en retries met exponential backoff uitvoeren.
7. Webhook-signatures moeten worden gecontroleerd voordat een event wordt verwerkt.

## Webhooks

Webhook-events worden als HTTPS POST afgeleverd. De headers bevatten `x-alimenta-event` en `x-alimenta-signature`. De huidige signature is een SHA-256-digest over `secret + '.' + payload`.

Ondersteunde events:

- `case.created`
- `case.updated`
- `case.calculated`
- `case.approved`

Een webhook kan geen berekening, normversie, reviewstatus of goedkeuringsstatus wijzigen.

## Versiebeheer

Wijzigingen aan het JSON-contract krijgen een nieuwe `schemaVersion`. Clients moeten onbekende velden negeren waar mogelijk en de `schemaVersion` controleren voordat ze een import of export verwerken.
