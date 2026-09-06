import { NEED_TABLE, NBGI_POINTS, CARE_DISCOUNT, NORM_VERSION, WSF_2026 } from "./norms";
import { calculateIncome, type IncomeProfile, type IncomeResult } from "./income-engine";
import { calculateChildSupportCapacity } from "./support-engine";

export const ENGINE_VERSION = "1.0.0";

type Residence = "A" | "B" | "50-50";
export type Child = {
  age: number;
  specialCosts?: number;
  residence?: Residence;
  studentType?: "MBO" | "HBO" | "OTHER";
  livesAtHome?: boolean;
  ownIncome?: number;
  studyGrant?: number;
};

export type Parent = {
  nbi: number;
  kgb?: number;
  aow?: boolean;
  housingCosts?: number;
  specialNecessaryCosts?: number;
  otherMaintenance?: number;
  careDaysPerWeek?: number;
  receivesBijstand?: boolean;
  stepParentLiable?: boolean;
  // Optional: allows a professional to record an actual capacity adjustment.
  capacityAdjustment?: number;
  income?: IncomeProfile;
};

export type CaseInput = {
  historicalNBGI?: number;
  parents: Parent[];
  children: Child[];
  actualKgbReceivingParent?: number;
  indexation?: number;
};

const n = (v: number | undefined | null) => Math.max(0, Number.isFinite(v as number) ? Number(v) : 0);
const round = (v: number) => Math.round(v);
const money = (v: number) => round(Math.max(0, v));

function interpolate(x: number, xs: number[], ys: number[]) {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  for (let i = 0; i < xs.length - 1; i++) {
    if (x >= xs[i] && x <= xs[i + 1]) {
      const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
      return ys[i] + t * (ys[i + 1] - ys[i]);
    }
  }
  return ys[ys.length - 1];
}

/** 2026 table: total eigen aandeel of the children, not a per-child amount. */
export function childNeed(nbgi: number, count: number, special = 0) {
  const row = NEED_TABLE[Math.min(Math.max(count, 1), 4)];
  return money(interpolate(n(nbgi), NBGI_POINTS, row) + n(special));
}

export function studentNeed(child: Child) {
  if (child.age < 18 || child.age > 21) return null;
  const group = child.studentType === "HBO" ? WSF_2026.hbo : WSF_2026.mbo;
  const living = child.livesAtHome ? group.home : group.away;
  // Own income and actual non-repayable study grant can reduce the need.
  return money(living + group.tuition - n(child.ownIncome) - n(child.studyGrant));
}

export function capacity(parent: Parent) {
  return calculateChildSupportCapacity(parent).capacity;
}

export function careDiscountPercentage(daysPerWeek: number) {
  const d = Math.max(0, Math.min(7, n(daysPerWeek)));
  if (d < 1) return 0.05;
  if (d < 2) return 0.15;
  if (d < 3) return 0.25;
  return 0.35;
}

export function careDiscount(need: number, daysPerWeek: number) {
  return money(need * careDiscountPercentage(daysPerWeek));
}

function validate(input: CaseInput) {
  if (!input || !Array.isArray(input.parents) || input.parents.length !== 2) throw new Error("Er moeten precies twee onderhoudsplichtige ouders worden ingevoerd.");
  if (!Array.isArray(input.children) || input.children.length === 0) throw new Error("Minimaal één kind vereist.");
  if (input.children.length > 10) throw new Error("Maximaal 10 kinderen per berekening.");
  for (const [i, p] of input.parents.entries()) {
    if (!Number.isFinite(p.nbi) || p.nbi < 0) throw new Error(`NBI ouder ${i + 1} is ongeldig.`);
    if ((p.careDaysPerWeek ?? 0) < 0 || (p.careDaysPerWeek ?? 0) > 7) throw new Error(`Zorgdagen ouder ${i + 1} moeten tussen 0 en 7 liggen.`);
  }
}

function residenceParent(child: Child): number | null {
  if (child.residence === "A") return 0;
  if (child.residence === "B") return 1;
  return null;
}

function careParentForChild(child: Child, parentIndex: number) {
  const resident = residenceParent(child);
  if (resident === null) return true;
  return resident !== parentIndex;
}

