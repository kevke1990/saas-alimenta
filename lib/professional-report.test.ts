import { describe, expect, it } from 'vitest';
import { buildProfessionalReport } from './professional-report';

describe('buildProfessionalReport', () => {
  it('builds an auditable combined KA/PAL summary from stored data', () => {
    const report = buildProfessionalReport({
      name: 'Dossier Test',
      reviewStatus: 'APPROVED',
      data: {
        parents: [
          { name: 'Ouder A', nbi: 3000, kgb: 200, housingCosts: 900, careDaysPerWeek: 2 },
          { name: 'Ouder B', nbi: 2200, kgb: 0, housingCosts: 800, careDaysPerWeek: 5 },
        ],
        children: [{ name: 'Kind 1', age: 8, residence: 'A', specialCosts: 50, ownIncome: 0 }],
      },
      result: {
        engineVersion: '1.3.1',
        totalNeed: 700,
        totalCapacity: 1100,
        capacityDeficit: 0,
        calculationFingerprint: 'abc123',
        combined: {
          childSupportTotal: 450,
          partnerSupportMonthlyGross: 300,
          partnerSupportMonthlyNet: 240,
          totalMonthlyPayments: 750,
          childSupportByParent: [450, 0],
          priorityAudit: { childSupportPriorityApplied: true },
        },
        warnings: ['controleer inkomen'],
      },
      calculations: [{ id: 'calc-1', engineVersion: '1.3.1', normVersion: '2026.1', createdAt: new Date('2026-09-06T10:00:00Z') }],
      review: { score: 90 },
    });

    expect(report.status).toBe('APPROVED');
    expect(report.summary.childSupportMonthly).toBe(450);
    expect(report.summary.partnerSupportGrossMonthly).toBe(300);
    expect(report.summary.partnerSupportNetMonthly).toBe(240);
    expect(report.summary.totalMonthlyPayments).toBe(750);
    expect(report.calculation.id).toBe('calc-1');
    expect(report.calculation.fingerprint).toBe('abc123');
    expect(report.provenance).toEqual({
      snapshotId: 'calc-1',
      fingerprint: 'abc123',
      engineVersion: '1.3.1',
      normVersion: '2026.1',
      generatedFromApprovedSnapshot: true,
    });
    expect(report.audit.priorityAudit).toEqual({ childSupportPriorityApplied: true });
    expect(report.audit.warnings).toContain('controleer inkomen');
    expect(report.children).toHaveLength(1);
    expect(report.parents).toHaveLength(2);
  });

  it('does not label a review-ready report as generated from an approved snapshot', () => {
    const report = buildProfessionalReport({
      name: 'Review-ready',
      reviewStatus: 'READY_FOR_REVIEW',
      data: { parents: [], children: [] },
      result: { calculationFingerprint: 'fp-456', combined: {} },
      calculations: [{ id: 'calc-456', engineVersion: '1.3.1', normVersion: '2026.1' }],
    });

    expect(report.provenance.snapshotId).toBe('calc-456');
    expect(report.provenance.generatedFromApprovedSnapshot).toBe(false);
  });

  it('does not invent a partner-support amount when PAL is absent', () => {
    const report = buildProfessionalReport({
      name: 'KA-only',
      data: { parents: [{ nbi: 2000 }, { nbi: 1500 }], children: [{ age: 10 }] },
      result: { combined: { childSupportTotal: 350 }, totalNeed: 500, totalCapacity: 700 },
      calculations: [],
    });

    expect(report.summary.childSupportMonthly).toBe(350);
    expect(report.summary.partnerSupportGrossMonthly).toBe(0);
    expect(report.summary.partnerSupportNetMonthly).toBe(0);
    expect(report.summary.totalMonthlyPayments).toBe(350);
    expect(report.partnerSupport).toBeUndefined();
  });
});
