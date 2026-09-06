# Kinderalimentatie Pro V9 — Productarchitectuur

## Positionering

V9 maakt van de applicatie een white-label SaaS voor advocaten, mediators, financieel adviseurs
en andere professionals die hun eigen merk willen voeren.

## Magische klantbeleving

Een kantoor koopt een abonnement en koppelt bijvoorbeeld:

`alimentatie.jansenfamilierecht.nl`

De cliënt ziet vervolgens:
- het eigen logo van het kantoor;
- de eigen kleuren;
- de eigen naam;
- de eigen rapportstijl;
- de eigen e-mailafzender;
- het eigen domein.

De centrale productnaam hoeft in de normale klantreis niet zichtbaar te zijn.

## Domein lifecycle

PENDING → DNS ownership check → VERIFIED → TLS PROVISIONING → ACTIVE

De database bewaart alleen de hostname en status; geen TLS-private-key.

## Rollen

- Platform Admin: technisch/commercieel beheer.
- Practice Owner: abonnement, branding, domein, gebruikers.
- Professional: dossiers en berekeningen.
- Client/Invited User: alleen toegewezen intakegegevens.

## Productgrenzen

Een custom domain is geen security boundary. Autorisatie blijft server-side gebaseerd op tenant,
rol en dossierrechten.

## Aanbevolen toekomstige uitbreidingen

- custom domain automatisch provisionen via edge provider API;
- custom e-mail domain;
- cliëntportaal;
- uitnodigingslinks met eenmalige tokens;
- MFA/passkeys;
- SCIM/SAML voor enterprise;
- API/webhooks;
- document signing;
- uitgebreide audit trail;
- automatische normupdates met versiebeheer.
