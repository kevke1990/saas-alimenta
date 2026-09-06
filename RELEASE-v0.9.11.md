# Alimenta Pro v0.9.11

## Calculation Engine Refactor

Deze release legt de technische fundering voor partneralimentatie zonder de bestaande kinderalimentatie-engine inhoudelijk te wijzigen.

### Nieuw
- gedeelde `support-engine.ts`
- aparte child-support capacity primitive
- aparte partner-support capacity primitive
- KGB-isolatie
- 70%-kindcapaciteit behouden
- 60%-partnercapaciteit toegevoegd als funderingscomponent
- regression tests voor de scheiding

### Juridische/rekenkundige basis
Gebaseerd op het Rapport Alimentatienormen 2026 van de Expertgroep Alimentatienormen. Voor partneralimentatie wordt 60% van de draagkrachtruimte gebruikt; het aandeel in de kosten van de kinderen wordt daarna in mindering gebracht. KGB is alleen onderdeel van het draagkracht-schema voor kinderalimentatie.

### Disclaimer
Alimenta Pro is een professioneel reken- en dossiervoeringshulpmiddel. Het neemt geen rechterlijke beslissing en vervangt geen juridische beoordeling.
