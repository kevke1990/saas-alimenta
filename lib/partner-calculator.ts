import { calculatePartnerSupport as calculatePartnerSupportRoute } from "./partner-engine";
import { getCumulativeIndexationFactor } from "./indexation";
import { getIndexationFactor, type NormYear } from "./norms";

export const PARTNER_ENGINE_VERSION = "2.3.0";

export type PartnerSupportInput = {
  marriageNBGI: number;
  childShareDuringMarriage?: number;
  payer: any;
  recipientCurrentNBI: number;
  recipientEarningCapacity?: number;
  payerChildSupportShare?: number;
  payerOtherPartnerSupport?: number;
  payerCapacityPercentage?: 0.6 | 0.45;
  normYear?: NormYear;
  indexationFactor?: number;
  indexationYear?: number;
  indexationFromYear?: number;
};

export type PartnerSupportResult = {
  engineVersion: string;
  normVersion: string;
  normYear: NormYear;
  marriageNBGI: number;
  childShareDuringMarriage: number;
  hofNormBase: number;
  grossNeedBeforeOwnIncome: number;
  recipientCurrentNBI: number;
  recipientEarningCapacity: number;
  recipientResources: number;
  additionalNeed: number;
  payerCapacityBeforeChildren: number;
  payerChildSupportShare: number;
  payerOtherPartnerSupport: number;
  payerRemainingCapacity: number;
  maximumPartnerSupport: number;
  netPartnerSupport: number;
  indexedNetPartnerSupport: number;
  capacityMethod: string;
  warnings: string[];
};

const num = (v: unknown) => Math.max(0, Number.isFinite(Number(v)) ? Number(v) : 0);
const round = (v: number) => Math.round(Math.max(0, v) + 1e-9);

function indexationFactor(input: PartnerSupportInput): number {
  if (input.indexationFromYear !== undefined) {
    if (input.indexationYear === undefined) throw new Error("Een bronjaar voor indexering vereist ook een eindjaar.");
    if (input.indexationFactor !== undefined) throw new Error("Gebruik voor samengestelde wettelijke indexering een bronjaar of een handmatige factor, niet beide.");
    return getCumulativeIndexationFactor(input.indexationFromYear, input.indexationYear);
  }
  if (input.indexationFactor !== undefined) return input.indexationFactor > 0 ? input.indexationFactor : 1;
  if (input.indexationYear !== undefined) return getIndexationFactor(input.indexationYear);
  return 1;
}

/**
 * Canonical PAL adapter.
 *
 * There is deliberately no second calculation implementation here. The route
 * PAL engine is the single calculation authority; this module only preserves
 * the older combined-engine contract used by existing callers.
 */
export function calculatePartnerSupport(input: PartnerSupportInput): PartnerSupportResult {
  const normYear = input.normYear ?? 2026;
  const childShareDuringMarriage = num(input.childShareDuringMarriage);
  const payerChildSupportShare = num(input.payerChildSupportShare);
  const payerOtherPartnerSupport = num(input.payerOtherPartnerSupport);

  const routeResult = calculatePartnerSupportRoute({
    historicalNBGI: num(input.marriageNBGI),
    historicalChildCosts: childShareDuringMarriage,
    currentChildSupport: payerChildSupportShare,
    currentRecipientNBI: num(input.recipientCurrentNBI),
    currentPayerNBI: num(input.payer?.nbi),
    payerTaxableIncomeAnnual: input.payer?.taxableIncomeAnnual,
    payerAow: !!input.payer?.aow,
    payerIsFamily: input.payerCapacityPercentage === 0.45,
    payerHousingCosts: input.payer?.housingCosts ?? input.payer?.housing?.monthlyCosts,
    payerMortgageInterestTaxBenefitMonthly: input.payer?.mortgageInterestTaxBenefitMonthly ?? input.payer?.housing?.mortgageInterestTaxBenefitMonthly,
    payerMortgagePrincipalMonthly: input.payer?.mortgagePrincipalMonthly ?? input.payer?.housing?.mortgagePrincipalMonthly,
    payerOtherNecessaryCosts: input.payer?.specialNecessaryCosts,
    payerOtherMaintenance: payerOtherPartnerSupport + num(input.payer?.otherMaintenance),
    payerCapacityAdjustment: input.payer?.capacityAdjustment,
    recipientVerdiencapaciteit: input.recipientEarningCapacity,
    payerAssetsIncomeMonthly: input.payer?.assetsIncomeMonthly,
    payerBox3IncomeAnnual: input.payer?.box3IncomeAnnual,
    payerBusinessProfitAnnual: input.payer?.businessProfitAnnual,
    payerBusinessProfitYears: input.payer?.businessProfitYears,
    payerDividendAnnual: input.payer?.dividendAnnual,
    payerVariableIncomeYears: input.payer?.variableIncomeYears,
    payerPensionProvisionMonthly: input.payer?.pensionProvisionMonthly,
    payerOwnHome: input.payer?.housing?.type === "OWNED",
    recipientOtherIncomeMonthly: input.payer?.recipientOtherIncomeMonthly,
    normYear,
  });

  const factor = indexationFactor(input);
  const indexed = round(routeResult.result.monthlyNet * factor);
  const warnings = [...routeResult.warnings];
  if (normYear !== 2026 && !warnings.some(w => w.includes(routeResult.normVersion))) {
    warnings.push(`Historische NormSet ${normYear} (${routeResult.normVersion}) toegepast op de partneralimentatie-berekening.`);
  }
  if (input.indexationFromYear !== undefined && input.indexationYear !== undefined && input.indexationFactor === undefined) {
    warnings.push(`Wettelijke indexering samengesteld van ${input.indexationFromYear} naar ${input.indexationYear} toegepast.`);
  } else if (input.indexationYear !== undefined && input.indexationFactor === undefined) {
    warnings.push(`Wettelijke indexering voor ${input.indexationYear} toegepast.`);
  }
  if (input.payerCapacityPercentage === 0.45 && !warnings.some(w => w.includes("45%-gezinsroute"))) {
    warnings.push("45%-gezinsroute toegepast. Deze route is niet automatisch; de concrete gezinssituatie moet worden onderbouwd.");
  }
  const recipientResources = routeResult.need.ownIncome + routeResult.need.earningCapacity;
  const capacityMethod = input.payerCapacityPercentage === 0.45 ? "FORMULA_45" : "FORMULA_60";

  return {
    engineVersion: PARTNER_ENGINE_VERSION,
    normVersion: routeResult.normVersion,
    normYear,
    marriageNBGI: round(input.marriageNBGI),
    childShareDuringMarriage: round(childShareDuringMarriage),
    hofNormBase: routeResult.need.availableForPartners,
    grossNeedBeforeOwnIncome: routeResult.need.indexedNet,
    recipientCurrentNBI: round(input.recipientCurrentNBI),
    recipientEarningCapacity: round(num(input.recipientEarningCapacity)),
    recipientResources: round(recipientResources),
    additionalNeed: routeResult.need.additionalNeedNet,
    payerCapacityBeforeChildren: routeResult.capacity.base,
    payerChildSupportShare: routeResult.capacity.childSupportShare,
    payerOtherPartnerSupport: round(payerOtherPartnerSupport),
    payerRemainingCapacity: routeResult.capacity.remainingNet,
    maximumPartnerSupport: routeResult.result.monthlyNet,
    netPartnerSupport: routeResult.result.monthlyNet,
    indexedNetPartnerSupport: indexed,
    capacityMethod,
    warnings,
  };
}
