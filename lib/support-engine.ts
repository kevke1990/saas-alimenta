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
  childCount?: number;
  isCareParent?: boolean;
  capacityPercentage?: number;
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
  method: 'TABLE_2026' | 'FORMULA_70' | 'FORMULA_60' | 'FORMULA_45' | 'BIJSTAND_ZERO';
  notes: string[];
};

const num = (v: unknown) => Math.max(0, Number.isFinite(Number(v)) ? Number(v) : 0);
const signed = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
const round = (v: number) => Math.round(Math.max(0, v) + 1e-9);

function tableCapacity(nbi: number, aow = false) {
  const cfg = aow ? CAPACITY.aow : CAPACITY.underAow;
  if (nbi < cfg.minimumNbi) return null;
  for (let i = 0; i < cfg.low.length; i += 1) {
    const [threshold, value] = cfg.low[i];
    const nextThreshold = cfg.low[i + 1]?.[0] ?? cfg.formulaThreshold;
    if (nbi >= threshold && nbi < nextThreshold) return value;
  }
  return null;
}

export function calculateSupportCapacity(
  input: SupportCapacityInput,
  options: { supportType: SupportType; includeKgb?: boolean; percentage: number; formulaThreshold: number },
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
  const capacityPercentage = options.supportType === 'PARTNER_SUPPORT' && Number.isFinite(input.capacityPercentage)
    ? Math.max(0, Math.min(1, Number(input.capacityPercentage)))
    : options.percentage;

  if (input.receivesBijstand && isCareParent) {
    notes.push('Verzorgende ouder met Participatiewet-uitkering: geen draagkracht aangenomen, ook niet over KGB.');
    return {
      supportType: options.supportType, nbi, kgbIncluded, effectiveNBI, housingBudget,
      actualHousing, housingDifference, necessaryLivingCosts: cfg.necessary,
      otherNecessaryCosts: special, maintenanceCosts, capacityAdjustment: adjustment,
      capacityPercentage, capacity: 0, method: 'BIJSTAND_ZERO', notes,
    };
  }

  // The official 2026 table is used below the final threshold. If there are
  // extra necessary costs, the report prescribes the formula for that income
  // segment instead of the fixed table amount.
  const useFormula = effectiveNBI >= options.formulaThreshold || special > 0 || maintenanceCosts > 0 || adjustment !== 0;
  const table = tableCapacity(effectiveNBI, aow);
  const lowIncomeMinimum = childCount >= 2 ? 50 : 25;
  const base = useFormula
    ? capacityPercentage * Math.max(0, effectiveNBI - housingBudget - cfg.necessary - special - maintenanceCosts)
    : (table ?? lowIncomeMinimum);

  if (!useFormula && effectiveNBI < cfg.minimumNbi) {
    notes.push(`Minimumdraagkracht 2026 toegepast: €${lowIncomeMinimum} per maand bij ${childCount === 1 ? 'één kind' : 'twee of meer kinderen'}.`);
  }
  if (options.supportType === 'PARTNER_SUPPORT') {
    notes.push('Partneralimentatie gebruikt uitsluitend NBI; KGB is niet als inkomen toegevoegd.');
    notes.push('Kindgerelateerde onderhoudsverplichtingen worden na de basisdraagkracht afzonderlijk in mindering gebracht.');
    if (capacityPercentage === 0.45) notes.push('45%-gezinsroute toegepast omdat de onderhoudsplichtige een gezin onderhoudt en de nieuwe partner niet als volledig zelfredzaam is aangemerkt.');
  } else if (includeKgb) {
    notes.push('KGB is uitsluitend binnen de kinderalimentatie-draagkracht meegenomen.');
  }
  if (actualHousing > housingBudget) {
    notes.push('Feitelijke woonlast ligt boven het 30%-woonbudget; dit is zichtbaar gemaakt maar niet automatisch als extra aftrek toegepast. Controleer hoofdstuk 4.6 en de concrete omstandigheden.');
  }

  const method = capacityPercentage === 0.45 ? 'FORMULA_45' : capacityPercentage === 0.60 ? 'FORMULA_60' : 'FORMULA_70';
  return {
    supportType: options.supportType,
    nbi,
    kgbIncluded,
    effectiveNBI,
    housingBudget,
    actualHousing,
    housingDifference,
    necessaryLivingCosts: cfg.necessary,
    otherNecessaryCosts: special,
    maintenanceCosts,
    capacityAdjustment: adjustment,
    capacityPercentage,
    capacity: round(base + adjustment),
    method: useFormula ? method : 'TABLE_2026',
    notes,
  };
}

export function calculateChildSupportCapacity(input: SupportCapacityInput) {
  const aow = !!input.aow;
  return calculateSupportCapacity(input, {
    supportType: 'CHILD_SUPPORT',
    includeKgb: true,
    percentage: 0.70,
    formulaThreshold: aow ? CAPACITY.aow.formulaThreshold : CAPACITY.underAow.formulaThreshold,
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
