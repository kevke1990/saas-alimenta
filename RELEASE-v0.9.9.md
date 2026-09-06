# Alimenta Pro v0.9.9 Release

Deze release maakt van documentanalyse een gecontroleerde workflow: AI extraheert, de professional beoordeelt en de deterministische rekenmotor blijft verantwoordelijk voor de berekening.

## Belangrijk
De Gemini Interactions API wordt stateless aangeroepen met `store:false`. Google documenteert document understanding voor PDF en structured outputs voor JSON-schema's. De applicatie valideert de uitkomst aanvullend en vertrouwt AI niet als rekenkundige bron.

## Database
Gebruik na deployment:

```bash
npx prisma db push
npx prisma generate
```

Voor productie hoort dit vóór v1.0 te worden vervangen door beheerde Prisma migrations.
