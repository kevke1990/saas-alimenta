export type ScenarioComparison = {
  scenarioId: string;
  name: string;
  createdAt?: string | Date;
  engineVersion?: string;
  fingerprint?: string;
  childSupportMonthly: number;
  partnerSupportMonthlyGross: number;
  partnerSupportMonthlyNet: number;
  totalMonthlyPayments: number;
  paymentByParent: number[];
  changes: unknown;
};

const num = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function toScenarioComparison(scenario: any): ScenarioComparison {
  const result = scenario?.result ?? {};
  const combined = result?.combined ?? {};
  const partner = result?.partner;

  const childSupportMonthly = num(combined.childSupportTotal ?? result.childSupportTotal);
  const partnerSupportMonthlyGross = num(
    combined.partnerSupportMonthlyGross ?? partner?.result?.monthlyGross ?? result.partnerSupport?.monthlyGross,
  );
  const partnerSupportMonthlyNet = num(
    combined.partnerSupportMonthlyNet ?? partner?.result?.monthlyNet ?? result.partnerSupport?.monthlyNet,
  );
  const paymentByParent = Array.isArray(combined.paymentByParent)
    ? combined.paymentByParent.map(num)
    : Array.isArray(combined.childSupportByParent)
      ? combined.childSupportByParent.map(num)
      : [];

  return {
    scenarioId: String(scenario.id),
    name: String(scenario.name || 'Scenario'),
    createdAt: scenario.createdAt,
    engineVersion: result.engineVersion,
    fingerprint: scenario.fingerprint,
    childSupportMonthly,
    partnerSupportMonthlyGross,
    partnerSupportMonthlyNet,
    totalMonthlyPayments: num(combined.totalMonthlyPayments ?? childSupportMonthly + partnerSupportMonthlyGross),
    paymentByParent,
    changes: scenario.changes ?? {},
  };
}

export function compareScenarios(scenarios: any[]): ScenarioComparison[] {
  return scenarios.map(toScenarioComparison);
}
