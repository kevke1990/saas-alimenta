import { z } from "zod";


const income = z.object({
  mode: z.enum(["NBI","GROSS","NET"]).optional(), salaryMonthly: z.number().finite().nonnegative().optional(),
  holidayAllowancePct: z.number().finite().nonnegative().max(100).optional(), holidayAllowanceMonthly: z.number().finite().nonnegative().optional(),
  thirteenthMonthAnnual: z.number().finite().nonnegative().optional(), ikbMonthly: z.number().finite().nonnegative().optional(),
  overtimeMonthly: z.number().finite().nonnegative().optional(), bonusAnnual: z.number().finite().nonnegative().optional(),
  taxableExpensesMonthly: z.number().finite().nonnegative().optional(), benefitsMonthly: z.number().finite().nonnegative().optional(),
  pensionMonthly: z.number().finite().nonnegative().optional(), disabilityPremiumMonthly: z.number().finite().nonnegative().optional(), otherPremiumsMonthly: z.number().finite().nonnegative().optional(),
  otherTaxableIncomeAnnual: z.number().finite().nonnegative().optional(), box3TaxableIncomeAnnual: z.number().finite().nonnegative().optional(),
  incomeTaxDeductionsAnnual: z.number().finite().nonnegative().optional(), netIncomeMonthly: z.number().finite().nonnegative().optional(),
  netOtherIncomeMonthly: z.number().finite().nonnegative().optional(), kgbMonthly: z.number().finite().nonnegative().optional(),
  hasIack: z.boolean().optional(), hasLaborTaxCredit: z.boolean().optional(), hasGeneralTaxCredit: z.boolean().optional(),
  taxCreditOverrideAnnual: z.number().finite().nonnegative().optional(), aow: z.boolean().optional()
});

const parent = z.object({
  nbi: z.number().finite().nonnegative(), kgb: z.number().finite().nonnegative().optional(), capacityAdjustment: z.number().finite().optional(),
  aow: z.boolean().optional(), housingCosts: z.number().finite().nonnegative().optional(),
  specialNecessaryCosts: z.number().finite().nonnegative().optional(), otherMaintenance: z.number().finite().nonnegative().optional(),
  careDaysPerWeek: z.number().finite().min(0).max(7).optional(), receivesBijstand: z.boolean().optional(), income
});
const child = z.object({
  age: z.number().int().min(0).max(25), specialCosts: z.number().finite().nonnegative().optional(),
  residence: z.enum(["A","B","50-50"]).optional(), studentType: z.enum(["MBO","HBO","OTHER"]).optional(),
  livesAtHome: z.boolean().optional(), ownIncome: z.number().finite().nonnegative().optional(), studyGrant: z.number().finite().nonnegative().optional()
});
export const caseCreateSchema = z.object({
  name: z.string().trim().min(2).max(200), clientId: z.string().optional(),
  data: z.object({ historicalNBGI: z.number().finite().nonnegative().optional(), parents: z.array(parent).length(2), children: z.array(child).min(1).max(10), actualKgbReceivingParent: z.number().finite().nonnegative().optional() }),
  meta: z.object({ effectiveDate: z.string().optional(), notes: z.string().max(10000).optional(), assetsA: z.number().finite().nonnegative().optional(), assetsB: z.number().finite().nonnegative().optional() }).optional()
});
