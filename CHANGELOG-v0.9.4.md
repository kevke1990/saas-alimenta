# Changelog — v0.9.4

## Added
- `/cases` dossieroverzicht.
- Professioneler resultaatdashboard.
- Afdrukbaar rapport endpoint.
- `Case.metadata` voor ingangsdatum en interne notitie.
- Per ouder uitgesplitste rekenkundige zorgkorting.
- Actieve sidebar-navigatie.

## Changed
- Calculator engine version → `0.9.4`.
- Calculation snapshots nemen de engineversie rechtstreeks uit het calculatorresultaat over.
- Resultaatpagina toont normversie en engineversie afzonderlijk.
- Wizard gebruikt lokale datum in plaats van UTC-datum.

## Important
- De calculator blijft indicatief en is nog geen volledig juridisch gevalideerde Tremanorm-implementatie.
- Het rapport is een printbare HTML-weergave; server-side PDF rendering volgt richting v1.0.
