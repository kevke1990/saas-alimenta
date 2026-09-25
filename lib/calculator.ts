import { NORM_SETS, getNormSet, getNormYearForDate, getWsfPeriod, NORM_VERSION } from "./norms";
import type { NormYear, NormSet } from "./norms";
import { calculateIncome, type IncomeProfile, type IncomeResult } from "./income-engine";
import { calculateChildSupportCapacity } from "./support-engine";
import { roundCurrency, roundWholeEuro, ROUNDING_POLICY } from "./calculation-rounding";

export const ENGINE_VERSION = "1.4.0";
type Residence = "A" | "B" | "50-50";
export type Child = { age: number; specialCosts?: number; residence?: Residence; studentType?: "MBO" | "HBO" | "OTHER"; livesAtHome?: boolean; ownIncome?: number; studyGrant?: number };
export type HistoricalNBGIStatus = "HISTORICAL_ENTERED" | "DERIVED_INDICATIVE";
export type HistoricalCalculationPeriod = { nbgi?: number; kgbIncluded: boolean; calculationDate?: string; effectiveDate?: string; source?: { type: string; id?: string; label?: string }; historicalKGB?: number; historicalIncomeSources?: Array<Record<string, unknown>>; historicalNeed?: number };
export type NewPartnerInput = { present: boolean; name?: string; relationship?: string; monthlyNbi?: number; selfSupporting?: boolean; maintenanceObligation?: boolean; includedInCalculation?: boolean; children?: Array<{ id?: string; label?: string; age?: number; livesAtHome?: boolean; monthlyAmount?: number; active?: boolean }> };
export type Parent = { nbi: number; kgb?: number; aow?: boolean; housingCosts?: number; specialNecessaryCosts?: number; otherMaintenance?: number; careDaysPerWeek?: number; receivesBijstand?: boolean; stepParentLiable?: boolean; capacityAdjustment?: number; income?: IncomeProfile; newPartner?: NewPartnerInput };
export type CaseInput = { historicalNBGI?: number; historicalPeriod?: HistoricalCalculationPeriod; historicalNeed?: number; historicalIncomeSources?: Array<Record<string, unknown>>; historicalKGB?: number; parents: Parent[]; children: Child[]; actualKgbReceivingParent?: number; indexation?: number; normYear?: NormYear; calculationDate?: string };

const n = (v: number | undefined | null) => Math.max(0, Number.isFinite(v as number) ? Number(v) : 0);
const money = (v: number) => roundWholeEuro(Math.max(0, v));
function interpolate(x: number, xs: number[], ys: number[]) { if (x <= xs[0]) return ys[0]; if (x >= xs[xs.length - 1]) return ys[ys.length - 1]; for (let i = 0; i < xs.length - 1; i += 1) { if (x >= xs[i] && x <= xs[i + 1]) { const t = (x - xs[i]) / (xs[i + 1] - xs[i]); return ys[i] + t * (ys[i + 1] - ys[i]); } } return ys[ys.length - 1]; }
function childNeedForNorm(nbgi: number, count: number, special: number, normSet: NormSet) { const row = normSet.needTable[Math.min(Math.max(count, 1), 4)]; return money(interpolate(n(nbgi), normSet.needIncomePoints, row) + n(special)); }
export function childNeed(nbgi: number, count: number, special = 0, normYear: NormYear = 2026) { return childNeedForNorm(nbgi, count, special, getNormSet(normYear)); }
export function studentNeed(child: Child, normSet: NormSet, calculationDate?: string) { if (child.age < 18 || child.age > 21) return null; if (!calculationDate) throw new Error("Voor een jongmeerderjarige is de reken-/ingangsdatum verplicht, omdat de WSF-norm per periode kan wijzigen."); const period = getWsfPeriod(normSet, calculationDate); const group = child.studentType === "HBO" ? period.hbo : period.mbo; const living = child.livesAtHome ? group.home : group.away; return money(living + group.tuition - n(child.ownIncome) - n(child.studyGrant)); }
export function capacity(parent: Parent, normYear: NormYear = 2026) { return calculateChildSupportCapacity(parent, getNormSet(normYear)).capacity; }
export function careDiscountPercentage(daysPerWeek: number) { const d = Math.max(0, Math.min(7, n(daysPerWeek))); if (d < 1) return 0.05; if (d < 2) return 0.15; if (d < 3) return 0.25; return 0.35; }
export function careDiscount(need: number, daysPerWeek: number) { return money(need * careDiscountPercentage(daysPerWeek)); }
function validate(input: CaseInput) { if (!input || !Array.isArray(input.parents) || input.parents.length !== 2) throw new Error("Er moeten precies twee onderhoudsplichtige ouders worden ingevoerd."); if (!Array.isArray(input.children) || input.children.length === 0) throw new Error("Minimaal één kind vereist."); if (input.children.length > 10) throw new Error("Maximaal 10 kinderen per berekening."); for (const [i, p] of input.parents.entries()) { if (!Number.isFinite(p.nbi) || p.nbi < 0) throw new Error("NBI ouder " + (i + 1) + " is ongeldig."); if ((p.careDaysPerWeek ?? 0) < 0 || (p.careDaysPerWeek ?? 0) > 7) throw new Error("Zorgdagen ouder " + (i + 1) + " moeten tussen 0 en 7 liggen."); } }
function residenceParent(child: Child): number | null { if (child.residence === "A") return 0; if (child.residence === "B") return 1; return null; }
function careParentForChild(child: Child, parentIndex: number) { const resident = residenceParent(child); if (resident === null) return true; return resident !== parentIndex; }

