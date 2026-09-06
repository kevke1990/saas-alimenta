import { CAPACITY } from './norms';

export type SupportType = 'CHILD_SUPPORT' | 'PARTNER_SUPPORT';

export type SupportCapacityInput = {
  nbi: number;
  kgb?: number;
  aow?: boolean;
  housingCosts?: number;
  specialNecessaryCosts?: number;
  otherMaintenance?: number;
  capacityAdjustment?: number;
  receivesBijstand?: boolean;
  /** Number of maintenance children used for the low-income minimum. */
  childCount?: number;
  /** True when this parent is the parent with whom the child(ren) have main residence. */
  isCareParent?: boolean;
};

export type SupportCapacityResult = {
  supportType: SupportType;
  nbi: number;
  kgbIncluded: number;
  effectiveNBI: number;
  housingBudget: number;
  actualHousing: number;
  housingDifference: number;
  necessaryLivingCosts: number;
  otherNecessaryCosts: number;
  maintenanceCosts: number;
  capacityAdjustment: number;
  capacityPercentage: number;
  capacity: number;
  method: 'TABLE_2026' | 'FORMULA_70' | 'FORMULA_60' | 'BIJSTAND_ZERO';
  notes: string[];
};

const num = (v: unknown) => Math.max(0, Number.isFinite(Number(v)) ? Number(v) : 0);
const signed = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
const round = (v: number) => Math.round(Math.max(0, v) + 1e-9);

function tableCapacity(nbi: number, aow = false) {
  const cfg = aow ? CAPACITY.aow : CAPACITY.underAow;
  const points = cfg.low;
  if (nbi < points[0][0]) return null;
  for (const [threshold, value] of points) {
    if (nbi < threshold) return value;
  }
  return null;
}

/**
 * Shared capacity primitives. The child-support and partner-support engines
 * deliberately call this with different policy parameters. This prevents
 * KGB and support-specific percentages from leaking between modules.
 */
export function calculateSupportCapacity(
  input: SupportCapacityInput,
  options: { supportType: SupportType; includeKgb?: boolean; percentage: number; formulaThreshold: number }
): SupportCapacityResult {
  const nbi = num(input.nbi);
  const includeKgb = options.includeKgb ?? false;
  const kgbIncluded = includeKgb ? num(input.kgb) : 0;
  const effectiveNBI = nbi + kgbIncluded;
  const aow = !!input.aow;
  const cfg = aow ? CAPACITY.aow : CAPACITY.underAow;
  const housingBudget = effectiveNBI * cfg.housingPct;
  const actualHousing = num(input.housingCosts);
  const housingDifference = Math.max(0, actualHousing - housingBudget);
  const special = num(input.specialNecessaryCosts);
  const maintenanceCosts = num(input.otherMaintenance);
  const adjustment = signed(input.capacityAdjustment);
  const childCount = Math.max(1, Math.floor(num(input.childCount || 1)));
  const isCareParent = !!input.isCareParent;
  const notes: string[] = [];

  if (input.receivesBijstand && isCareParent) {
    notes.push('Verzorgende ouder met Participatiewet-uitkering: geen draagkracht aangenomen, ook niet over KGB.');
    return {
      supportType: options.supportType, nbi, kgbIncluded, effectiveNBI, housingBudget,
      actualHousing, housingDifference, necessaryLivingCosts: cfg.necessary,
      otherNecessaryCosts: special, maintenanceCosts, capacityAdjustment: adjustment,
      capacityPercentage: options.percentage, capacity: 0,
      method: 'BIJSTAND_ZERO', notes,
    };
  }

  const useFormula = effectiveNBI >= options.formulaThreshold || special > 0 || maintenanceCosts > 0 || adjustment !== 0;
  const table = tableCapacity(effectiveNBI, aow);
  const lowIncomeMinimum = childCount >= 2 ? 50 : 25;
  const base = useFormula
    ? options.percentage * Math.max(0, effectiveNBI - housingBudget - cfg.necessary - special - maintenanceCosts)
    : (table ?? lowIncomeMinimum);

  if (!useFormula && effectiveNBI < (aow ? 2180 : 1950)) {
    notes.push(`Minimumdraagkracht 2026 toegepast: €${lowIncomeMinimum} per maand bij ${childCount === 1 ? 'één kind' : 'twee of meer kinderen'}.`);
  }

  if (options.supportType === 'PARTNER_SUPPORT') {
    notes.push('Partneralimentatie gebruikt uitsluitend NBI; KGB is niet als inkomen toegevoegd.');
    notes.push('Kindgerelateerde onderhoudsverplichtingen worden na de basisdraagkracht afzonderlijk in mindering gebracht.');
  } else if (includeKgb) {
    notes.push('KGB is uitsluitend binnen de kinderalimentatie-draagkracht meegenomen.');
  }

  if (actualHousing > housingBudget) notes.push('Feitelijke woonlast ligt boven het 30%-woonbudget; dit is zichtbaar gemaakt maar niet automatisch als extra aftrek toegepast. Controleer hoofdstuk 4.6 en de concrete omstandigheden.');

  return {
    supportType: options.supportType, nbi, kgbIncluded, effectiveNBI, housingBudget,
    actualHousing, housingDifference, necessaryLivingCosts: cfg.necessary,
    otherNecessaryCosts: special, maintenanceCosts, capacityAdjustment: adjustment,
    capacityPercentage: options.percentage, capacity: round(base + adjustment),
    method: input.receivesBijstand && isCareParent ? 'BIJSTAND_ZERO' : (useFormula ? (options.percentage === 0.60 ? 'FORMULA_60' : 'FORMULA_70') : 'TABLE_2026'),
    notes,
  };
}

export function calculateChildSupportCapacity(input: SupportCapacityInput) {
  const aow = !!input.aow;
  return calculateSupportCapacity(input, {
    supportType: 'CHILD_SUPPORT',
    includeKgb: true,
    percentage: 0.70,
    formulaThreshold: aow ? 2430 : 2200,
  });
}

export function calculatePartnerSupportCapacity(input: SupportCapacityInput) {
  return calculateSupportCapacity(input, {
    supportType: 'PARTNER_SUPPORT',
    includeKgb: false,
    percentage: 0.60,
    formulaThreshold: 2200,
  });
}
