import { calculatePartnerSupportCapacity } from './support-engine';

export const PARTNER_ENGINE_VERSION = '1.1.2';
export const PARTNER_NORM_VERSION = '2026.1';
export const PAL_INDEXATION_2026 = 0.046;

type DurationException = 'NONE' | 'CHILD_YOUNGER_THAN_12' | 'LONG_MARRIAGE_PRE_1970' | 'RECEIVER_BORN_1970_OR_EARLIER' | 'AGREEMENT_OR_COURT';

type IncomePeriod = { year: number; grossAnnual?: number; netMonthly?: number; businessProfit?: number; dividends?: number; otherIncome?: number };
type NeedItem = { label: string; monthly: number; necessary?: boolean; source?: string };

export type PartnerSupportInput = {
  historicalNBGI: number;
  historicalChildCosts: number;
  currentChildSupport?: number;
  currentRecipientNBI: number;
  currentPayerNBI: number;
  payerTaxableIncomeAnnual?: number;
  payerAow?: boolean;
  payerIsFamily?: boolean;
  payerHousingCosts?: number;
  payerMortgageInterestTaxBenefitMonthly?: number;
  payerOtherNecessaryCosts?: number;
  payerOtherMaintenance?: number;
  payerCapacityAdjustment?: number;
  recipientVerdiencapaciteit?: number;
  useHofnorm?: boolean;
  concreteNeedNet?: number;
  concreteNeedItems?: NeedItem[];
  historicalDate?: string;
  effectiveDate?: string;
  durationException?: DurationException;
  incomeComparisonEnabled?: boolean;
  indexationPct?: number;
  recipientOtherIncomeMonthly?: number;
  recipientAssetsIncomeMonthly?: number;
  payerAssetsIncomeMonthly?: number;
  payerPensionProvisionMonthly?: number;
  payerOtherMaintenanceObligations?: number;
  payerOwnHome?: boolean;
  payerMortgagePrincipalMonthly?: number;
  payerBusinessProfitAnnual?: number;
  payerBusinessProfitYears?: number[];
  payerBusinessDepreciationAnnual?: number;
  payerBusinessInvestmentAllowanceAnnual?: number;
  payerDividendAnnual?: number;
  payerBox3IncomeAnnual?: number;
  payerVariableIncomeYears?: number[];
  recipientBusinessProfitAnnual?: number;
  recipientBusinessProfitYears?: number[];
  recipientDividendAnnual?: number;
  recipientBox3IncomeAnnual?: number;
};

export type PartnerSupportResult = {
  engineVersion: string; normVersion: string; methodology: string;
  need: { historicalNBGI:number; childCosts:number; availableForPartners:number; hofnormNet:number; indexedNet:number; ownIncome:number; earningCapacity:number; additionalNeedNet:number; additionalNeedGross:number; concreteItemsTotal:number };
  capacity: { base:number; childSupportShare:number; priorMaintenance:number; remainingNet:number; grossedUp:number; taxBenefit:number; method:string; incomeAdjustments:number };
  incomeAnalysis: { payerAdjustedMonthly:number; recipientAdjustedMonthly:number; payerBusinessAverageMonthly:number; payerDividendMonthly:number; recipientBusinessAverageMonthly:number; recipientDividendMonthly:number; assetsIncomePayer:number; assetsIncomeRecipient:number };
  incomeComparison: { enabled:boolean; recipientDisposableBefore:number; recipientDisposableAfter:number; payerDisposableAfter:number; limitingAmountNet:number|null; applied:boolean };
  duration: { exception:DurationException; maximumYears:number|null; startDate:string|null; notes:string[] };
  result: { monthlyNet:number; monthlyGross:number; limitedBy:'NEED'|'CAPACITY'|'INCOME_COMPARISON'|'NONE'; indexationPct:number };
  steps:Array<{step:number;title:string;value:number;formula:string}>; warnings:string[]; disclaimer:string;
};

const n=(v:unknown)=>Math.max(0,Number.isFinite(Number(v))?Number(v):0);
const signed=(v:unknown)=>Number.isFinite(Number(v))?Number(v):0;
const r=(v:number)=>Math.round(Math.max(0,v) + 1e-9);
const avg=(xs:number[])=>xs.length?xs.reduce((a,b)=>a+n(b),0)/xs.length:0;

