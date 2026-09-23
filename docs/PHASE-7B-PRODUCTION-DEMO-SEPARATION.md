# Productie- en demo-scheiding

Stap 17 maakt de scheiding tussen productie en demo fail-closed zonder de berekeningsengine te wijzigen.

## Productiecontract

Een productieomgeving moet:

- `NODE_ENV=production` gebruiken;
- `DEMO_MODE=false` gebruiken;
- een HTTPS `APP_URL` gebruiken;
- de bestaande PostgreSQL/Prisma-persistentielaag gebruiken;
- uitsluitend runtime-secrets uit de productieomgeving gebruiken.

`deploy/validate-production-env.sh` weigert een productieconfiguratie wanneer demo-modus is ingeschakeld of APP_URL geen HTTPS gebruikt.

## Demo-contract

Demo-data is opt-in. `npm run db:seed:demo` werkt alleen wanneer:

- `DEMO_MODE=true`; en
- `NODE_ENV` niet `production` is.

Hierdoor kan de demo-seed niet per ongeluk tegen een productie-runtime worden uitgevoerd.

## Grenzen

Deze stap introduceert geen tweede database, geen tweede persistence-laag en geen alternatieve berekeningsengine. Demo- en productiefunctionaliteit gebruiken dezelfde applicatie- en berekeningscode; alleen demo-data en demo-activering worden expliciet van productie uitgesloten.

## Release

Deze hardening wijzigt geen productieomgeving. DNS, TLS, databases, migraties en deployment worden pas in de gezamenlijke productie-release uitgevoerd nadat alle hardening-stappen groen zijn.
