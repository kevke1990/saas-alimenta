import { describe, expect, it } from 'vitest';
import { buildReportProvenance } from './report-provenance';

describe('buildReportProvenance', () => {
  const calculation = {
    id: 'calc-1',
    engineVersion: '1.3.1',
    normVersion: '2026.1',
    result: { calculationFingerprint: 'fp-1' },
  };
  const binding = {
    calculationId: 'calc-1',
    fingerprint: 'fp-1',
    engineVersion: '1.3.1',
    normVersion: '2026.1',
  };

  it('records exact calculation and approval provenance', () => {
    const report = buildReportProvenance({
      calculation,
      reviewStatus: 'APPROVED',
      reviewScore: 94,
      approvedAt: '2026-09-07T12:00:00Z',
      approvedByUserId: 'user-1',
      approvalBinding: binding,
    });

    expect(report.calculation).toEqual(binding);
    expect(report.review).toEqual({
      status: 'APPROVED',
      score: 94,
      approvedAt: '2026-09-07T12:00:00.000Z',
      approvedByUserId: 'user-1',
      boundToApprovedCalculation: true,
    });
    expect(report.integrity).toEqual({ fingerprintPresent: true, snapshotPresent: true });
  });

  it('detects a stale approval binding', () => {
    const report = buildReportProvenance({
      calculation,
      reviewStatus: 'APPROVED',
      approvalBinding: { ...binding, calculationId: 'calc-old' },
    });
    expect(report.review.boundToApprovedCalculation).toBe(false);
  });

  it('supports legacy snapshots without fingerprints', () => {
    const report = buildReportProvenance({
      calculation: { ...calculation, result: {} },
      reviewStatus: 'INCOMPLETE',
    });
    expect(report.calculation?.fingerprint).toBeNull();
    expect(report.integrity.fingerprintPresent).toBe(false);
    expect(report.integrity.snapshotPresent).toBe(true);
    expect(report.review.boundToApprovedCalculation).toBe(false);
  });
});