function grossUpBuijs(net:number,taxableAnnual:number,aow=false){
  const target=n(net); if(!target)return{gross:0,taxBenefit:0,method:'BUIJS_2026'};
  const income=n(taxableAnnual);
  const rate1=aow?0.1785:0.3575, rate2=0.3756, threshold=38883, next=78426;
  const marginal=income<threshold?rate1:income<next?rate2:0.495;
  const gross=target/Math.max(.0001,1-marginal);
  return{gross:r(gross),taxBenefit:r(gross-target),method:'BUIJS_2026'};
}

function maxDuration(ex:DurationException='NONE'){
  if(ex==='AGREEMENT_OR_COURT')return{years:null,notes:['Duur is expliciet door partijen/rechter bepaald; controleer de beschikking/overeenkomst.']};
  if(ex==='CHILD_YOUNGER_THAN_12')return{years:12,notes:['Uitzonderingsroute geselecteerd: jongste kind jonger dan 12 jaar. Controleer de exacte wettelijke einddatum.']};
  if(ex==='LONG_MARRIAGE_PRE_1970')return{years:12,notes:['Overgangsroute geselecteerd. Controleer huwelijk-, geboorte- en einddatum.']};
  if(ex==='RECEIVER_BORN_1970_OR_EARLIER')return{years:10,notes:['Overgangsroute geselecteerd. Controleer de wettelijke voorwaarden.']};
  return{years:5,notes:['Hoofdregel: maximaal 5 jaar, behoudens wettelijke uitzonderingen.']};
}

function annualBusinessAverage(annual:number|undefined, years:number[]|undefined){
  const raw=years&&years.length?years:[annual||0];
  const values=raw.map(n);
  return values.length?avg(values):0;
}

export function validatePartnerSupportInput(input: PartnerSupportInput): string[] {
  const warnings: string[] = [];
  if (n(input.historicalNBGI) === 0) warnings.push('Historisch NBGI ontbreekt.');
  if (n(input.historicalChildCosts) > n(input.historicalNBGI)) warnings.push('Historische kinderkosten zijn hoger dan het historische NBGI; controleer de periode en bron.');
  if (input.historicalDate && input.effectiveDate && new Date(input.effectiveDate) < new Date(input.historicalDate)) warnings.push('Ingangsdatum ligt vóór de historische peildatum; controleer de tijdlijn.');
  if (input.payerBusinessProfitYears?.some(v => Number(v) < 0)) warnings.push('Negatieve ondernemersresultaten zijn aanwezig; controleer verliesjaren handmatig.');
  if (input.payerVariableIncomeYears?.some(v => Number(v) < 0)) warnings.push('Negatieve variabele inkomenscomponenten zijn aanwezig; controleer de bron en fiscale verwerking.');
  if (input.concreteNeedItems?.some(x => !String(x.label||'').trim())) warnings.push('Een concrete behoeftepost heeft geen omschrijving.');
  return warnings;
}

