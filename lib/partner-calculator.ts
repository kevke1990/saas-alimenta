import { calculatePartnerSupportCapacity, type SupportCapacityInput } from "./support-engine";
import { getIndexationFactor, getNormSet, type NormYear } from "./norms";
import { getCumulativeIndexationFactor } from "./indexation";

export const PARTNER_ENGINE_VERSION = "2.1.0";

export type PartnerSupportInput = {
  marriageNBGI: number;
  childShareDuringMarriage?: number;
  payer: SupportCapacityInput;
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

export function calculatePartnerSupport(input: PartnerSupportInput): PartnerSupportResult {
  if (!Number.isFinite(input.marriageNBGI) || input.marriageNBGI < 0) throw new Error("NBGI tijdens huwelijk is ongeldig.");
  if (!Number.isFinite(input.recipientCurrentNBI) || input.recipientCurrentNBI < 0) throw new Error("Huidig NBI van de onderhoudsgerechtigde is ongeldig.");
  if (input.indexationFromYear !== undefined && input.indexationYear === undefined) throw new Error("Een bronjaar voor indexering vereist ook een eindjaar.");
  if (input.indexationFromYear !== undefined && input.indexationFactor !== undefined) throw new Error("Gebruik voor samengestelde wettelijke indexering een bronjaar of een handmatige factor, niet beide.");

  const normYear = input.normYear ?? 2026;
  const normSet = getNormSet(normYear);
  const marriageNBGI = num(input.marriageNBGI);
  const childShare = num(input.childShareDuringMarriage);
  const hofNormBase = Math.max(0, marriageNBGI - childShare);
  const grossNeed = round(hofNormBase * 0.60);
  const recipientCurrentNBI = num(input.recipientCurrentNBI);
  const recipientCapacity = num(input.recipientEarningCapacity);
  // The 2026 report treats earning capacity as additional capacity to earn,
  // not as an alternative to current income. See §3.3 and the worked example
  // in chapter 5. The resources available to meet need are therefore current
  // NBI plus any substantiated earning capacity.
  const resources = recipientCurrentNBI + recipientCapacity;
  const additionalNeed = Math.max(0, grossNeed - resources);

  const payerCapacity = calculatePartnerSupportCapacity({
    ...input.payer,
    capacityPercentage: input.payerCapacityPercentage,
  }, normSet);
  const childShareNow = num(input.payerChildSupportShare);
  const otherPartner = num(input.payerOtherPartnerSupport);
  const remaining = Math.max(0, payerCapacity.capacity - childShareNow - otherPartner);
  const net = Math.min(additionalNeed, remaining);

  let factor = 1;
  if (input.indexationFactor !== undefined) factor = input.indexationFactor > 0 ? input.indexationFactor : 1;
  else if (input.indexationFromYear !== undefined && input.indexationYear !== undefined) factor = getCumulativeIndexationFactor(input.indexationFromYear, input.indexationYear);
  else if (input.indexationYear !== undefined) factor = getIndexationFactor(input.indexationYear);

  const warnings: string[] = [
    "De hofnorm is een aanbeveling; de rechter kan op grond van de omstandigheden van het geval afwijken.",
    "Kinderen tot 21 jaar hebben voorrang op partneralimentatie; het opgegeven kinderaandeel is daarom vóór partneralimentatie afgetrokken.",
  ];
  if (normYear !== 2026) warnings.push(`Historische NormSet ${normSet.version} toegepast op de partneralimentatie-berekening.`);
  if (input.indexationFromYear !== undefined && input.indexationYear !== undefined && input.indexationFactor === undefined) warnings.push(`Wettelijke indexering samengesteld van ${input.indexationFromYear} naar ${input.indexationYear} toegepast.`);
  else if (input.indexationYear !== undefined && input.indexationFactor === undefined) warnings.push(`Wettelijke indexering voor ${input.indexationYear} toegepast.`);
  if (recipientCapacity > 0) warnings.push("Verdiencapaciteit van de onderhoudsgerechtigde is als aanvullende bron op het huidige NBI meegenomen; onderbouwing blijft vereist.");
  if (input.payerCapacityPercentage === 0.45) warnings.push("45%-gezinsroute toegepast. Deze route is niet automatisch; de concrete gezinssituatie moet worden onderbouwd.");
  if (additionalNeed === 0) warnings.push("Geen aanvullende behoefte na aftrek van het huidige inkomen/verdiencapaciteit.");
  if (remaining < additionalNeed) warnings.push("De draagkracht van de onderhoudsplichtige beperkt de bijdrage tot onder de aanvullende behoefte.");

  return {
    engineVersion: PARTNER_ENGINE_VERSION,
    normVersion: normSet.version,
    normYear,
    marriageNBGI: round(marriageNBGI),
    childShareDuringMarriage: round(childShare),
    hofNormBase: round(hofNormBase),
    grossNeedBeforeOwnIncome: grossNeed,
    recipientCurrentNBI: round(recipientCurrentNBI),
    recipientEarningCapacity: round(recipientCapacity),
    recipientResources: round(resources),
    additionalNeed: round(additionalNeed),
    payerCapacityBeforeChildren: payerCapacity.capacity,
    payerChildSupportShare: round(childShareNow),
    payerOtherPartnerSupport: round(otherPartner),
    payerRemainingCapacity: round(remaining),
    maximumPartnerSupport: round(Math.min(additionalNeed, remaining)),
    netPartnerSupport: round(net),
    indexedNetPartnerSupport: round(net * factor),
    capacityMethod: payerCapacity.method,
    warnings,
  };
}
