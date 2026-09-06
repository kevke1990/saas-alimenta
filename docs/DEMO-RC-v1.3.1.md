# Alimenta Pro v1.3.1 RC1 — Demo

Deze release candidate is bedoeld om de eerste VPS-demo gecontroleerd te starten.

## Installatie

1. Gebruik een verse Debian 13 VPS.
2. Zorg dat DNS `A/AAAA` voor het gekozen domein naar de VPS wijst.
3. Upload en pak de release uit.
4. Voer uit:

```bash
sudo bash deploy/installer.sh
```

De installer bouwt de app, initialiseert PostgreSQL, voert migrations uit, maakt een fictief demo-dossier aan, configureert Nginx/HTTPS en installeert `alimenta`.

## Demo

RC1 zet `DEMO_MODE=true`. De applicatie toont daarom een duidelijke demo-waarschuwing. Gebruik uitsluitend fictieve persoonsgegevens.

## Controle

```bash
sudo alimenta doctor
sudo alimenta status
sudo alimenta logs 200
```

## Belangrijk

- Gebruik nog geen echte cliëntdossiers op deze RC.
- Stripe/Postmark/AI kunnen bewust leeg blijven tijdens de functionele demo.
- MFA TOTP is beschikbaar; passkeys zijn nog niet de primaire loginmethode.
- Een juridische review en onafhankelijke security review zijn nog geen onderdeel van deze RC.