export function calculatePartnerSupport(input:PartnerSupportInput):PartnerSupportResult {
  const validationWarnings=validatePartnerSupportInput(input);
  const historicalNBGI=n(input.historicalNBGI), childCosts=n(input.historicalChildCosts);
  const available=Math.max(0,historicalNBGI-childCosts);
  const concreteItemsTotal=(input.concreteNeedItems||[]).reduce((sum,x)=>sum+n(x.monthly),0);
  const hofnorm=input.useHofnorm===false ? Math.max(n(input.concreteNeedNet),concreteItemsTotal) : r(available*.60);
  const indexation=Number.isFinite(Number(input.indexationPct))?Number(input.indexationPct):PAL_INDEXATION_2026;
  const years=input.effectiveDate&&input.historicalDate?Math.max(0,new Date(input.effectiveDate).getFullYear()-new Date(input.historicalDate).getFullYear()):0;
  const indexed=r(hofnorm*Math.pow(1+indexation,years));

  const recipientBusinessAverageMonthly=annualBusinessAverage(input.recipientBusinessProfitAnnual,input.recipientBusinessProfitYears)/12;
  const payerBusinessAverageMonthly=annualBusinessAverage(input.payerBusinessProfitAnnual,input.payerBusinessProfitYears)/12;
  const recipientDividendMonthly=n(input.recipientDividendAnnual)/12;
  const payerDividendMonthly=n(input.payerDividendAnnual)/12;
  const assetsIncomeRecipient=n(input.recipientAssetsIncomeMonthly)+n(input.recipientBox3IncomeAnnual)/12;
  const assetsIncomePayer=n(input.payerAssetsIncomeMonthly)+n(input.payerBox3IncomeAnnual)/12;
  const ownIncome=n(input.currentRecipientNBI)+n(input.recipientOtherIncomeMonthly)+recipientBusinessAverageMonthly+recipientDividendMonthly+assetsIncomeRecipient;
  const earning=n(input.recipientVerdiencapaciteit);
  const additionalNeed=Math.max(0,indexed-ownIncome-earning);

  const variableAverageMonthly=avg(input.payerVariableIncomeYears||[])/12;
  const pension=n(input.payerPensionProvisionMonthly);
  const mortgageInterestBenefit=n(input.payerMortgageInterestTaxBenefitMonthly);
  const payerAdjusted=n(input.currentPayerNBI)+payerBusinessAverageMonthly+payerDividendMonthly+assetsIncomePayer+variableAverageMonthly+mortgageInterestBenefit;
  const otherMaintenance=n(input.payerOtherMaintenance)+n(input.payerOtherMaintenanceObligations);
  const cap=calculatePartnerSupportCapacity({nbi:payerAdjusted,aow:input.payerAow,housingCosts:input.payerHousingCosts,specialNecessaryCosts:n(input.payerOtherNecessaryCosts)+pension,otherMaintenance,capacityAdjustment:signed(input.payerCapacityAdjustment),childCount:1,isCareParent:false});
  const childSupportShare=n(input.currentChildSupport);
  const incomeAdjustments=payerAdjusted-n(input.currentPayerNBI)+mortgageInterestBenefit;
  const remaining=Math.max(0,cap.capacity-childSupportShare);
  const grossed=grossUpBuijs(remaining,input.payerTaxableIncomeAnnual??payerAdjusted*12,!!input.payerAow);
  const desiredNet=Math.min(additionalNeed,remaining);

  let incomeComparison={enabled:!!input.incomeComparisonEnabled,recipientDisposableBefore:ownIncome,recipientDisposableAfter:ownIncome+desiredNet,payerDisposableAfter:Math.max(0,payerAdjusted-desiredNet),limitingAmountNet:null as number|null,applied:false};
  if(incomeComparison.enabled&&incomeComparison.recipientDisposableAfter>incomeComparison.payerDisposableAfter){incomeComparison.limitingAmountNet=r((payerAdjusted-ownIncome)/2);incomeComparison.applied=true;}
  const finalNet=incomeComparison.applied?Math.min(desiredNet,incomeComparison.limitingAmountNet??desiredNet):desiredNet;
  const finalGross=grossUpBuijs(finalNet,input.payerTaxableIncomeAnnual??payerAdjusted*12,!!input.payerAow);
  const limitedBy=finalNet<=0?'NONE':incomeComparison.applied&&finalNet<desiredNet?'INCOME_COMPARISON':additionalNeed<=remaining?'NEED':'CAPACITY';
  const duration=maxDuration(input.durationException);
  const warnings:string[]=[...validationWarnings];
  if(!historicalNBGI)warnings.push('Historisch NBGI ontbreekt; de hofnorm kan niet betrouwbaar worden vastgesteld.');
  if(input.useHofnorm===false&&!input.concreteNeedNet&&!concreteItemsTotal)warnings.push('Concrete behoefte gekozen zonder onderbouwd bedrag of behoefteposten.');
  if(earning>0)warnings.push('Verdiencapaciteit is een professionele correctie en vereist onderbouwing.');
  if(input.payerBusinessProfitAnnual||input.payerBusinessProfitYears?.length)warnings.push('Ondernemersinkomen is als meerjarig gemiddelde verwerkt; controleer fiscale winst, privé-opnamen, continuïteit en beschikbare kasstromen.');
  if(input.payerDividendAnnual||input.payerBox3IncomeAnnual)warnings.push('Vermogens-/dividendinkomen is als signaal meegenomen; beoordeel of het daadwerkelijk als draagkracht beschikbaar is.');
  if(input.payerOwnHome)warnings.push('Eigen woning: controleer hypotheekrente, fiscale verwerking, overwaarde/restschuld en eventuele voormalige echtelijke woning afzonderlijk.');
  if(pension>0)warnings.push('Pensioen-/lijfrentepremie is als noodzakelijke last ingevoerd; redelijkheid en reeds getroffen voorzieningen moeten worden beoordeeld.');
  if(incomeComparison.enabled)warnings.push('Inkomensvergelijking is een aanvullende redelijkheidstoets; het resultaat is geen automatische wettelijke rekensleutel.');
  if(input.durationException&&input.durationException!=='NONE')warnings.push('Een uitzonderingsduur is geselecteerd; controleer de wettelijke voorwaarden handmatig.');

  return {engineVersion:PARTNER_ENGINE_VERSION,normVersion:PARTNER_NORM_VERSION,methodology:'Partneralimentatie 2026 — behoefte/hofnorm, eigen inkomen en verdiencapaciteit, complexe inkomenscomponenten, draagkracht na kinderalimentatie, inkomensvergelijking, brutering en duur',
    need:{historicalNBGI:r(historicalNBGI),childCosts:r(childCosts),availableForPartners:r(available),hofnormNet:r(hofnorm),indexedNet:r(indexed),ownIncome:r(ownIncome),earningCapacity:r(earning),additionalNeedNet:r(additionalNeed),additionalNeedGross:grossUpBuijs(additionalNeed,input.payerTaxableIncomeAnnual??payerAdjusted*12,!!input.payerAow).gross,concreteItemsTotal:r(concreteItemsTotal)},
    capacity:{base:cap.capacity,childSupportShare:r(childSupportShare),priorMaintenance:r(otherMaintenance),remainingNet:r(remaining),grossedUp:grossed.gross,taxBenefit:grossed.taxBenefit,method:grossed.method,incomeAdjustments:r(incomeAdjustments)},
    incomeAnalysis:{payerAdjustedMonthly:r(payerAdjusted),recipientAdjustedMonthly:r(ownIncome),payerBusinessAverageMonthly:r(payerBusinessAverageMonthly),payerDividendMonthly:r(payerDividendMonthly),recipientBusinessAverageMonthly:r(recipientBusinessAverageMonthly),recipientDividendMonthly:r(recipientDividendMonthly),assetsIncomePayer:r(assetsIncomePayer),assetsIncomeRecipient:r(assetsIncomeRecipient)},
    incomeComparison,result:{monthlyNet:r(finalNet),monthlyGross:finalGross.gross,limitedBy,indexationPct:indexation},duration:{exception:input.durationException||'NONE',maximumYears:duration.years,startDate:input.effectiveDate||null,notes:duration.notes},
    steps:[{step:1,title:'Huwelijksgerelateerde behoefte',value:r(hofnorm),formula:input.useHofnorm===false?'Concrete behoefte / behoefteposten':'60% × (historisch NBGI − kosten kinderen)'},{step:2,title:'Indexatie',value:r(indexed),formula:`${(indexation*100).toFixed(1)}% per jaar`},{step:3,title:'Eigen inkomen & verdiencapaciteit',value:r(ownIncome+earning),formula:'Actueel inkomen + onderbouwde verdiencapaciteit'},{step:4,title:'Aanvullende behoefte',value:r(additionalNeed),formula:'Geïndexeerde behoefte − eigen inkomen − verdiencapaciteit'},{step:5,title:'Draagkracht vóór PAL',value:cap.capacity,formula:'60% draagkrachtruimte; complexe inkomenscomponenten afzonderlijk zichtbaar'},{step:6,title:'Kinderalimentatie eerst',value:r(childSupportShare),formula:'Aandeel kinderkosten in mindering vóór PAL'},{step:7,title:'Resterende PAL-draagkracht',value:r(remaining),formula:'Draagkracht − kinderalimentatie'},{step:8,title:'Inkomensvergelijking',value:incomeComparison.applied?r(incomeComparison.limitingAmountNet||0):r(finalNet),formula:incomeComparison.enabled?'Aanvullende vergelijking besteedbaar inkomen':'Niet toegepast'},{step:9,title:'Brutering',value:finalGross.gross,formula:'Fiscaal voordeel volgens 2026-model'}],warnings,disclaimer:'Professionele rekenondersteuning. De aanbevelingen van de Expertgroep Alimentatienormen zijn geen wet; individuele omstandigheden kunnen een afwijkende uitkomst rechtvaardigen.'};
}
