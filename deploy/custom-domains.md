# V9 — Custom domains / White Label

## UX

Een kantoor kan bijvoorbeeld `alimentatie.jansenfamilierecht.nl` koppelen.
Na verificatie wordt de tenant op basis van de Host-header gevonden en wordt dezelfde applicatie
met de huisstijl van dat kantoor geladen.

## Aanbevolen productiearchitectuur

Gebruik een edge/reverse-proxy die:
1. TLS beëindigt;
2. certificaten automatisch beheert;
3. de Host-header doorgeeft;
4. alleen verkeer naar de interne Next.js-app accepteert.

Voor veel klantdomeinen is een managed edge zoals Cloudflare voor SaaS of een gespecialiseerde
custom-hostname provider praktischer dan voor iedere klant een losse Certbot-configuratie.

De applicatie zelf moet nooit TLS-private-keys in de database opslaan.

## DNS

De klant maakt een CNAME aan naar het door het platform opgegeven target.
Daarna wordt een TXT-record gebruikt voor ownership-verificatie.

Voorbeeld:
- CNAME: `alimentatie.jouwkantoor.nl` → `domains.kinderalimentatiepro.nl`
- TXT: `_kinderalimentatiepro.alimentatie.jouwkantoor.nl` → token uit het dashboard

De exacte CNAME-target moet per productie-infrastructuur worden ingevuld.

## Security

- Verifieer eigendom vóór activering.
- Sta geen platform-eigen domeinen toe.
- Normalizeer en valideer hostnames.
- Gebruik een tenant lookup op een geverifieerd domein.
- Gebruik HSTS op custom domains zodra TLS actief is.
- Houd een auditlog bij van domain add/verify/remove.
- Rate-limit verification.
- Blokkeer Host-header poisoning en onbekende hosts.
