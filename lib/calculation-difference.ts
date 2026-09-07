export type CalculationDifference = {
  previousFingerprint: string | null;
  currentFingerprint: string | null;
  changed: boolean;
  monthly: {
    childSupport: number;
    partnerSupportNet: number;
    partnerSupportGross: number;
    totalPayments: number;
  };
  delta: {
    childSupport: number;
    partnerSupportNet: number;
    partnerSupportGross: number;
    totalPayments: number;
  };
  inputChanges: Array<{
    path: string;
    previous: unknown;
    current: unknown;
  }>;
};

const money = (value: unknown) => Math.round(Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0) + 1e-9);

function readNumber(source: Record<string, any>, paths: string[]): number {
  for (const path of paths) {
    const value = path.split('.').reduce((current, key) => current?.[key], source as any);
    if (value !== undefined && value !== null && Number.isFinite(Number(value))) return money(value);
  }
  return 0;
}

function collectChanges(previous: unknown, current: unknown, path = ''): CalculationDifference['inputChanges'] {
  if (Object.is(previous, current)) return [];
  if (Array.isArray(previous) || Array.isArray(current)) {
    const left = Array.isArray(previous) ? previous : [];
    const right = Array.isArray(current) ? current : [];
    const size = Math.max(left.length, right.length);
    return Array.from({ length: size }, (_, index) => collectChanges(left[index], right[index], `${path}[${index}]`)).flat();
  }
  if (previous && current && typeof previous === 'object' && typeof current === 'object') {
    const keys = new Set([...Object.keys(previous as Record<string, unknown>), ...Object.keys(current as Record<string, unknown>)]);
    return [...keys].sort().flatMap((key) => collectChanges(
      (previous as Record<string, unknown>)[key],
      (current as Record<string, unknown>)[key],
      path ? `${path}.${key}` : key,
    ));
  }
  return [{ path: path || '$', previous, current }];
}

export function buildCalculationDifference(input: {
  previous: { inputSnapshot: unknown; result: unknown; fingerprint?: string | null };
  current: { inputSnapshot: unknown; result: unknown; fingerprint?: string | null };
}): CalculationDifference {
  const previousResult = (input.previous.result || {}) as Record<string, any>;
  const currentResult = (input.current.result || {}) as Record<string, any>;
  const childPaths = ['combined.childSupportTotal', 'child.totalPayment', 'totalChildSupport', 'monthlyChildSupport'];
  const partnerNetPaths = ['combined.partnerSupportMonthlyNet', 'partner.monthlyNet', 'partnerSupport.monthlyNet'];
  const partnerGrossPaths = ['combined.partnerSupportMonthlyGross', 'partner.monthlyGross', 'partnerSupport.monthlyGross'];
  const totalPaths = ['combined.totalMonthlyPayments', 'totalMonthlyPayments', 'totalPayment'];

  const previousMonthly = {
    childSupport: readNumber(previousResult, childPaths),
    partnerSupportNet: readNumber(previousResult, partnerNetPaths),
    partnerSupportGross: readNumber(previousResult, partnerGrossPaths),
    totalPayments: readNumber(previousResult, totalPaths),
  };
  const currentMonthly = {
    childSupport: readNumber(currentResult, childPaths),
    partnerSupportNet: readNumber(currentResult, partnerNetPaths),
    partnerSupportGross: readNumber(currentResult, partnerGrossPaths),
    totalPayments: readNumber(currentResult, totalPaths),
  };
  const inputChanges = collectChanges(input.previous.inputSnapshot, input.current.inputSnapshot);
  const fingerprintsMatch = (input.previous.fingerprint || null) === (input.current.fingerprint || null);

  return {
    previousFingerprint: input.previous.fingerprint || null,
    currentFingerprint: input.current.fingerprint || null,
    changed: !fingerprintsMatch || inputChanges.length > 0,
    monthly: currentMonthly,
    delta: {
      childSupport: currentMonthly.childSupport - previousMonthly.childSupport,
      partnerSupportNet: currentMonthly.partnerSupportNet - previousMonthly.partnerSupportNet,
      partnerSupportGross: currentMonthly.partnerSupportGross - previousMonthly.partnerSupportGross,
      totalPayments: currentMonthly.totalPayments - previousMonthly.totalPayments,
    },
    inputChanges,
  };
}