export function calculate(input: CaseInput) {
  validate(input);
  const normYear = input.normYear ?? (input.calculationDate ? getNormYearForDate(input.calculationDate) : 2026);
  const normSet = getNormSet(normYear);
  const childCount = input.children.length;
  const historicalPeriod = input.historicalPeriod;
  if (historicalPeriod && !historicalPeriod.kgbIncluded) throw new Error("Het historische NBGI-object moet aangeven dat het relevante KGB al in het NBGI is verwerkt.");
  const explicitHistoricalNBGI = historicalPeriod?.nbgi ?? input.historicalNBGI;
  const suppliedNBGI = explicitHistoricalNBGI !== undefined && Number(explicitHistoricalNBGI) > 0 ? roundWholeEuro(Number(explicitHistoricalNBGI)) : null;
  const incomeResults: (IncomeResult | null)[] = input.parents.map(p => p.income ? calculateIncome(p.income) : null);
  const currentNBI = input.parents.map((p, i) => money(incomeResults[i]?.nbiMonthly ?? p.nbi));
  const currentKGB = input.parents.map(p => money(n(p.kgb)));
  const calculatedNBGI = roundWholeEuro(input.parents.reduce((sum, p, i) => sum + (incomeResults[i]?.nbiIncludingKgbMonthly ?? (n(p.nbi) + n(p.kgb))), 0));
  const historicalNBGIStatus: HistoricalNBGIStatus = suppliedNBGI !== null ? "HISTORICAL_ENTERED" : "DERIVED_INDICATIVE";
  const historicalNBGIForNeed = suppliedNBGI ?? calculatedNBGI;
  const historicalNeed = input.historicalPeriod?.historicalNeed ?? input.historicalNeed;
  const minorCount = input.children.filter(c => c.age < 18).length;
  const minorTableTotal = minorCount > 0 ? (historicalNeed !== undefined ? money(historicalNeed) : childNeedForNorm(historicalNBGIForNeed, minorCount, 0, normSet)) : 0;
  const minorBase = minorCount > 0 ? minorTableTotal / minorCount : 0;
  const childResults = input.children.map((child, index) => {
    const student = studentNeed(child, normSet, input.calculationDate);
    const isYoungAdult = child.age >= 18 && child.age <= 21;
    const rawNeed = isYoungAdult ? (student as number) : minorBase + n(child.specialCosts);
    return { childIndex: index + 1, age: child.age, residence: child.residence || "A", isYoungAdult, baseNeed: roundCurrency(isYoungAdult ? rawNeed : minorBase), need: roundCurrency(rawNeed), needSource: isYoungAdult ? "WSF_" + normYear : historicalNeed !== undefined ? "HISTORICAL_NEED_" + normYear : "NEED_TABLE_" + normYear, specialCosts: n(child.specialCosts), ownIncome: n(child.ownIncome), studyGrant: n(child.studyGrant) };
  });
  const minorIndexes = childResults.map((c, i) => c.age < 18 ? i : -1).filter(i => i >= 0);
  if (minorIndexes.length) { const target = minorTableTotal + minorIndexes.reduce((sum, i) => sum + n(childResults[i].specialCosts), 0); const current = minorIndexes.reduce((sum, i) => sum + childResults[i].need, 0); const delta = target - current; childResults[minorIndexes[minorIndexes.length - 1]].need = Math.max(0, childResults[minorIndexes[minorIndexes.length - 1]].need + delta); }
  const totalNeed = roundCurrency(childResults.reduce((sum, c) => sum + c.need, 0));
  const parentResults = input.parents.map((parent, parentIndex) => {
    const hasCareResidence = input.children.some(c => residenceParent(c) === parentIndex);
    const partner = parent.newPartner;
    const partnerRelationshipIsFormal = partner?.relationship === "MARRIED" || partner?.relationship === "REGISTERED_PARTNERSHIP";
    const qualifyingStepChildren = partnerRelationshipIsFormal
      ? (partner?.children ?? []).filter(c => c.active !== false && c.age !== undefined && c.age !== null && String(c.age).trim() !== "" && n(c.age) < 21 && c.livesAtHome !== false)
      : [];
    const stiefchildMaintenance = qualifyingStepChildren.reduce((sum, child) => sum + n(child.monthlyAmount), 0);
    const explicitOtherMaintenance = n(parent.otherMaintenance);
    const effectiveOtherMaintenance = explicitOtherMaintenance + stiefchildMaintenance;
    const capResult = calculateChildSupportCapacity({
      ...parent,
      nbi: incomeResults[parentIndex]?.nbiMonthly ?? parent.nbi,
      otherMaintenance: effectiveOtherMaintenance,
      isCareParent: hasCareResidence
    }, normSet);
    return {
      parentIndex,
      nbi: money(incomeResults[parentIndex]?.nbiMonthly ?? parent.nbi),
      kgb: money(n(parent.kgb)),
      income: incomeResults[parentIndex],
      capacity: capResult.capacity,
      careDaysPerWeek: n(parent.careDaysPerWeek),
      careDiscountPctByChild: childResults.map(c => careParentForChild(input.children[c.childIndex - 1], parentIndex) ? careDiscountPercentage(n(parent.careDaysPerWeek)) : 0),
      capacityMethod: capResult.method,
      capacityNormYear: capResult.normYear,
      otherMaintenance: money(explicitOtherMaintenance),
      stiefchildMaintenance: money(stiefchildMaintenance),
      effectiveOtherMaintenance: money(effectiveOtherMaintenance)
    };
  });
  const totalCapacity = parentResults.reduce((sum, p) => sum + p.capacity, 0);
  const capacitySufficient = totalCapacity >= totalNeed;
  const allocatable = Math.min(totalNeed, totalCapacity);
  const childAllocations = childResults.map(child => {
    const target = roundCurrency(allocatable * child.need / Math.max(totalNeed, 1));
    const rawShares = parentResults.map(p => totalCapacity > 0 ? target * p.capacity / totalCapacity : 0);
    const shares = rawShares.map(money);
    const delta = target - shares.reduce((a, b) => a + b, 0);
    if (delta !== 0) { const largest = parentResults.reduce((best, p, i) => p.capacity > parentResults[best].capacity ? i : best, 0); shares[largest] = Math.max(0, shares[largest] + delta); }
    const sourceChild = input.children[child.childIndex - 1];
    const careDiscounts = parentResults.map((p, i) => careParentForChild(sourceChild, i) ? money(child.baseNeed * careDiscountPercentage(p.careDaysPerWeek)) : 0);
    return { childIndex: child.childIndex, need: child.need, parentShares: shares, careDiscounts };
  });
  const grossCareDiscount = roundCurrency(childAllocations.reduce((sum, c) => sum + Math.max(...c.careDiscounts), 0));
  const shortfall = money(Math.max(0, totalNeed - totalCapacity));
  const shortfallAdjustment = shortfall > 0 ? roundWholeEuro(shortfall / 2) : 0;
  const appliedCareDiscount = shortfall > 0 ? roundCurrency(Math.max(0, grossCareDiscount - shortfallAdjustment)) : grossCareDiscount;
  const careMultiplier = grossCareDiscount > 0 ? appliedCareDiscount / grossCareDiscount : 1;
  const transfers = input.children.map((child, i) => {
    const allocation = childAllocations[i];
    const resident = residenceParent(child);
    const effectiveCare = allocation.careDiscounts.map(v => money(v * careMultiplier));
    const afterCare = allocation.parentShares.map(share => Math.max(0, share));
    if (!capacitySufficient) {
      const payer = resident === 0 ? 1 : resident === 1 ? 0 : (allocation.parentShares[1] >= allocation.parentShares[0] ? 1 : 0);
      const receiver = payer === 0 ? 1 : 0;
      const payerCapacityShare = totalCapacity > 0 ? roundCurrency(parentResults[payer].capacity * (childResults[i].need / Math.max(totalNeed, 1))) : 0;
      const care = effectiveCare[payer];
      return { childIndex: i + 1, direction: (payer === 0 ? "A" : "B") + "->" + (receiver === 0 ? "A" : "B"), payerIndex: payer, receiverIndex: receiver, grossShare: money(payerCapacityShare), grossCareDiscount: money(allocation.careDiscounts[payer] ?? 0), shortfallCareDiscountAdjustment: money(Math.max(0, (allocation.careDiscounts[payer] ?? 0) - care)), verifiableCareDiscount: money(care), appliedCareDiscount: money(care), careDiscount: money(care), payment: money(Math.max(0, payerCapacityShare - care)), note: careMultiplier === 0 ? "Gezamenlijke draagkracht is onvoldoende en de helft van het tekort is ten minste zo groot als de zorgkorting; de zorgkorting is niet verzilverbaar." : "Gezamenlijke draagkracht is onvoldoende; ieder draagt de helft van het tekort en alleen de resterende zorgkorting wordt toegepast." };
    }
    if (resident !== null) {
      const payer = resident === 0 ? 1 : 0;
      return { childIndex: i + 1, direction: (payer === 0 ? "A" : "B") + "->" + (resident === 0 ? "A" : "B"), payerIndex: payer, receiverIndex: resident, grossShare: allocation.parentShares[payer], grossCareDiscount: money(allocation.careDiscounts[payer] ?? 0), shortfallCareDiscountAdjustment: 0, verifiableCareDiscount: money(effectiveCare[payer]), appliedCareDiscount: money(effectiveCare[payer]), careDiscount: effectiveCare[payer], payment: money(Math.max(0, allocation.parentShares[payer] - effectiveCare[payer])), note: "Zorgkorting in mindering gebracht op het aandeel van de ouder bij wie het kind niet het hoofdverblijf heeft." };
    }
    const net = (afterCare[1] - effectiveCare[1]) - (afterCare[0] - effectiveCare[0]);
    const payer = net >= 0 ? 1 : 0;
    return { childIndex: i + 1, direction: net >= 0 ? "A->B" : "B->A", payerIndex: payer, receiverIndex: payer === 0 ? 1 : 0, grossShare: Math.max(afterCare[0], afterCare[1]), grossCareDiscount: money(Math.max(...allocation.careDiscounts)), shortfallCareDiscountAdjustment: 0, verifiableCareDiscount: money(Math.max(...effectiveCare)), appliedCareDiscount: money(Math.max(...effectiveCare)), careDiscount: Math.max(...effectiveCare), payment: money(Math.abs(net)), note: "50/50: netto overdracht op basis van de berekende aandelen en zorgkosten; professionele beoordeling blijft vereist." };
  });
  const paymentTotals = [0, 0];
  transfers.forEach(t => { paymentTotals[t.payerIndex] += t.payment; });
  const partnerReview = input.parents.map((parent, parentIndex) => {
    const partner = parent.newPartner;
    if (!partner?.present) return { parentIndex, status: "NOT_APPLICABLE", includedInCalculation: false, reasons: [] as string[] };
    const reasons: string[] = [];
    const formalRelationship = partner.relationship === "MARRIED" || partner.relationship === "REGISTERED_PARTNERSHIP";
    const qualifyingStepChildren = formalRelationship
      ? (partner.children ?? []).filter(c => c.active !== false && c.age !== undefined && c.age !== null && String(c.age).trim() !== "" && n(c.age) < 21 && c.livesAtHome !== false)
      : [];
    if (formalRelationship && qualifyingStepChildren.length && partner.monthlyNbi === undefined) reasons.push("PARTNER_NBI_ONTBREEKT");
    if (formalRelationship && qualifyingStepChildren.some(c => n(c.monthlyAmount) <= 0)) reasons.push("STIEFKIND_BIJDRAGE_ONTBREEKT");
    if (formalRelationship && qualifyingStepChildren.length && parent.newPartner?.maintenanceObligation !== true) reasons.push("WETTELIJKE_STIEFOUDER_ONDERHOUDSPLICHT_NIET_GEREGISTREERD");
    if (partner.includedInCalculation === true && partner.maintenanceObligation === undefined) reasons.push("ONDERHOUDSVERPLICHTING_ONDUIDELIJK");
    if (partner.children?.length && partner.includedInCalculation === true && partner.maintenanceObligation !== true) reasons.push("STIEFKINDEREN_MAAR_GEEN_VASTGESTELDE_ONDERHOUDSVERPLICHTING");
    return {
      parentIndex,
      status: reasons.length ? "REVIEW_REQUIRED" : (qualifyingStepChildren.length ? "CALCULATED" : "RECORDED_ONLY"),
      includedInCalculation: partner.includedInCalculation === true,
      legalStepParent: formalRelationship && qualifyingStepChildren.length > 0,
      qualifyingStepChildren: qualifyingStepChildren.map(c => ({ label: c.label ?? null, age: n(c.age), monthlyAmount: money(n(c.monthlyAmount)) })),
      stiefchildMaintenance: money(qualifyingStepChildren.reduce((sum, c) => sum + n(c.monthlyAmount), 0)),
      reasons
    };
  });
  const warnings: string[] = [];
  if (historicalNBGIStatus === "DERIVED_INDICATIVE") { warnings.push("Geen historisch NBGI afzonderlijk vastgelegd; de actuele inkomenssom is uitsluitend als rekenkundige indicatie gebruikt. Dit bedrag is geen vastgesteld historisch NBGI."); warnings.push("REVIEW_REQUIRED: historische behoefte en het historische NBGI moeten afzonderlijk worden geverifieerd voordat de uitkomst definitief wordt gebruikt."); }
  if (historicalNBGIStatus === "HISTORICAL_ENTERED") warnings.push("Het ingevoerde historische NBGI moet het relevante KGB uit de betreffende historische periode al bevatten.");
  if (!capacitySufficient) warnings.push("De gezamenlijke draagkracht is lager dan de berekende behoefte; het tekort is over de ouders verdeeld. De zorgkorting is volgens de " + normYear + "-norm eerst verminderd met de helft van het tekort.");
  if (input.children.some(c => c.age >= 18 && c.age <= 21)) warnings.push("Voor jongmeerderjarigen is de WSF-norm uit de geselecteerde NormSet en periode gebruikt; controleer beurs, eigen inkomsten, concrete studiekosten en de juiste reken-/ingangsdatum.");
  if (input.children.some(c => n(c.specialCosts) > 0)) warnings.push("Bijzondere kindkosten zijn toegevoegd. De zorgkorting wordt berekend over de basisbehoefte en niet over deze aanvullende kosten; controleer de kwalificatie en bewijsstukken.");
  if (input.parents.some(p => n(p.otherMaintenance) > 0)) warnings.push("Andere onderhoudsverplichtingen zijn als capaciteitscorrectie verwerkt; controleer rangorde en toerekening per onderhoudsgerechtigde.");
  input.parents.forEach((parent, parentIndex) => {
    const partner = parent.newPartner;
    const formalRelationship = partner?.relationship === "MARRIED" || partner?.relationship === "REGISTERED_PARTNERSHIP";
    const qualifyingStepChildren = formalRelationship ? (partner?.children ?? []).filter(c => c.active !== false && c.age !== undefined && c.age !== null && String(c.age).trim() !== "" && n(c.age) < 21 && c.livesAtHome !== false) : [];
    if (qualifyingStepChildren.length) {
      warnings.push("Ouder " + (parentIndex + 1) + " is juridisch onderhoudsplichtig voor de geregistreerde stiefkinderen jonger dan 21 jaar; de ingevoerde stiefkindbijdrage is daarom in mindering gebracht op de draagkracht.");
      if (qualifyingStepChildren.some(c => n(c.monthlyAmount) <= 0)) warnings.push("REVIEW_REQUIRED: voor één of meer stiefkinderen ontbreekt een vastgestelde/onderbouwde maandbijdrage. De berekening gebruikt daarom geen geschatte bijdrage.");
    }
  });
  partnerReview.forEach(review => review.reasons.forEach(reason => warnings.push("REVIEW_REQUIRED: nieuwe partner ouder " + (review.parentIndex + 1) + ": " + reason + ".")));
  const historicalCalculation = { calculationDate: input.calculationDate ?? null, normYear, historicalNBGI: suppliedNBGI, historicalKGB: input.historicalKGB ?? historicalPeriod?.historicalKGB ?? null, historicalIncomeSources: input.historicalIncomeSources ?? historicalPeriod?.historicalIncomeSources ?? [], historicalNeed: historicalNeed !== undefined ? money(historicalNeed) : (historicalNBGIStatus === "HISTORICAL_ENTERED" ? money(minorTableTotal) : null), status: historicalNBGIStatus, source: historicalPeriod?.source ?? null, fallbackNBGI: historicalNBGIStatus === "DERIVED_INDICATIVE" ? calculatedNBGI : null };
  const currentCalculation = {
    calculationDate: input.calculationDate ?? null,
    normYear,
    parentA_NBI: currentNBI[0] ?? 0,
    parentA_KGB: currentKGB[0] ?? 0,
    parentB_NBI: currentNBI[1] ?? 0,
    parentB_KGB: currentKGB[1] ?? 0,
    parentA_capacity: parentResults[0]?.capacity ?? 0,
    parentB_capacity: parentResults[1]?.capacity ?? 0,
    parentA_stiefchildMaintenance: parentResults[0]?.stiefchildMaintenance ?? 0,
    parentB_stiefchildMaintenance: parentResults[1]?.stiefchildMaintenance ?? 0,
    combinedCapacity: totalCapacity,
    contribution: money(transfers.reduce((s, t) => s + t.payment, 0))
  };
  const nbgi = historicalNBGIStatus === "HISTORICAL_ENTERED" ? suppliedNBGI! : calculatedNBGI;
  return { engineVersion: ENGINE_VERSION, normVersion: normSet.version, historicalCalculation, currentCalculation, historicalPeriod: historicalPeriod ? { ...historicalPeriod, nbgi: suppliedNBGI ?? undefined } : undefined, methodologyVersion: "KA-" + normYear + "-PRODUCTION", indexation: input.indexation ?? ({2024:0.062,2025:0.065,2026:0.046}[normYear] ?? 0.046), methodology: "Tremanormen " + normYear + " — behoefte, draagkrachtvergelijking, zorgkorting en bijdrage", normYear, nbgi, totalNeed: money(totalNeed), totalCapacity: money(totalCapacity), capacityDeficit: money(Math.max(0, totalNeed - totalCapacity)), capacitySurplus: money(Math.max(0, totalCapacity - totalNeed)), capacitySufficient, parentResults: parentResults.map((p, i) => ({ ...p, sharePct: totalCapacity ? roundCurrency((p.capacity / totalCapacity) * 100) : 0, allocatedNeed: money(childAllocations.reduce((s, c) => s + c.parentShares[i], 0)), totalCareDiscount: money(transfers.reduce((s, t) => s + (t.payerIndex === i ? t.careDiscount : 0), 0)), paymentTotal: paymentTotals[i] })), childResults: childResults.map((c, i) => ({ ...c, parentShares: childAllocations[i].parentShares, careDiscountByParent: childAllocations[i].careDiscounts, grossCareDiscountByParent: childAllocations[i].careDiscounts, payments: transfers[i] })), transfers, careDiscount: { grossCareDiscount, shortfall, shortfallAdjustment, verifiableCareDiscount: appliedCareDiscount, appliedCareDiscount }, partnerReview, calculationSteps: [{ step: 1, title: "Behoefte", value: money(totalNeed), formula: historicalNBGIStatus === "HISTORICAL_ENTERED" ? normYear + " behoefte op basis van afzonderlijk vastgelegd historisch uitgangspunt" : historicalNeed !== undefined ? normYear + " historisch behoeftebedrag afzonderlijk ingevoerd; NBGI blijft indicatief" : normYear + " behoeftetabel/WSF met indicatief afgeleid NBGI" }, { step: 2, title: "Draagkracht", value: money(totalCapacity), formula: normYear + " draagkrachttabel/formule per ouder op basis van actuele gegevens" }, { step: 3, title: "Draagkrachtvergelijking", value: money(allocatable), formula: "eigen draagkracht / gezamenlijke draagkracht × behoefte" }, { step: 4, title: "Zorgkorting", value: money(appliedCareDiscount), formula: "bruto zorgkorting − helft tekort, begrensd op minimaal € 0; bij voldoende draagkracht is de bruto zorgkorting volledig verzilverbaar" }, { step: 5, title: "Bijdrage", value: money(transfers.reduce((s, t) => s + t.payment, 0)), formula: "aandeel ouder minus toepasselijke, verzilverbare zorgkorting" }], incomeResults, warnings, warning: "Indicatieve professionele rekenslag. De Expertgroep Alimentatie benadrukt dat de aanbevelingen geen wet zijn en dat individuele omstandigheden tot afwijkingen kunnen leiden.", audit: { roundedToWholeEuros: true, inputParents: input.parents.length, inputChildren: input.children.length, roundingPolicy: ROUNDING_POLICY, historicalNBGIStatus } };
}
export { NORM_VERSION };