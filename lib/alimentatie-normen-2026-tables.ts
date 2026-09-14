/**
 * Versioned, auditable capacity bands for Trema 2026.
 *
 * These are deliberately kept separate from calculation code. Do not extend
 * this dataset without checking the applicable official appendix and period.
 */
export type NormPeriod = "2026-H1";

export interface DraagkrachtBand2026 {
  period: NormPeriod;
  minNbi: number;
  maxNbiExclusive?: number;
  percentage?: number;
  woonbudgetMonthly?: number;
  necessaryCostsMonthly?: number;
  draagkrachtloosIncomeMonthly?: number;
  capacityMonthly: number;
  source: string;
}

export const DRAAGKRACHT_2026_H1: readonly DraagkrachtBand2026[] = [
  { period: "2026-H1", minNbi: 0, maxNbiExclusive: 1950, capacityMonthly: 25, source: "Rapport Alimentatienormen januari 2026, bijlage 5; controleer bijzondere-lage-inkomensregel" },
  { period: "2026-H1", minNbi: 1950, maxNbiExclusive: 2000, percentage: 100, woonbudgetMonthly: 585, necessaryCostsMonthly: 1315, draagkrachtloosIncomeMonthly: 1900, capacityMonthly: 50, source: "Rapport Alimentatienormen januari 2026, bijlage 5" },
  { period: "2026-H1", minNbi: 2000, maxNbiExclusive: 2050, percentage: 90, woonbudgetMonthly: 600, necessaryCostsMonthly: 1315, draagkrachtloosIncomeMonthly: 1915, capacityMonthly: 77, source: "Rapport Alimentatienormen januari 2026, bijlage 5" },
  { period: "2026-H1", minNbi: 2050, maxNbiExclusive: 2100, percentage: 80, woonbudgetMonthly: 615, necessaryCostsMonthly: 1315, draagkrachtloosIncomeMonthly: 1930, capacityMonthly: 96, source: "Rapport Alimentatienormen januari 2026, bijlage 5" },
  { period: "2026-H1", minNbi: 2100, maxNbiExclusive: 2150, percentage: 70, woonbudgetMonthly: 630, necessaryCostsMonthly: 1315, draagkrachtloosIncomeMonthly: 1945, capacityMonthly: 109, source: "Rapport Alimentatienormen januari 2026, bijlage 5" },
  { period: "2026-H1", minNbi: 2150, maxNbiExclusive: 2200, percentage: 70, woonbudgetMonthly: 645, necessaryCostsMonthly: 1340, draagkrachtloosIncomeMonthly: 1985, capacityMonthly: 116, source: "Rapport Alimentatienormen januari 2026, bijlage 5" },
];

export function findDraagkrachtBand2026(nbi: number, period: NormPeriod = "2026-H1"): DraagkrachtBand2026 | undefined {
  return DRAAGKRACHT_2026_H1.find((band) => band.period === period && nbi >= band.minNbi && (band.maxNbiExclusive === undefined || nbi < band.maxNbiExclusive));
}
