# Fase 7C — Agenda, e-mail en custom domains

## Doel
De SaaS uitbreiden met een betrouwbare agenda-, e-mail- en domeinlaag die veilig binnen de praktijk/tenant blijft functioneren.

## Scope

### 1. Agenda
- Tenant- en membership-scoped agenda-items.
- Aanmaken, wijzigen, annuleren en verwijderen met autorisatiecontrole.
- Koppeling tussen agenda-items, cliënten en dossiers zonder cross-tenant toegang.
- Tijdzonebewuste opslag en weergave.
- Validatie van overlappende of ongeldige tijdsintervallen.
- Herinneringen en duidelijke statusafhandeling.

### 2. E-mail
- Veilige e-mailidentiteiten per praktijk.
- Verificatie van afzenderdomein/adres vóór verzending.
- Centrale mailservice met logging, status en foutafhandeling.
- Geen verzending namens een onbevestigde identiteit.
- Idempotente verwerking van provider-events.
- Tenant-scoped templates, ontvangers en verzendhistorie.
- Bescherming tegen header-injection en ongeautoriseerde ontvangers.

### 3. Custom domains
- Domeinregistratie per praktijk.
- DNS-verificatie met cryptografisch willekeurige tokens.
- Strikte hostname-validatie en normalisatie.
- Geen overname van reeds gekoppelde domeinen.
- Verificatie, SSL-status en provisioning-status afzonderlijk bijhouden.
- Veilige afhandeling van mislukte of verlopen verificaties.
- Tenant-scoped branding en routing.

## Technische uitrol

1. Audit van bestaande `CalendarEvent`, `MailIdentity`, `MailLog`, `MailRoute` en `CustomDomain` modellen en routes.
2. Centrale tenant-/membership- en permission-checks hergebruiken.
3. Agenda-API's en server actions beveiligen en tijdzonegedrag standaardiseren.
4. E-mailverzending centraliseren achter één gecontroleerde service.
5. Provider-webhooks idempotent en tenantveilig maken.
6. Custom-domain lifecycle implementeren: pending → verified → active/failed.
7. UI voor agenda, e-mailinstellingen en domeinbeheer toevoegen of harmoniseren.
8. Integratie-, autorisatie-, validatie- en regressietests toevoegen.
9. CI uitvoeren en pas daarna de fase als afgerond markeren.

## Definition of Done

- Alle drie de onderdelen zijn server-side tenant-scoped.
- Onbevestigde afzenders en domeinen kunnen niet actief worden gebruikt.
- Agenda-, e-mail- en domeinroutes hebben expliciete autorisatiechecks.
- Webhooks zijn idempotent en lekken geen tenantgegevens.
- Tijdzones, hostname-validatie en inputvalidatie zijn getest.
- Cross-tenant regressietests zijn groen.
- CI is groen op de uiteindelijke commit.
