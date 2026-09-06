import { describe, expect, it } from 'vitest';
import { buildCaseWorkflow } from './case-workflow';

describe('buildCaseWorkflow', () => {
  it('builds one canonical sequence for a calculated case', () => {
    const items = buildCaseWorkflow('case-1', {
      status: 'INCOMPLETE',
      hasCalculation: true,
      hasScenarios: true,
      hasHistory: true,
      reviewReady: true,
      reportAvailable: true,
    });

    expect(items.map((x) => x.step)).toEqual(['CALCULATION', 'SCENARIOS', 'HISTORY', 'REVIEW', 'REPORT']);
    expect(items.find((x) => x.step === 'REVIEW')?.href).toBe('/cases/case-1/review');
    expect(items.every((x) => x.href.includes('case-1'))).toBe(true);
  });

  it('does not claim review completion before REVIEWED', () => {
    const items = buildCaseWorkflow('case-2', {
      status: 'INCOMPLETE',
      hasCalculation: true,
      hasScenarios: false,
      hasHistory: true,
      reviewReady: false,
      reportAvailable: true,
    });

    expect(items.find((x) => x.step === 'REVIEW')?.complete).toBe(false);
    expect(items.find((x) => x.step === 'REPORT')?.complete).toBe(true);
  });
});
