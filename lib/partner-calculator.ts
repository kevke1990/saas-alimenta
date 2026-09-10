import { calculatePartnerSupportCapacity, type SupportCapacityInput } from "./support-engine";

export const PARTNER_ENGINE_VERSION = "2.0.0";

export type PartnerSupportInput = {
  marriageNBGI: number;
  childShareDuringMarriage?: number;
  payer: SupportCapacityInput;
  recipientCurrentNBI: number;
  recipientEarningCapacity?: number;
  payerChildSupportShare?: number;
  payerOtherPartnerSupport?: number;
  payerCapacityPercentage?: 0.6 | 0.45;
  indexationFactor?: number;
};

export type PartnerSupportResult = {
  engineVersion: string;
  normVersion: "2026.1";
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

/**
 * 2026 partner-alimony calculation following the Expertgroep Alimentatie steps:
 * 1. Hofnorm: 60% of marriage NBGI less the parents' own child-cost share.
 * 2. Deduct the recipient's current income and reasonable earning capacity.
 * 3. Determine payer capacity using the partner-support 60% route (or 45% family route).
 * 4. Child support has priority and is deducted before partner support.
 * 5. The payable amount is capped by both remaining capacity and need.
 */
export function calculatePartnerSupport(input: PartnerSupportInput): PartnerSupportResult {
  if (!Number.isFinite(input.marriageNBGI) || input.marriageNBGI < 0) throw new Error("NBGI tijdens huwelijk is ongeldig.");
  if (!Number.isFinite(input.recipientCurrentNBI) || input.recipientCurrentNBI < 0) throw new Error("Huidig NBI van de onderhoudsgerechtigde is ongeldig.");

  const marriageNBGI = num(input.marriageNBGI);
  const childShare = num(input.childShareDuringMarriage);
  const hofNormBase = Math.max(0, marriageNBGI - childShare);
  const grossNeed = round(hofNormBase * 0.60);
  const recipientCapacity = num(input.recipientEarningCapacity);
  const resources = Math.max(num(input.recipientCurrentNBI), recipientCapacity);
  const additionalNeed = Math.max(0, grossNeed - resources);

  const payerCapacity = calculatePartnerSupportCapacity({
    ...input.payer,
    capacityPercentage: input.payerCapacityPercentage,
  });
  const childShareNow = num(input.payerChildSupportShare);
  const otherPartner = num(input.payerOtherPartnerSupport);
  const remaining = Math.max(0, payerCapacity.capacity - childShareNow - otherPartner);
  const net = Math.min(additionalNeed, remaining);
  const factor = input.indexationFactor && input.indexationFactor > 0 ? input.indexationFactor : 1;

  const warnings: string[] = [
    "De hofnorm is een aanbeveling; de rechter kan op grond van de omstandigheden van het geval afwijken.",
    "Kinderen tot 21 jaar hebben voorrang op partneralimentatie; het opgegeven kinderaandeel is daarom vóór partneralimentatie afgetrokken.",
  ];
  if (recipientCapacity > 0) warnings.push("Verdiencapaciteit van de onderhoudsgerechtigde is als mogelijke eigen bron meegenomen; onderbouwing blijft vereist.");
  if (input.payerCapacityPercentage === 0.45) warnings.push("45%-gezinsroute toegepast. Deze route is niet automatisch; de concrete gezinssituatie moet worden onderbouwd.");
  if (additionalNeed === 0) warnings.push("Geen aanvullende behoefte na aftrek van het huidige inkomen/verdiencapaciteit.");
  if (remaining < additionalNeed) warnings.push("De draagkracht van de onderhoudsplichtige beperkt de bijdrage tot onder de aanvullende behoefte.");

  return {
    engineVersion: PARTNER_ENGINE_VERSION,
    normVersion: "2026.1",
    marriageNBGI: round(marriageNBGI),
    childShareDuringMarriage: round(childShare),
    hofNormBase: round(hofNormBase),
    grossNeedBeforeOwnIncome: grossNeed,
    recipientCurrentNBI: round(input.recipientCurrentNBI),
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
