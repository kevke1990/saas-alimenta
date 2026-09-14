# Partneranalyse en exports

## Normale dossierweergave

De applicatie toont dossierinformatie standaard **niet-geanonimiseerd** aan bevoegde gebruikers. Namen, inkomens, kinderen, bronnen, berekeningsstappen, reviewstatussen en auditgegevens blijven beschikbaar voor de normale professionele dossierbehandeling.

Anonimisering is uitsluitend een expliciete exportoptie voor ontwikkeling, controle, demo's of het delen van testinformatie. De geanonimiseerde export mag nooit de normale dossierweergave vervangen.

## Geanonimiseerde download

Een toekomstige UI-integratie moet een afzonderlijke actie aanbieden, bijvoorbeeld **Download geanonimiseerde berekening**. De actie moet duidelijk aangeven dat:

- de originele berekening en het originele dossier ongewijzigd blijven;
- directe identifiers worden verwijderd of vervangen;
- bedragen, formules en relevante rekenstructuur zoveel mogelijk behouden blijven;
- de download uitsluitend voor ontwikkeling, testdata en controle is;
- de export geen juridisch advies of rechterlijke beslissing is.

## Nieuwe partner

De partneranalyse ondersteunt twee expliciete scenario's:

1. **Draagkracht berekenen**: netto maandinkomen minus basisbehoefte, overige verplichtingen en actieve zorgverplichtingen voor kinderen van de nieuwe partner. De uitkomst is minimaal € 0.
2. **0 draagkracht**: de gebruiker kiest dit scenario expliciet. De partnercapaciteit wordt dan € 0, ook wanneer er inkomen is ingevuld. Ontbrekende inkomensgegevens mogen niet automatisch als 0 draagkracht worden geïnterpreteerd.

## Zorgverplichtingen van de nieuwe partner

Per kind of verplichting kan een maandbedrag worden geregistreerd met een unieke sleutel, omschrijving en een keuze of de verplichting actief wordt meegenomen. Alleen actieve verplichtingen worden in de berekening afgetrokken.

De applicatie moet deze posten afzonderlijk tonen met een uitleg over de bron, periode en onderbouwing. Een ingevoerd bedrag is niet automatisch juridisch vastgesteld; een professional moet de redelijkheid, actualiteit en bewijsstukken beoordelen.

## Professionele uitleg

De uitkomst moet zichtbaar uitleggen:

- welk partnermodel is gekozen;
- welke inkomsten zijn gebruikt;
- welke basisbehoefte is afgetrokken;
- welke overige verplichtingen zijn meegenomen;
- welke zorgverplichtingen voor de kinderen van de nieuwe partner zijn meegenomen;
- waarom de partnercapaciteit eventueel op € 0 is vastgesteld;
- welk deel eventueel aan de hoofdcalculatie wordt toegerekend;
- welke onderdelen nog handmatige professionele controle vereisen.

De partneranalyse is ondersteunend en moet niet worden gepresenteerd als een automatische wettelijke eindbeslissing.
