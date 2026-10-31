# Merelo Partneralimentatie Engine Architectuur & Harmonisatie

## 1. Doel & Context
In `saas-alimenta` (Merelo) bestaan er momenteel drie bestanden die partneralimentatie (PAL) faciliteren:
1. `lib/partner-engine.ts` (v1.3.0) — De route-compatibele engine met volledige Trema 2024-2026 normen (Buijs model, hofnorm, concrete behoefte, draagkrachtvergelijking, jus-vergelijking, limitering en wettelijke uitzonderingstermijnen).
2. `lib/partner-calculator.ts` (v2.3.0) — Een wrapper/adapter over `partner-engine.ts` die cumulatieve indexering en genormaliseerde inputstructuren (`PartnerSupportInput`/`PartnerSupportResult`) toevoegt voor gecombineerde berekeningen.
3. `lib/partner-alimony-engine.ts` (v0.1.1) — Een beknopte specialistische engine voor situaties waarin de mediator/advocaat een handmatige behoeftegrondslag vaststelt en de draagkracht via `support-engine.ts` (met override-audit) berekend wil hebben.

## 2. Pariteit & Regressieborging
Om regressies te voorkomen zijn deze gescheiden gehouden maar via `lib/partner-engine-parity.test.ts` wiskundig aan elkaar gekoppeld:
- Behoefteberekening (60% hofnorm basis).
- Draagkrachtberekening draagkrachtpercentages (60% vs 45%).
- Fiscale correcties (tariefsaanpassing box 1 aftrek).
- Pariteitstest borgt dat de route-engine en canonieke engine exact identieke euro-uitkomsten genereren voor 2024, 2025 en 2026.

## 3. Aanbevolen Consolidatiestrategie
- `lib/partner-calculator.ts` blijft de canonieke adapter voor `combined-support-calculator.ts`.
- `lib/partner-engine.ts` levert de wiskundige rekenkern met Tremanormen (pure function).
- `lib/partner-alimony-engine.ts` dient uitsluitend als contract voor professionele behoefte-override scenario's.
- Een gezamenlijke barrel export `lib/partner/index.ts` kan op termijn de afzonderlijke paden netjes groeperen zodra legacy case routes zijn gemigreerd.
