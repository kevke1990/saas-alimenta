# V10 deployment — productie

## Cloudflare

1. Voeg het platformdomein toe aan Cloudflare.
2. Configureer Cloudflare for SaaS.
3. Maak een fallback origin naar de V10 reverse proxy.
4. Maak een API token met alleen de noodzakelijke custom-hostname/SSL rechten.
5. Vul `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN` en `CLOUDFLARE_SAAS_CNAME_TARGET` in.
6. Test met één eigen testdomein.
7. Zet daarna de provisioningfunctie aan voor klanten.

## Mail

1. Maak een Postmark account.
2. Verifieer het platform-/sending-domain.
3. Voeg de benodigde DNS-authenticatie toe.
4. Vul `POSTMARK_SERVER_TOKEN` in.
5. Laat iedere klant zijn gewenste From-domain/provider-identiteit verifiëren.
6. Gebruik nooit een willekeurig From-adres zonder provider-verificatie.

## Database

Draai Prisma migrations vóór de eerste V10-start.

## Belangrijk

Custom domain TLS wordt niet door de Next.js-container afgehandeld. Dat is bewust: de edge-laag
moet certificaten veilig beheren en automatisch vernieuwen. De database bewaart geen TLS-private
keys.

De Cloudflare API token moet als secret worden opgeslagen en nooit in Git of in browsercode.
