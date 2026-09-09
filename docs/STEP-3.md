# Stap 3 — Cliënten en klantnummer

Stap 3 maakt het cliëntbeheer de vaste ingang voor dossiers.

## Gereed

- Nieuwe cliënten krijgen server-side automatisch een uniek klantnummer van exact 6 cijfers.
- Het klantnummer wordt niet meer door de gebruiker ingevoerd.
- Het klantnummer is immutable bij het bewerken van een cliënt.
- Wijzigingen aan cliëntgegevens worden geaudit.
- Nieuwe cliënt- en editpagina gebruiken de professionele AppShell.
- Bestaande autorisatie en tenant-isolatie blijven leidend.

## Ontwerpbesluit

Het klantnummer blijft voorlopig opgeslagen in het bestaande `Client.reference` veld. Daardoor is geen risicovolle database-migratie nodig voor deze stap. De bestaande tenant-scoped unique constraint blijft actief.

## Volgende stap

De cliëntwerkplek wordt verder gekoppeld aan dossier- en berekeningsbeheer, inclusief veilige wijziging/verwijdering van berekeningen en consistente rapportdata.
