export type IncomeMode = "NBI" | "GROSS" | "NET";

export type IncomeProfile = {
  mode?: IncomeMode;
  salaryMonthly?: number;
  holidayAllowancePct?: number;
  holidayAllowanceMonthly?: number;
  thirteenthMonthAnnual?: number;
  ikbMonthly?: number;
  overtimeMonthly?: number;
  bonusAnnual?: number;
  taxableExpensesMonthly?: number;
  benefitsMonthly?: number;
  pensionMonthly?: number;
  disabilityPremiumMonthly?: number;
  otherPremiumsMonthly?: number;
  otherTaxableIncomeAnnual?: number;
  box3TaxableIncomeAnnual?: number;
  incomeTaxDeductionsAnnual?: number;
  netIncomeMonthly?: number;
  netOtherIncomeMonthly?: number;
  kgbMonthly?: number;
  hasIack?: boolean;
  hasLaborTaxCredit?: boolean;
  hasGeneralTaxCredit?: boolean;
  taxCreditOverrideAnnual?: number;
  aow?: boolean;
};

export type IncomeResult = {
  mode: IncomeMode;
  grossAnnual: number;
  pensionAnnual: number;
  taxableBox1: number;
  box3TaxableIncome: number;
  taxBeforeCredits: number;
  generalTaxCredit: number;
  laborTaxCredit: number;
  iack: number;
  taxCreditTotal: number;
  netAnnual: number;
  nbiMonthly: number;
  nbiIncludingKgbMonthly: number;
  components: { label: string; annual: number; kind: "income" | "deduction" | "credit" }[];
  warnings: string[];
};

const nz = (v?: number) => Math.max(0, Number.isFinite(v as number) ? Number(v) : 0);
const eur = (v: number) => Math.round(Math.max(0, v));

function taxBox1(income: number, aow = false) {
  const x = Math.max(0, income);
  const first = aow ? 0.1785 : 0.3575;
  return Math.min(x, 38883) * first + Math.min(Math.max(x - 38883, 0), 39543) * 0.3756 + Math.max(x - 78426, 0) * 0.495;
}

function generalCredit(income: number, aow = false) {
  const max = aow ? 1556 : 3115;
  const reduction = aow ? 0.03195 : 0.06398;
  return Math.max(0, max - Math.max(0, income - 29736) * reduction);
}

function laborCredit(laborIncome: number, aow = false) {
  const x = Math.max(0, laborIncome);
  if (aow) {
    if (x <= 11965) return 0.04156 * x;
    if (x <= 25845) return 498 + 0.15483 * (x - 11965);
    if (x <= 45592) return 2647 + 0.00974 * (x - 25845);
    if (x <= 132920) return Math.max(0, 2840 - 0.0325 * (x - 45592));
    return 0;
  }
  if (x <= 11965) return 0.08324 * x;
  if (x <= 25845) return 996 + 0.31009 * (x - 11965);
  if (x <= 45592) return 5300 + 0.0195 * (x - 25845);
  if (x <= 132920) return Math.max(0, 5685 - 0.0651 * (x - 45592));
  return 0;
}

function iack(laborIncome: number, eligible: boolean, aow = false) {
  if (!eligible) return 0;
  const x = Math.max(0, laborIncome);
  if (aow) {
    if (x <= 6239) return 0;
    if (x <= 32710) return 0.0572 * (x - 6239);
    return 1513;
  }
  if (x <= 6239) return 0;
  if (x <= 32710) return 0.1145 * (x - 6239);
  return 3032;
}

/**
 * 2026 income engine. It intentionally exposes every material component so a
 * professional can audit the route from source income to NBI. It is an
 * estimate of annual tax/NBI, not a replacement for an official tax return.
 */
