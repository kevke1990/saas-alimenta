import { describe, expect, it } from 'vitest';
import { calculateScenario, applyScenarioChanges } from './scenario-engine';
import { reviewCase } from './case-review';
import { calculationFingerprint } from './calculation-snapshot';
import { buildProfessionalReport } from './professional-report';
import { buildCaseWorkflow, getNextCaseWorkflowStep } from './case-workflow';

const base = {
  historicalNBGI: 6000,
  parents: [{ nbi: 4000, kgb: 0 }, { nbi: 2500, kgb: 500 }],
  children: [{ age: 10, residence: 'B' as const, specialCosts: 0 }],
};

describe('integral case workflow', () => {
  it('keeps the definitive calculation amount consistent through scenario, review and report', () => {
    const editedInput = applyScenarioChanges(base, { parents: { '0': { nbi: 5000 } } });
    const scenario = calculateScenario(base, { parents: { '0': { nbi: 5000 } } }, {
      historicalNBGI: 8000,
      historicalChildCosts: 1000,
      currentRecipientNBI: 1000,
      currentPayerNBI: 6000,
      payerIndex: 0,
    });

    const fingerprint = calculationFingerprint(editedInput, scenario.engineVersion, '2026.1');
    const review = reviewCase({
      data: editedInput,
      calculations: [{ id: 'snapshot-1' }],
      result: scenario,
      documents: [],
    });
    const report = buildProfessionalReport({
      name: 'Integrale workflow test',
      reviewStatus: 'APPROVED',
      data: editedInput,
      result: { ...scenario, calculationFingerprint: fingerprint },
      calculations: [{ engineVersion: scenario.engineVersion, normVersion: '2026.1', createdAt: new Date('2026-01-01T00:00:00Z') }],
      review,
    });

    expect(editedInput.parents[0].nbi).toBe(5000);
    expect(base.parents[0].nbi).toBe(4000);
    expect(fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(review.criticalCount).toBe(0);
    expect(review.readyForProfessionalReview).toBe(true);
    expect(report.summary.childSupportMonthly).toBe(scenario.combined.childSupportTotal);
    expect(report.summary.partnerSupportGrossMonthly).toBe(scenario.combined.partnerSupportMonthlyGross);
    expect(report.summary.totalMonthlyPayments).toBe(scenario.combined.totalMonthlyPayments);
  });

  it('routes the canonical status chain from calculation to final', () => {
    const states = [
      { status: 'INCOMPLETE' as const, expected: 'REVIEW' as const },
      { status: 'READY_FOR_REVIEW' as const, expected: 'REVIEW' as const },
      { status: 'REVIEWED' as const, expected: null },
      { status: 'APPROVED' as const, expected: null },
      { status: 'FINAL' as const, expected: null },
    ];

    for (const state of states) {
      const items = buildCaseWorkflow('case-integral', {
        status: state.status,
        hasCalculation: true,
        hasScenarios: true,
        hasHistory: true,
        reviewReady: true,
        reportAvailable: true,
      });
      expect(getNextCaseWorkflowStep(items)?.step ?? null).toBe(state.expected);
    }
  });
});
