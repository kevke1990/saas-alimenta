import { describe, expect, it } from 'vitest';
import { buildCaseWorkflow, getNextCaseWorkflowStep, workflowStatusLabel } from './case-workflow';
import { isAllowedReviewTransition } from './review-workflow';
import { runCalculationEngineV2 } from './calculation-pipeline-v2';

describe('buildCaseWorkflow', () => {
  it('builds one canonical sequence for a calculated case', () => {
    const items = buildCaseWorkflow('case-1', {
      status: 'INCOMPLETE', hasCalculation: true, hasScenarios: true, hasHistory: true,
      reviewReady: true, reportAvailable: true,
    });
    expect(items.map((x) => x.step)).toEqual(['CALCULATION', 'SCENARIOS', 'HISTORY', 'REVIEW', 'REPORT']);
    expect(items.find((x) => x.step === 'REVIEW')?.href).toBe('/cases/case-1/review');
    expect(items.every((x) => x.href.includes('case-1'))).toBe(true);
  });

  it('does not claim review completion before REVIEWED', () => {
    const items = buildCaseWorkflow('case-2', {
      status: 'INCOMPLETE', hasCalculation: true, hasScenarios: false, hasHistory: true,
      reviewReady: false, reportAvailable: true,
    });
    expect(items.find((x) => x.step === 'REVIEW')?.complete).toBe(false);
    expect(items.find((x) => x.step === 'REPORT')?.complete).toBe(true);
    expect(getNextCaseWorkflowStep(items)?.step).toBe('REVIEW');
  });

  it('locks calculation and scenario changes after approval', () => {
    const items = buildCaseWorkflow('case-3', {
      status: 'APPROVED', hasCalculation: true, hasScenarios: true, hasHistory: true,
      reviewReady: true, reportAvailable: true,
    });
    expect(items.find((x) => x.step === 'CALCULATION')?.locked).toBe(true);
    expect(items.find((x) => x.step === 'SCENARIOS')?.locked).toBe(true);
    expect(getNextCaseWorkflowStep(items)).toBeNull();
  });

  it('keeps final cases locked while allowing review to explain reopening', () => {
    const items = buildCaseWorkflow('case-4', {
      status: 'FINAL', hasCalculation: true, hasScenarios: true, hasHistory: true,
      reviewReady: true, reportAvailable: true,
    });
    expect(items.find((x) => x.step === 'CALCULATION')?.locked).toBe(true);
    expect(items.find((x) => x.step === 'SCENARIOS')?.locked).toBe(true);
    expect(items.find((x) => x.step === 'REVIEW')?.complete).toBe(true);
    expect(workflowStatusLabel('FINAL')).toBe('Definitief');
  });

  it('routes a review-ready case directly to professional review', () => {
    const items = buildCaseWorkflow('case-5', {
      status: 'READY_FOR_REVIEW', hasCalculation: true, hasScenarios: false, hasHistory: true,
      reviewReady: true, reportAvailable: true,
    });
    const review = items.find((x) => x.step === 'REVIEW');
    expect(review?.active).toBe(true);
    expect(review?.complete).toBe(false);
    expect(getNextCaseWorkflowStep(items)?.step).toBe('REVIEW');
    expect(workflowStatusLabel('READY_FOR_REVIEW')).toBe('Klaar voor review');
  });

  it('normalizes legacy IN_REVIEW status in isAllowedReviewTransition', () => {
    expect(isAllowedReviewTransition('READY_FOR_REVIEW', 'REVIEWED')).toBe(true);
    expect(isAllowedReviewTransition('IN_REVIEW', 'REVIEWED')).toBe(true);
    expect(isAllowedReviewTransition('IN_REVIEW', 'INCOMPLETE')).toBe(true);
    expect(isAllowedReviewTransition('IN_REVIEW', 'FINAL')).toBe(false);
  });

  it('does not double-deduct stiefchildMaintenance when stepparentCapacity is active in V2 pipeline', () => {
    const baseInput = {
      normYear: 2026 as const,
      children: [{ age: 10, residence: 'B' as const, careDaysPerWeek: 2 }],
      parents: [
        {
          nbi: 4000,
          stiefchildMaintenance: 200,
          stepparentCapacity: 500,
        },
        {
          nbi: 2500,
        },
      ],
    };
    const withoutStepchild = runCalculationEngineV2({
      ...baseInput,
      parents: [
        { nbi: 4000 },
        { nbi: 2500 },
      ],
    });
    const withStepchild = runCalculationEngineV2(baseInput);
    const capWithout = withoutStepchild.result.parentResults[0].capacity;
    const capWith = withStepchild.result.parentResults[0].capacity;
    // Pro-rata share of 200 stepchild maintenance between parent (capWithout) and stepparent (500)
    // must be strictly less than the full 200 (never deducted twice).
    const deduction = capWithout - capWith;
    expect(deduction).toBeGreaterThan(0);
    expect(deduction).toBeLessThan(200);
  });
});