export function calculateIncome(profile: IncomeProfile): IncomeResult {
  const mode = profile.mode || "NBI";
  const warnings: string[] = [];
  if (mode === "NBI") {
    const nbi = nz(profile.netIncomeMonthly) + nz(profile.netOtherIncomeMonthly) + nz(profile.kgbMonthly);
    return {
      mode, grossAnnual: 0, pensionAnnual: 0, taxableBox1: 0, box3TaxableIncome: nz(profile.box3TaxableIncomeAnnual),
      taxBeforeCredits: 0, generalTaxCredit: 0, laborTaxCredit: 0, iack: 0, taxCreditTotal: 0,
      netAnnual: eur(nbi * 12), nbiMonthly: eur(nz(profile.netIncomeMonthly) + nz(profile.netOtherIncomeMonthly)), nbiIncludingKgbMonthly: eur(nbi),
      components: [
        { label: "Opgegeven netto inkomen", annual: eur(nz(profile.netIncomeMonthly) * 12), kind: "income" },
        { label: "Overig netto inkomen", annual: eur(nz(profile.netOtherIncomeMonthly) * 12), kind: "income" },
        { label: "KGB", annual: eur(nz(profile.kgbMonthly) * 12), kind: "income" },
      ], warnings,
    };
  }

  if (mode === "NET") {
    const netMonthly = nz(profile.netIncomeMonthly) + nz(profile.netOtherIncomeMonthly);
    const kgbMonthly = nz(profile.kgbMonthly);
    const annual = (netMonthly + kgbMonthly) * 12;
    warnings.push("Nettomethode: gebruik loon-/uitkeringsspecificaties en controleer of vakantietoeslag al in het netto bedrag zit.");
    return {
      mode, grossAnnual: 0, pensionAnnual: 0, taxableBox1: 0, box3TaxableIncome: 0,
      taxBeforeCredits: 0, generalTaxCredit: 0, laborTaxCredit: 0, iack: 0, taxCreditTotal: 0,
      netAnnual: eur(annual),
      nbiMonthly: eur(netMonthly + kgbMonthly),
      nbiIncludingKgbMonthly: eur(netMonthly + kgbMonthly),
      components: [{ label: "Netto inkomen volgens specificatie", annual: eur(annual), kind: "income" }], warnings,
    };
  }

  const salary = nz(profile.salaryMonthly) * 12;
  // When a percentage is supplied, the professional input model treats the
  // percentage as applying to the regular gross remuneration plus IKB. This
  // keeps the annualisation auditable and matches the income-engine contract.
  const holidayBase = salary + nz(profile.ikbMonthly) * 12;
  const holiday = nz(profile.holidayAllowanceMonthly) > 0 ? nz(profile.holidayAllowanceMonthly) * 12 : holidayBase * (nz(profile.holidayAllowancePct) || 8) / 100;
  const ikb = nz(profile.ikbMonthly) * 12;
  const overtime = nz(profile.overtimeMonthly) * 12;
  const bonus = nz(profile.bonusAnnual);
  const thirteenth = nz(profile.thirteenthMonthAnnual);
  const expenses = nz(profile.taxableExpensesMonthly) * 12;
  const benefits = nz(profile.benefitsMonthly) * 12;
  const otherTaxable = nz(profile.otherTaxableIncomeAnnual);
  const grossAnnual = salary + holiday + ikb + overtime + bonus + thirteenth + expenses + benefits + otherTaxable;
  const pension = nz(profile.pensionMonthly) * 12;
  const disability = nz(profile.disabilityPremiumMonthly) * 12;
  const otherPremiums = nz(profile.otherPremiumsMonthly) * 12;
  const taxableBox1 = Math.max(0, grossAnnual - pension - disability - otherPremiums - nz(profile.incomeTaxDeductionsAnnual));
  const tax = taxBox1(taxableBox1, !!profile.aow);
  const g = profile.hasGeneralTaxCredit === false ? 0 : generalCredit(taxableBox1, !!profile.aow);
  const laborIncome = salary + holiday + ikb + overtime + bonus + thirteenth + expenses;
  const l = profile.hasLaborTaxCredit === false ? 0 : laborCredit(laborIncome, !!profile.aow);
  const i = iack(laborIncome, !!profile.hasIack, !!profile.aow);
  const override = nz(profile.taxCreditOverrideAnnual);
  const credits = override > 0 ? override : g + l + i;
  const netAnnual = Math.max(0, taxableBox1 - tax + credits + nz(profile.box3TaxableIncomeAnnual) + nz(profile.netOtherIncomeMonthly) * 12);

  if (nz(profile.holidayAllowancePct) === 0 && nz(profile.holidayAllowanceMonthly) === 0) warnings.push("Vakantietoeslag ontbreekt; controleer of deze in het salaris/IKB is inbegrepen.");
  if (ikb > 0) warnings.push("IKB/PKB is als bruto inkomenscomponent meegenomen; controleer de loonstrook en fiscale behandeling.");
  if (profile.hasIack) warnings.push("IACK is toegepast op basis van de door de gebruiker bevestigde geschiktheid; controleer de wettelijke voorwaarden.");
  if (nz(profile.box3TaxableIncomeAnnual) > 0) warnings.push("Box 3 is als opgegeven fiscaal inkomen toegevoegd; controleer de actuele vermogensberekening.");

  return {
    mode, grossAnnual: eur(grossAnnual), pensionAnnual: eur(pension + disability + otherPremiums), taxableBox1: eur(taxableBox1),
    box3TaxableIncome: eur(nz(profile.box3TaxableIncomeAnnual)), taxBeforeCredits: eur(tax),
    generalTaxCredit: eur(g), laborTaxCredit: eur(l), iack: eur(i), taxCreditTotal: eur(credits),
    netAnnual: eur(netAnnual), nbiMonthly: eur(netAnnual / 12), nbiIncludingKgbMonthly: eur(netAnnual / 12 + nz(profile.kgbMonthly)),
    components: [
      { label: "Bruto arbeidsinkomen", annual: eur(salary), kind: "income" }, { label: "Vakantietoeslag", annual: eur(holiday), kind: "income" },
      { label: "IKB/PKB", annual: eur(ikb), kind: "income" }, { label: "Overwerk", annual: eur(overtime), kind: "income" },
      { label: "13e maand", annual: eur(thirteenth), kind: "income" }, { label: "Bonus/eindejaarsuitkering", annual: eur(bonus), kind: "income" },
      { label: "Belaste onkostenvergoeding", annual: eur(expenses), kind: "income" }, { label: "Uitkeringen", annual: eur(benefits), kind: "income" },
      { label: "Pensioen/verzekeringspremies", annual: eur(pension + disability + otherPremiums), kind: "deduction" },
      { label: "Inkomstenbelasting vóór kortingen", annual: eur(tax), kind: "deduction" },
      { label: "Heffingskortingen", annual: eur(credits), kind: "credit" }, { label: "KGB + overig netto", annual: eur(nz(profile.kgbMonthly) * 12 + nz(profile.netOtherIncomeMonthly) * 12), kind: "credit" },
    ], warnings,
  };
}
