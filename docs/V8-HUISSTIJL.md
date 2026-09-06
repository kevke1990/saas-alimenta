# V8 — Eigen huisstijl per klant

## Wat kan een professional instellen?

Iedere betalende organisatie heeft een eigen branding-profiel:

- bedrijfs-/kantoornaam
- eigen logo
- favicon
- primaire kleur
- secundaire kleur
- accentkleur
- tekst- en achtergrondkleur
- lettertype
- eigen rapporttitel
- eigen voettekst voor rapporten
- afzendernaam voor e-mail
- reply-to-adres

## Waar?

Na aanmelden:

`/instellingen/huisstijl`

De instellingen zijn tenant-specifiek: de huisstijl van klant A wordt nooit gebruikt voor klant B.

## Belangrijk voor productie

Logo's mogen niet rechtstreeks als uitvoerbare bestanden worden opgeslagen. Gebruik bij voorkeur object storage/CDN met allowlisting voor PNG/JPEG/WebP/SVG en een maximale bestandsgrootte.

URL's moeten bij voorkeur HTTPS gebruiken. Als uploads worden toegevoegd, valideer MIME-type én bestandsinhoud server-side en hercodeer afbeeldingen waar mogelijk.

## PDF-rapporten

De PDF-renderer moet dezelfde branding-configuratie gebruiken als de webapp. Daardoor kan een professioneel rapport eruitzien als het eigen kantoorproduct, met logo, kleuren, rapporttitel en footer.

## Security

Branding is user-scoped en mag alleen via een geauthenticeerde server-side endpoint worden aangepast. De UI is geen security boundary.

## Productidee

Branding kan als standaardfunctie in alle zakelijke abonnementen zitten. Een later "White Label" add-on kan extra mogelijkheden bieden, zoals:

- volledig eigen domein (`berekening.jouwkantoor.nl`)
- eigen loginpagina
- eigen e-mailtemplates
- volledig eigen PDF-cover
- verbergen van "Kinderalimentatie Pro" in de klantinterface
- eigen supportgegevens
