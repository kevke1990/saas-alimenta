export type HistoricalCapacityFormula = {
  validFrom: string;
  validTo: string;
  source: string;
  minimumNbi: number;
  minimumCapacity: number;
  bands: Array<{
    fromNbi: number;
    percentage: number;
    deductionFixed: number;
  }>;
  formulaFromNbi: number;
  formulaPercentage: number;
};

/**
 * Primary-source-derived child-support capacity formulas, pre-AOW.
 *
 * These values model the published formula bands; the full tables also contain
 * rounded reference outputs. Those outputs remain separate from the formula
 * parameters so the engine can test both calculation and table rounding.
 */
export const HISTORICAL_CAPACITY_FORMULAS_2017_2020: HistoricalCapacityFormula[] = [
  {
    validFrom: '2017-01-01', validTo: '2017-12-31',
    source: 'Rechtspraak, Draagkrachttabel 2017', minimumNbi: 1325, minimumCapacity: 25,
    bands: [
      { fromNbi: 1325, percentage: 100, deductionFixed: 855 },
      { fromNbi: 1375, percentage: 90, deductionFixed: 855 },
      { fromNbi: 1425, percentage: 80, deductionFixed: 855 },
      { fromNbi: 1475, percentage: 70, deductionFixed: 855 },
      { fromNbi: 1525, percentage: 70, deductionFixed: 880 },
      { fromNbi: 1575, percentage: 70, deductionFixed: 905 },
    ],
    formulaFromNbi: 1550, formulaPercentage: 70,
  },
  {
    validFrom: '2018-01-01', validTo: '2018-12-31',
    source: 'Rechtspraak, Draagkrachttabel 2018', minimumNbi: 1350, minimumCapacity: 25,
    bands: [
      { fromNbi: 1350, percentage: 100, deductionFixed: 870 },
      { fromNbi: 1400, percentage: 90, deductionFixed: 870 },
      { fromNbi: 1450, percentage: 80, deductionFixed: 870 },
      { fromNbi: 1500, percentage: 70, deductionFixed: 870 },
      { fromNbi: 1550, percentage: 70, deductionFixed: 895 },
      { fromNbi: 1600, percentage: 70, deductionFixed: 920 },
    ],
    formulaFromNbi: 1600, formulaPercentage: 70,
  },
  {
    validFrom: '2019-01-01', validTo: '2019-12-31',
    source: 'Rechtspraak, Draagkrachttabel 2019', minimumNbi: 1375, minimumCapacity: 25,
    bands: [
      { fromNbi: 1375, percentage: 100, deductionFixed: 900 },
      { fromNbi: 1425, percentage: 90, deductionFixed: 900 },
      { fromNbi: 1475, percentage: 80, deductionFixed: 900 },
      { fromNbi: 1525, percentage: 70, deductionFixed: 900 },
      { fromNbi: 1575, percentage: 70, deductionFixed: 925 },
      { fromNbi: 1625, percentage: 70, deductionFixed: 950 },
    ],
    formulaFromNbi: 1625, formulaPercentage: 70,
  },
  {
    validFrom: '2020-01-01', validTo: '2020-12-31',
    source: 'Rechtspraak, Draagkrachttabel 2020', minimumNbi: 1410, minimumCapacity: 25,
    bands: [
      { fromNbi: 1410, percentage: 100, deductionFixed: 925 },
      { fromNbi: 1460, percentage: 90, deductionFixed: 925 },
      { fromNbi: 1510, percentage: 80, deductionFixed: 925 },
      { fromNbi: 1560, percentage: 70, deductionFixed: 925 },
      { fromNbi: 1610, percentage: 70, deductionFixed: 950 },
      { fromNbi: 1660, percentage: 70, deductionFixed: 975 },
    ],
    formulaFromNbi: 1660, formulaPercentage: 70,
  },
];
