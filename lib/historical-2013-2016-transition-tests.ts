export type HistoricalTransition = {
  start: string;
  end: string;
  regime: 'pre-2013-04-01' | '2013-new-method' | '2013-h2' | 'h1' | 'h2';
  source: string;
};

/**
 * Explicit historical boundaries. Do not collapse these into calendar years:
 * the official archive contains separate 2013 April/July material and H1/H2
 * material for 2014-2016.
 */
export const HISTORICAL_2013_2016_TRANSITIONS: HistoricalTransition[] = [
  { start: '2013-01-01', end: '2013-03-31', regime: 'pre-2013-04-01', source: 'Rechtspraak: rapport alimentatienormen januari 2013' },
  { start: '2013-04-01', end: '2013-06-30', regime: '2013-new-method', source: 'Rechtspraak: rapport alimentatienormen april 2013' },
  { start: '2013-07-01', end: '2013-12-31', regime: '2013-h2', source: 'Rechtspraak: rapport alimentatienormen juli 2013' },
  { start: '2014-01-01', end: '2014-06-30', regime: 'h1', source: 'Rechtspraak: bijlage 2014 eerste helft' },
  { start: '2014-07-01', end: '2014-12-31', regime: 'h2', source: 'Rechtspraak: bijlage 2014 tweede helft' },
  { start: '2015-01-01', end: '2015-06-30', regime: 'h1', source: 'Rechtspraak: bijlage 2015 eerste helft' },
  { start: '2015-07-01', end: '2015-12-31', regime: 'h2', source: 'Rechtspraak: bijlage 2015 tweede helft' },
  { start: '2016-01-01', end: '2016-06-30', regime: 'h1', source: 'Rechtspraak: bijlage 2016 eerste helft' },
  { start: '2016-07-01', end: '2016-12-31', regime: 'h2', source: 'Rechtspraak: bijlage 2016 tweede helft' },
];

export function getHistorical2013To2016Transition(date: string): HistoricalTransition | undefined {
  return HISTORICAL_2013_2016_TRANSITIONS.find(({ start, end }) => date >= start && date <= end);
}

export const HISTORICAL_2013_2016_BOUNDARIES = [
  ['2013-03-31', 'pre-2013-04-01'],
  ['2013-04-01', '2013-new-method'],
  ['2013-06-30', '2013-new-method'],
  ['2013-07-01', '2013-h2'],
  ['2014-01-01', 'h1'],
  ['2014-07-01', 'h2'],
  ['2015-01-01', 'h1'],
  ['2015-07-01', 'h2'],
  ['2016-01-01', 'h1'],
  ['2016-07-01', 'h2'],
] as const;

export function assertHistorical2013To2016Coverage(): void {
  if (HISTORICAL_2013_2016_TRANSITIONS.length !== 9) {
    throw new Error('Historical 2013-2016 transition coverage is incomplete');
  }
}
