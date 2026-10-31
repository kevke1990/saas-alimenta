export type HistoricalReferenceCase = {
  id: string;
  effectiveFrom: string;
  effectiveTo?: string;
  regime: 'legacy' | 'new-method';
  source: string;
};

/**
 * Executable coverage for the 2013-2016 transition regimes.
 * Numeric reference outcomes are deliberately not fabricated here: they must
 * be populated from the primary Rechtspraak tables before a case is marked verified.
 */
export const HISTORICAL_2013_2016_REFERENCE_CASES: HistoricalReferenceCase[] = [
  { id: '2013-h1-legacy', effectiveFrom: '2013-01-01', effectiveTo: '2013-03-31', regime: 'legacy', source: 'Rechtspraak alimentatienormen 2013' },
  { id: '2013-apr-transition', effectiveFrom: '2013-04-01', effectiveTo: '2013-06-30', regime: 'new-method', source: 'Rechtspraak alimentatienormen 2013' },
  { id: '2013-h2', effectiveFrom: '2013-07-01', effectiveTo: '2013-12-31', regime: 'new-method', source: 'Rechtspraak alimentatienormen 2013' },
  { id: '2014-h1', effectiveFrom: '2014-01-01', effectiveTo: '2014-06-30', regime: 'new-method', source: 'Rechtspraak alimentatienormen 2014' },
  { id: '2014-h2', effectiveFrom: '2014-07-01', effectiveTo: '2014-12-31', regime: 'new-method', source: 'Rechtspraak alimentatienormen 2014' },
  { id: '2015-h1', effectiveFrom: '2015-01-01', effectiveTo: '2015-06-30', regime: 'new-method', source: 'Rechtspraak alimentatienormen 2015' },
  { id: '2015-h2', effectiveFrom: '2015-07-01', effectiveTo: '2015-12-31', regime: 'new-method', source: 'Rechtspraak alimentatienormen 2015' },
  { id: '2016-h1', effectiveFrom: '2016-01-01', effectiveTo: '2016-06-30', regime: 'new-method', source: 'Rechtspraak alimentatienormen 2016' },
  { id: '2016-h2', effectiveFrom: '2016-07-01', effectiveTo: '2016-12-31', regime: 'new-method', source: 'Rechtspraak alimentatienormen 2016' },
];

export function assertHistorical2013To2016Coverage(): void {
  if (HISTORICAL_2013_2016_REFERENCE_CASES.length !== 9) {
    throw new Error('Historical 2013-2016 reference coverage is incomplete');
  }

  for (let i = 1; i < HISTORICAL_2013_2016_REFERENCE_CASES.length; i += 1) {
    const previous = HISTORICAL_2013_2016_REFERENCE_CASES[i - 1];
    const current = HISTORICAL_2013_2016_REFERENCE_CASES[i];
    const expected = new Date(previous.effectiveTo ?? previous.effectiveFrom);
    expected.setUTCDate(expected.getUTCDate() + 1);
    if (expected.toISOString().slice(0, 10) !== current.effectiveFrom) {
      throw new Error(`Gap/overlap in historical coverage before ${current.id}`);
    }
  }
}
