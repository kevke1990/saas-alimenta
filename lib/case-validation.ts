import { z } from "zod";

const optionalNonNegativeNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? Number(val) : val),
  z.number().finite().nonnegative().optional(),
);

const optionalString = z.preprocess(
  (val) => (val === "" || val === null ? undefined : val),
  z.string().optional(),
);

const income = z.object({
  mode: z.enum(["NBI", "GROSS", "NET"]).optional(),
  salaryMonthly: z.number().finite().nonnegative().optional(),
  holidayAllowancePct: z.number().finite().nonnegative().max(100).optional(),
  holidayAllowanceMonthly: z.number().finite().nonnegative().optional(),
  thirteenthMonthAnnual: z.number().finite().nonnegative().optional(),
  ikbMonthly: z.number().finite().nonnegative().optional(),
  overtimeMonthly: z.number().finite().nonnegative().optional(),
  bonusAnnual: z.number().finite().nonnegative().optional(),
  taxableExpensesMonthly: z.number().finite().nonnegative().optional(),
  benefitsMonthly: z.number().finite().nonnegative().optional(),
  pensionMonthly: z.number().finite().nonnegative().optional(),
  disabilityPremiumMonthly: z.number().finite().nonnegative().optional(),
  otherPremiumsMonthly: z.number().finite().nonnegative().optional(),
  otherTaxableIncomeAnnual: z.number().finite().nonnegative().optional(),
  box3TaxableIncomeAnnual: z.number().finite().nonnegative().optional(),
  incomeTaxDeductionsAnnual: z.number().finite().nonnegative().optional(),
  netIncomeMonthly: z.number().finite().nonnegative().optional(),
  nbiMonthly: z.number().finite().nonnegative().optional(),
  netOtherIncomeMonthly: z.number().finite().nonnegative().optional(),
  kgbMonthly: z.number().finite().nonnegative().optional(),
  hasIack: z.boolean().optional(),
  hasLaborTaxCredit: z.boolean().optional(),
  hasGeneralTaxCredit: z.boolean().optional(),
  taxCreditOverrideAnnual: z.number().finite().nonnegative().optional(),
  aow: z.boolean().optional(),
}).optional();

export const newPartnerChildSchema = z.object({
  name: z.string().max(150).optional(),
  age: z.number().int().min(0).max(25),
  livesAtHome: z.boolean().optional(),
  monthlyAmount: z.number().finite().nonnegative().optional(),
  ownIncome: z.number().finite().nonnegative().optional(),
});

const newPartner = z.object({
  present: z.boolean(),
  name: z.string().max(150).optional(),
  relationship: z.enum(["NONE", "COHABITING", "COHABITING_CONTRACT", "REGISTERED_PARTNERSHIP", "MARRIED"]),
  nbiMonthly: z.number().finite().nonnegative().optional(),
  selfSupporting: z.boolean().optional(),
  children: z.array(newPartnerChildSchema).max(10).optional(),
}).optional();

const housing = z.object({
  type: z.enum(["RENT", "OWNED", "OTHER"]).optional(),
  monthlyCosts: z.number().finite().nonnegative().optional(),
  mortgageInterestMonthly: z.number().finite().nonnegative().optional(),
  mortgagePrincipalMonthly: z.number().finite().nonnegative().optional(),
  homeValue: z.number().finite().nonnegative().optional(),
  mortgageBalance: z.number().finite().nonnegative().optional(),
  mortgageInterestTaxBenefitMonthly: z.number().finite().nonnegative().optional(),
}).optional();

const parent = z.object({
  name: z.string().max(150).optional(),
  nbi: z.number().finite().nonnegative().optional(),
  kgb: z.number().finite().nonnegative().optional(),
  capacityAdjustment: z.number().finite().optional(),
  aow: z.boolean().optional(),
  housingCosts: z.number().finite().nonnegative().optional(),
  housing,
  newPartner,
  specialNecessaryCosts: z.number().finite().nonnegative().optional(),
  otherMaintenance: z.number().finite().nonnegative().optional(),
  stiefchildMaintenance: z.number().finite().nonnegative().optional(),
  stepparentCapacity: z.number().finite().nonnegative().optional(),
  careDaysPerWeek: z.number().finite().min(0).max(7).optional(),
  receivesBijstand: z.boolean().optional(),
  income,
});

const child = z.object({
  name: z.string().max(150).optional(),
  gender: z.enum(["MAN", "VROUW", "ANDERS", "ONBEKEND"]).optional(),
  age: z.number().int().min(0).max(25),
  specialCosts: z.number().finite().nonnegative().optional(),
  residence: z.enum(["A", "B", "50-50"]).optional(),
  careDaysPerWeek: z.number().finite().min(0).max(7).optional(),
  studentType: z.enum(["MBO", "HBO", "OTHER"]).optional(),
  livesAtHome: z.boolean().optional(),
  ownIncome: z.number().finite().nonnegative().optional(),
  studyGrant: z.number().finite().nonnegative().optional(),
});

const partnerSupport = z.object({
  enabled: z.boolean(),
  payerIndex: z.union([z.literal(0), z.literal(1)]),
  payerChildSupportShare: optionalNonNegativeNumber,
  historicalNBGI: optionalNonNegativeNumber,
  historicalChildCosts: optionalNonNegativeNumber,
  useHofnorm: z.boolean().optional(),
  concreteNeedNet: optionalNonNegativeNumber,
  recipientVerdiencapaciteit: optionalNonNegativeNumber,
  recipientOtherIncomeMonthly: optionalNonNegativeNumber,
  recipientAssetsIncomeMonthly: optionalNonNegativeNumber,
  payerAssetsIncomeMonthly: optionalNonNegativeNumber,
  payerOtherMaintenanceObligations: optionalNonNegativeNumber,
  payerPensionProvisionMonthly: optionalNonNegativeNumber,
  payerMortgageInterestTaxBenefitMonthly: optionalNonNegativeNumber,
  payerTaxableIncomeAnnual: optionalNonNegativeNumber,
  incomeComparisonEnabled: z.boolean().optional(),
  durationException: z.enum(["NONE", "CHILD_YOUNGER_THAN_12", "LONG_MARRIAGE_PRE_1970", "RECEIVER_BORN_1970_OR_EARLIER", "AGREEMENT_OR_COURT"]).optional(),
}).optional();

export const caseDataSchema = z.object({
  relationship: optionalString,
  normYear: z.union([z.literal(2024), z.literal(2025), z.literal(2026)]).optional(),
  calculationDate: optionalString,
  historicalNBGI: optionalNonNegativeNumber,
  parents: z.array(parent).length(2),
  children: z.array(child).min(1).max(10),
  actualKgbReceivingParent: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? Number(val) : val),
    z.number().finite().optional(),
  ),
  kgbParent: z.enum(["A", "B"]).optional(),
  partnerSupport,
});

export const caseCreateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  clientId: optionalString,
  data: caseDataSchema,
  meta: z.object({
    effectiveDate: optionalString,
    separationDate: optionalString,
    notes: z.string().max(10000).optional(),
    assetsA: optionalNonNegativeNumber,
    assetsB: optionalNonNegativeNumber,
  }).optional(),
});

