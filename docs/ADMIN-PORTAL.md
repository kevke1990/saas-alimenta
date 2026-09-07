# Beheerportaal

Het beheerportaal staat achter het bestaande geheime admin-pad en `requireAdmin`.

## Onderdelen
- **Overzicht:** platform-KPI's, recente klanten en snelle acties.
- **Klanten:** zoeken, plan wijzigen en account blokkeren/deblokkeren.
- **Abonnementen:** handmatige plan-toekenning en Stripe beëindiging aan einde periode.
- **Dossiers:** read-only supportmonitor; geen bypass van berekening/review/approval.
- **Mail:** centrale provider, afzender, reply-to, API-token en webhook secret.
- **Stripe:** status en link naar uitgebreid Stripe-beheer.
- **AI:** provider, model, base URL, encrypted API-key, systeeminstructie, temperature en max tokens.
- **Systeem:** production-readiness signalen.
- **Audit:** beheeracties.

## Security
- Alle muterende acties vereisen same-origin requests, admin-authenticatie en rate limiting.
- Mail- en AI-secrets worden met de bestaande `APP_ENCRYPTION_KEY` versleuteld opgeslagen.
- API responses bevatten uitsluitend boolean `configured`/`hasKey` signalen; nooit secrets.
- Beheeracties worden geaudit.
- Het portaal mag geen berekeningsuitkomst, normversie of approvalstatus rechtstreeks wijzigen.

## AI-guardrail
De centrale AI-configuratie is een providerlaag. AI mag ondersteunende taken uitvoeren, maar de kinderalimentatie-/partneralimentatieberekening, normen, provenance en approval blijven deterministisch en vallen onder de bestaande calculation/review workflow.
