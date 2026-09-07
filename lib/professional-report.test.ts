import { describe, expect, it } from 'vitest';
import { buildProfessionalReport } from './professional-report';
import { buildReviewCalculationBinding } from './review-binding';

describe('buildProfessionalReport', () => {
  const calculation = { id: 'calc-1', engineVersion: '1.3.1', normVersion: '2026.1', createdAt: new Date('2026-09-06T10:00:00Z') };

  it('builds an auditable combined KA/PAL summary from stored data', () => {
    const report = buildProfessionalReport({
      name: 'Dossier Test', reviewStatus: 'APPROVED',
      data: { parents: [{ name: 'Ouder A', nbi: 3000, kgb: 200, housingCosts: 900, careDaysPerWeek: 2 }, { name: 'Ouder B', nbi: 2200, kgb: 0, housingCosts: 800, careDaysPerWeek: 5 }], children: [{ name: 'Kind 1', age: 8, residence: 'A', specialCosts: 50, ownIncome: 0 }] },
      result: { engineVersion: '1.3.1', totalNeed: 700, totalCapacity: 1100, capacityDeficit: 0, calculationFingerprint: 'abc123', combined: { childSupportTotal: 450, partnerSupportMonthlyGross: 300, partnerSupportMonthlyNet: 240, totalMonthlyPayments: 750, childSupportByParent: [450, 0], priorityAudit: { childSupportPriorityApplied: true } }, warnings: ['controleer inkomen'] },
      calculations: [calculation],
      approvalBinding: buildReviewCalculationBinding({ ...calculation, result: { calculationFingerprint: 'abc123' } }),
      review: { score: 90 },
    });
    expect(report.status).toBe('APPROVED');
    expect(report.summary.childSupportMonthly).toBe(450);
    expect(report.summary.partnerSupportGrossMonthly).toBe(300);
    expect(report.summary.partnerSupportNetMonthly).toBe(240);
    expect(report.summary.totalMonthlyPayments).toBe(750);
    expect(report.calculation.id).toBe('calc-1');
    expect(report.calculation.fingerprint).toBe('abc123');
    expect(report.provenance.generatedFromApprovedSnapshot).toBe(true);
    expect(report.provenance.snapshotId).toBe('calc-1');
    expect(report.audit.priorityAudit).toEqual({ childSupportPriorityApplied: true });
    expect(report.audit.warnings).toContain('controleer inkomen');
    expect(report.children).toHaveLength(1);
    expect(report.parents).toHaveLength(2);
  });

  it('does not mark an approved report as provenance-safe without the matching approval binding', () => {
    const report = buildProfessionalReport({
      name: 'Mismatch', reviewStatus: 'APPROVED', data: { parents: [], children: [] },
      result: { calculationFingerprint: 'current', combined: { childSupportTotal: 350 } },
      calculations: [{ ...calculation, result: { calculationFingerprint: 'current' } }],
      approvalBinding: buildReviewCalculationBinding({ ...calculation, result: { calculationFingerprint: 'old' } }),
    });
    expect(report.provenance.generatedFromApprovedSnapshot).toBe(false);
  });

  it('marks FINAL as provenance-safe only when the approval binding matches the current snapshot', () => {
    const current = { ...calculation, id: 'calc-final', result: { calculationFingerprint: 'final123' } };
    const report = buildProfessionalReport({
      name: 'Final', reviewStatus: 'FINAL', data: { parents: [], children: [] },
      result: { calculationFingerprint: 'final123', combined: { childSupportTotal: 350 } },
      calculations: [current],
      approvalBinding: buildReviewCalculationBinding(current),
    });
    expect(report.provenance.generatedFromApprovedSnapshot).toBe(true);
    expect(report.provenance.snapshotId).toBe('calc-final');
  });

  it('marks an approved report stale when a newer calculation snapshot replaces the approved one', () => {
    const approved = { ...calculation, id: 'calc-approved', result: { calculationFingerprint: 'approved123' } };
    const current = { ...calculation, id: 'calc-new', result: { calculationFingerprint: 'new123' } };
    const report = buildProfessionalReport({
      name: 'Stale approval', reviewStatus: 'APPROVED', data: { parents: [], children: [] },
      result: { calculationFingerprint: 'new123', combined: { childSupportTotal: 350 } },
      calculations: [current],
      approvalBinding: buildReviewCalculationBinding(approved),
    });
    expect(report.provenance.generatedFromApprovedSnapshot).toBe(false);
    expect(report.provenance.snapshotId).toBe('calc-new');
  });

  it('does not invent a partner-support amount when PAL is absent', () => {
    const report = buildProfessionalReport({ name: 'KA-only', data: { parents: [{ nbi: 2000 }, { nbi: 1500 }], children: [{ age: 10 }] }, result: { combined: { childSupportTotal: 350 }, totalNeed: 500, totalCapacity: 700 }, calculations: [] });
    expect(report.summary.childSupportMonthly).toBe(350);
    expect(report.summary.partnerSupportGrossMonthly).toBe(0);
    expect(report.summary.partnerSupportNetMonthly).toBe(0);
    expect(report.summary.totalMonthlyPayments).toBe(350);
    expect(report.partnerSupport).toBeUndefined();
    expect(report.provenance.generatedFromApprovedSnapshot).toBe(false);
  });
});