export function calculate(input: CaseInput) {
  validate(input);
  const childCount = input.children.length;

  // For an intact family the historical NBGI is the starting point. It should
  // already include the KGB for the relevant period, as required by the 2026 method.
  const suppliedNBGI = n(input.historicalNBGI);
  const incomeResults: (IncomeResult | null)[] = input.parents.map(p => p.income ? calculateIncome(p.income) : null);
  const calculatedNBGI = round(input.parents.reduce((sum, p, i) => sum + (incomeResults[i]?.nbiIncludingKgbMonthly ?? (n(p.nbi) + n(p.kgb))), 0));
  const nbgi = suppliedNBGI > 0 ? suppliedNBGI : calculatedNBGI;

  const minorCount = input.children.filter(c => c.age < 18).length;
  const minorTableTotal = minorCount > 0 ? childNeed(nbgi, minorCount, 0) : 0;
  const minorBase = minorCount > 0 ? minorTableTotal / minorCount : 0;
  const childResults = input.children.map((child, index) => {
    const student = studentNeed(child);
    const isYoungAdult = child.age >= 18 && child.age <= 21;
    const rawNeed = isYoungAdult ? (student as number) : minorBase + n(child.specialCosts);
    return {
      childIndex: index + 1,
      age: child.age,
      residence: child.residence || "A",
      isYoungAdult,
      baseNeed: money(isYoungAdult ? rawNeed : minorBase),
      need: money(rawNeed),
      needSource: isYoungAdult ? "WSF_2026" : "NEED_TABLE_2026",
      specialCosts: n(child.specialCosts),
      ownIncome: n(child.ownIncome),
      studyGrant: n(child.studyGrant),
    };
  });

  // Keep the distributed table amount exact after rounding to whole euros.
  const minorIndexes = childResults.map((c, i) => c.age < 18 ? i : -1).filter(i => i >= 0);
  if (minorIndexes.length) {
    const target = minorTableTotal + minorIndexes.reduce((sum, i) => sum + n(childResults[i].specialCosts), 0);
    const current = minorIndexes.reduce((sum, i) => sum + childResults[i].need, 0);
    const delta = target - current;
    childResults[minorIndexes[minorIndexes.length - 1]].need = Math.max(0, childResults[minorIndexes[minorIndexes.length - 1]].need + delta);
  }

  const totalNeed = childResults.reduce((sum, c) => sum + c.need, 0);
  const parentResults = input.parents.map((parent, parentIndex) => {
    const hasCareResidence = input.children.some(c => residenceParent(c) === parentIndex);
    const cap = calculateChildSupportCapacity({
      ...parent,
      nbi: incomeResults[parentIndex]?.nbiMonthly ?? parent.nbi,
      childCount,
      isCareParent: hasCareResidence,
    }).capacity;
    return {
      parentIndex,
      nbi: money(incomeResults[parentIndex]?.nbiMonthly ?? parent.nbi),
      kgb: money(n(parent.kgb)),
      income: incomeResults[parentIndex],
      capacity: cap,
      careDaysPerWeek: n(parent.careDaysPerWeek),
      careDiscountPctByChild: childResults.map(c => careParentForChild(input.children[c.childIndex - 1], parentIndex) ? careDiscountPercentage(n(parent.careDaysPerWeek)) : 0),
      capacityMethod: n(parent.specialNecessaryCosts) > 0 || n(parent.otherMaintenance) > 0 || n(parent.capacityAdjustment) !== 0 || (incomeResults[parentIndex]?.nbiMonthly ?? parent.nbi) >= (parent.aow ? 2430 : 2200) ? "FORMULA_70" : "TABLE_2026",
    };
  });

  const totalCapacity = parentResults.reduce((sum, p) => sum + p.capacity, 0);
  const capacitySufficient = totalCapacity >= totalNeed;
  const allocatable = Math.min(totalNeed, totalCapacity);

  // Step 1: allocate the actual child costs across parents according to capacity.
  const childAllocations = childResults.map(child => {
    const weights = parentResults.map(p => totalCapacity > 0 ? p.capacity / totalCapacity : 0);
    const shares = parentResults.map((p, i) => money(allocatable * weights[i] * (child.need / Math.max(totalNeed, 1))));
    const rawSum = shares.reduce((a, b) => a + b, 0);
    if (rawSum !== money(allocatable * child.need / Math.max(totalNeed, 1))) {
      const target = money(allocatable * child.need / Math.max(totalNeed, 1));
      const delta = target - rawSum;
      shares[0] = Math.max(0, shares[0] + delta);
    }
    const sourceChild = input.children[child.childIndex - 1];
    const careBase = child.baseNeed;
    const care = parentResults.map((p, i) => careParentForChild(sourceChild, i)
      ? careDiscount(careBase, p.careDaysPerWeek)
      : 0);
    return { childIndex: child.childIndex, need: child.need, parentShares: shares, careDiscounts: care };
  });

  // Step 2: turn shares into payment obligations. The resident parent receives;
  // the non-resident parent pays. With 50/50, both sides can be compared and the
  // net transfer is calculated rather than inventing a one-way payer.
  const careTotal = childAllocations.reduce((sum, c) => sum + Math.max(...c.careDiscounts), 0);
  const shortfall = Math.max(0, totalNeed - totalCapacity);
  const careCreditReduction = shortfall > 0 ? Math.min(careTotal, shortfall / 2) : 0;
  const careMultiplier = careTotal > 0 ? Math.max(0, 1 - careCreditReduction / careTotal) : 1;

  const transfers = input.children.map((child, i) => {
    const allocation = childAllocations[i];
    const resident = residenceParent(child);
    const effectiveCare = allocation.careDiscounts.map(v => money(v * careMultiplier));
    const afterCare = allocation.parentShares.map((share, parentIndex) =>
      Math.max(0, share - effectiveCare[parentIndex])
    );

    if (!capacitySufficient) {
      const sourceChild = input.children[i];
      const payer = resident === 0 ? 1 : resident === 1 ? 0 : (afterCare[1] >= afterCare[0] ? 1 : 0);
      const receiver = payer === 0 ? 1 : 0;
      const payerCapacityShare = totalCapacity > 0
        ? money(parentResults[payer].capacity * (child.need / Math.max(totalNeed, 1)))
        : 0;
      const care = effectiveCare[payer];
      const payment = careMultiplier === 0 ? payerCapacityShare : Math.max(0, payerCapacityShare - care);
      return {
        childIndex: i + 1,
        direction: `${payer === 0 ? "A" : "B"}->${receiver === 0 ? "A" : "B"}`,
        payerIndex: payer,
        receiverIndex: receiver,
        grossShare: payerCapacityShare,
        careDiscount: money(careMultiplier === 0 ? 0 : care),
        payment: money(payment),
        note: careMultiplier === 0
          ? "Gezamenlijke draagkracht is onvoldoende en het tekort is ten minste tweemaal de zorgkorting; de zorgkorting wordt niet verzilverd."
          : "Gezamenlijke draagkracht is onvoldoende; het tekort wordt volgens de draagkracht verdeeld en de zorgkorting wordt slechts voor zover verzilverbaar toegepast.",
      };
    }

    if (resident !== null) {
      const payer = resident === 0 ? 1 : 0;
      const receiver = resident;
      return {
        childIndex: i + 1,
        direction: `${payer === 0 ? "A" : "B"}->${receiver === 0 ? "A" : "B"}`,
        payerIndex: payer,
        receiverIndex: receiver,
        grossShare: allocation.parentShares[payer],
        careDiscount: effectiveCare[payer],
        payment: money(afterCare[payer]),
        note: "Zorgkorting in mindering gebracht op het aandeel van de ouder bij wie het kind niet het hoofdverblijf heeft.",
      };
    }

    const net = afterCare[1] - afterCare[0];
    return {
      childIndex: i + 1,
      direction: net >= 0 ? "A->B" : "B->A",
      payerIndex: net >= 0 ? 1 : 0,
      receiverIndex: net >= 0 ? 0 : 1,
      grossShare: Math.max(afterCare[0], afterCare[1]),
      careDiscount: Math.max(...effectiveCare),
      payment: money(Math.abs(net)),
      note: "50/50: netto overdracht op basis van de berekende aandelen en zorgkosten; professionele beoordeling blijft vereist.",
    };
  });

  const paymentTotals = [0, 0];
  transfers.forEach(t => { paymentTotals[t.payerIndex] += t.payment; });

  const warnings: string[] = [];
  if (!suppliedNBGI) warnings.push("Geen historisch NBGI opgegeven; het systeem gebruikt de actuele som van de ingevoerde NBI's als rekenkundige benadering. Voor een definitieve behoefteberekening moet het relevante historische NBGI worden vastgelegd.");
  if (suppliedNBGI > 0) warnings.push("Het ingevoerde historische NBGI moet het relevante KGB uit de samenwoonperiode al bevatten.");
  if (!capacitySufficient) warnings.push("De gezamenlijke draagkracht is lager dan de berekende behoefte; er is geen draagkrachtvergelijking. De ouders wenden hun beschikbare draagkracht aan en de verzilverbaarheid van zorgkorting is afzonderlijk getoetst.");
  if (input.children.some(c => c.age >= 18 && c.age <= 21)) warnings.push("Voor jongmeerderjarigen is WSF als uitgangspunt gebruikt; controleer beurs, eigen inkomsten en concrete studiekosten.");
  if (input.children.some(c => n(c.specialCosts) > 0)) warnings.push("Bijzondere kindkosten zijn toegevoegd. De zorgkorting wordt berekend over de basisbehoefte en niet over deze aanvullende kosten; controleer de kwalificatie en bewijsstukken.");
  if (input.parents.some(p => n(p.otherMaintenance) > 0)) warnings.push("Andere onderhoudsverplichtingen zijn als capaciteitscorrectie verwerkt; controleer rangorde en toerekening per onderhoudsgerechtigde.");

  return {
    engineVersion: ENGINE_VERSION,
    normVersion: NORM_VERSION,
    methodologyVersion: "KA-2026-PRODUCTION",
    indexation: input.indexation ?? 0.046,
    methodology: "Tremanormen 2026 — behoefte, draagkrachtvergelijking, zorgkorting en bijdrage",
    nbgi,
    totalNeed: money(totalNeed),
    totalCapacity: money(totalCapacity),
    capacityDeficit: money(Math.max(0, totalNeed - totalCapacity)),
    capacitySurplus: money(Math.max(0, totalCapacity - totalNeed)),
    capacitySufficient,
    parentResults: parentResults.map((p, i) => ({
      ...p,
      sharePct: totalCapacity ? round((p.capacity / totalCapacity) * 1000) / 10 : 0,
      allocatedNeed: money(childAllocations.reduce((s, c) => s + c.parentShares[i], 0)),
      totalCareDiscount: money(transfers.reduce((s, t) => s + (t.payerIndex === i ? t.careDiscount : 0), 0)),
      paymentTotal: paymentTotals[i],
    })),
    childResults: childResults.map((c, i) => ({
      ...c,
      parentShares: childAllocations[i].parentShares,
      careDiscountByParent: childAllocations[i].careDiscounts,
      totalCareDiscount: money(childAllocations[i].careDiscounts.reduce((a, b) => a + b, 0)),
      payments: transfers[i],
    })),
    transfers,
    calculationSteps: [
      { step: 1, title: "Behoefte", value: money(totalNeed), formula: "2026 behoeftetabel of WSF voor 18–21 jaar" },
      { step: 2, title: "Draagkracht", value: money(totalCapacity), formula: "2026 draagkrachttabel/formule per ouder" },
      { step: 3, title: "Draagkrachtvergelijking", value: money(allocatable), formula: "eigen draagkracht / gezamenlijke draagkracht × behoefte" },
      { step: 4, title: "Zorgkorting", value: money(transfers.reduce((s, t) => s + t.careDiscount, 0)), formula: "5/15/25/35% afhankelijk van gemiddeld aantal zorgdagen" },
      { step: 5, title: "Bijdrage", value: money(transfers.reduce((s, t) => s + t.payment, 0)), formula: "aandeel ouder minus toepasselijke zorgkorting" },
    ],
    incomeResults,
    warnings,
    warning: "Indicatieve professionele rekenslag. De Expertgroep Alimentatie benadrukt dat de aanbevelingen geen wet zijn en dat individuele omstandigheden tot afwijkingen kunnen leiden.",
    audit: {
      roundedToWholeEuros: true,
      inputParents: input.parents.length,
      inputChildren: input.children.length,
      generatedAt: new Date().toISOString(),
    },
  };
}

export { CARE_DISCOUNT };
