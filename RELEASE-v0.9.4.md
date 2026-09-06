# Alimenta Pro v0.9.4

## Doel
Een professionelere dossier-naar-resultaat workflow: dossiers terugvinden, resultaten begrijpen, versies controleren en een printbaar rapport openen.

## Deployment
1. Maak een PostgreSQL backup.
2. Pak de release uit in de applicatiemap.
3. Controleer `.env`.
4. Voer `npx prisma db push` en `npx prisma generate` uit.
5. Herbouw/restart de Next.js container.
6. Test login → Dossiers → bestaande berekening → Rapport bekijken → afdrukvoorbeeld.

## Acceptatie
- [ ] `/cases` toont alleen dossiers van de ingelogde gebruiker.
- [ ] Dossiermetadata wordt na een nieuwe berekening opgeslagen.
- [ ] Resultaat toont norm én engine correct.
- [ ] Rapport endpoint weigert dossiers van andere gebruikers.
- [ ] Rapport bevat geen ongescapete dossiernotities of cliëntnamen.
- [ ] Nieuwe calculation snapshots hebben engine `0.9.4`.
- [ ] `db push` succesvol uitgevoerd.
- [ ] Productiebackup vooraf gemaakt.
