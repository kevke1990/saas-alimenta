# Migratie V8 → V9

1. Maak een volledige PostgreSQL-backup.
2. Neem `.env` over en voeg de V9 custom-domain variabelen toe.
3. Draai Prisma migrations.
4. Deploy de nieuwe applicatie.
5. Configureer de edge/reverse proxy voor custom hostnames.
6. Test tenant-resolutie met een niet-productiedomein.
7. Test TLS, HSTS, branding en logout.
8. Maak daarna pas custom-domain provisioning beschikbaar voor klanten.

De exacte TLS-provider is bewust niet hardcoded; voor honderden klantdomeinen is managed edge
provisioning doorgaans betrouwbaarder dan losse Certbot-configuraties per klant.
