# V10 — White Label SaaS

## 1. Custom domains die echt werken

V10 gebruikt Cloudflare for SaaS voor custom hostnames. Cloudflare kan voor ieder klantdomein
automatisch SSL-certificaten uitgeven en vernieuwen. De app gebruikt de Cloudflare API om na
ownership-verificatie een custom hostname aan te maken.

Voorbeeld:
`alimentatie.jansenfamilierecht.nl`

Flow:
1. klant voert domein in;
2. platform maakt ownership/TXT-instructie;
3. klant zet DNS-record;
4. platform verifieert;
5. V10 maakt de Cloudflare custom hostname;
6. Cloudflare valideert en activeert TLS;
7. Hostname wordt aan tenant gekoppeld;
8. tenant-branding wordt geladen.

Cloudflare documenteert expliciet dat custom hostnames via API kunnen worden aangemaakt en dat
SSL voor SaaS certificaten automatisch kan provisionen en vernieuwen.

## 2. Agenda

V10 bevat een tenant-geïsoleerde agenda met:
- afspraken;
- cliëntkoppeling;
- start/eindtijd;
- locatie/meeting URL;
- herinnering;
- organisator;
- cliënt-e-mail.

## 3. E-mail vanuit eigen adres

Een kantoor kan bijvoorbeeld verzenden als:

`Jansen Familierecht <info@jansenfamilierecht.nl>`

De applicatie gebruikt hiervoor een transactional mail provider. V10 bevat een Postmark-adapter.
Het domein moet bij de provider worden geverifieerd met de vereiste DNS-authenticatie (DKIM/SPF/
Return-Path waar van toepassing).

## 4. Waarom geen eigen SMTP-server?

Voor een commerciële SaaS is zelf mail afleveren vanaf de VPS onnodig risicovol:
reputatie, SPF/DKIM/DMARC, bounce handling en deliverability worden veel moeilijker.
Een transactional provider is betrouwbaarder en schaalbaarder.

## 5. White-label eindbeeld

Een kantoor krijgt:

`alimentatie.jansenfamilierecht.nl`

met:
- eigen logo;
- eigen kleuren;
- eigen naam;
- eigen rapporten;
- eigen e-mail;
- eigen agenda;
- eigen cliëntportaal.

De platformnaam kan in de normale klantreis volledig naar de achtergrond.

## 6. Productnaam

Mijn voorkeur blijft **Alimenta Pro**.

Mogelijke positionering:

**Alimenta Pro**
_Professionele alimentatieberekeningen. Jouw dossier. Jouw merk._

Alternatieven:
- Draagkracht
- AlimentatieDesk
- AlimentatieFlow
- FamiliCalc
- Alivio
