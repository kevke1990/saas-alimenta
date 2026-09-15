# Fase 7A — Tenantisolatie en rollen

## Doel
Alle praktijkgegevens moeten strikt binnen de eigen tenant/praktijk blijven. Rollen bepalen vervolgens welke acties een gebruiker binnen die tenant mag uitvoeren.

## Bestaande basis
- `User` is momenteel de eigenaar van `Client`, `Case`, `Document`, `Task`, `AiRun`, `IncomeFact` en andere praktijkdata via `userId`.
- `lib/auth.ts` valideert de sessie en blokkeert vergrendelde accounts.
- `lib/authorization.ts` bevat de eerste centrale rol- en permission-primitieven.

## Rollen
- `OWNER`: volledige tenantcontrole.
- `ADMIN`: beheer van leden, instellingen en billing.
- `PROFESSIONAL`: dossiers lezen en wijzigen, rapportage.
- `REVIEWER`: dossiers lezen en beoordelen.
- `ASSISTANT`: dossiers en documenten operationeel beheren.
- `READ_ONLY`: alleen lezen en rapportages bekijken.

## Uitrolvolgorde
1. Tenant-/practice-entiteit en lidmaatschapsrelatie toevoegen.
2. Bestaande eigenaardata migreren naar de nieuwe tenantstructuur.
3. Alle server queries en API-routes tenant-scoped maken.
4. Membership checks afdwingen vóór lezen, schrijven, exporteren en verwijderen.
5. Rolbeheer-UI en uitnodigingsflow toevoegen.
6. Autorisatie- en cross-tenant regressietests toevoegen.

## Belangrijk
De huidige `userId`-scoping blijft voorlopig actief als veiligheidsnet. De nieuwe autorisatielaag mag deze bestaande controle niet vervangen voordat de migratie en route-audit volledig zijn afgerond.
