/**
 * Verified 2012 child-support capacity inputs.
 *
 * The 2012 regime predates the 1-April-2013 formula change. It must not be
 * routed through the 2013+ adapter. The historical source confirms a 70%
 * child-support share and a low-income table threshold of €1,250.
 *
 * Only values directly supported by the historical source/evidence are stored
 * here. Unknown lower-income table bands remain fail-closed rather than being
 * inferred from later years.
 */
export type Historical2012Capacity = {
  validFrom: "2012-01-01";
  validTo: "2012-12-31";
  childSupportPercentage: 70;
  minimumTableNbi: 1250;
  minimumCapacityOneChild: 25;
  minimumCapacityTwoOrMoreChildren: 50;
  formulaStartNbi: 1500;
  formulaFixedOtherCosts: 850;
  source: string;
};

export const HISTORICAL_2012_CAPACITY: Historical2012Capacity = {
  validFrom: "2012-01-01",
  validTo: "2012-12-31",
  childSupportPercentage: 70,
  minimumTableNbi: 1250,
  minimumCapacityOneChild: 25,
  minimumCapacityTwoOrMoreChildren: 50,
  formulaStartNbi: 1500,
  formulaFixedOtherCosts: 850,
  source: "Rechtspraak / historische alimentatienormen; 2012-regime en gepubliceerde rechtspraak waarin de 70%-formule en €850 overige lasten zijn toegepast",
};

export function calculateHistorical2012Capacity(nbi: number): number | null {
  if (!Number.isFinite(nbi) || nbi < 0) return null;
  if (nbi < HISTORICAL_2012_CAPACITY.formulaStartNbi) return null;

  const { childSupportPercentage, formulaFixedOtherCosts } = HISTORICAL_2012_CAPACITY;
  return Math.round(
    (childSupportPercentage / 100) *
      (nbi - (0.3 * nbi + formulaFixedOtherCosts)),
  );
}
