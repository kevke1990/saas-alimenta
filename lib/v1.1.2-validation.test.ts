import { describe, expect, it } from 'vitest';
import { calculateChildSupportCapacity } from './support-engine';
import { calculatePartnerSupport } from './partner-engine';

describe('v1.1.2 official 2026 anchor validation', () => {
  it('matches the official 2026 child-support table anchors', () => {
    const anchors: Array<[number, number]> = [[0,25],[1949,25],[1950,50],[2000,77],[2050,96],[2100,109],[2150,116],[2200,123],[4000,1005]];
    for (const [nbi, expected] of anchors) expect(calculateChildSupportCapacity({nbi, childCount:1}).capacity).toBe(expected);
  });

  it('matches the official AOW 2026 table anchors', () => {
    const anchors: Array<[number, number]> = [[0,25],[2179,25],[2180,51],[2230,77],[2280,97],[2330,109],[2380,116],[2430,123]];
    for (const [nbi, expected] of anchors) expect(calculateChildSupportCapacity({nbi, aow:true, childCount:1}).capacity).toBe(expected);
  });

  it('matches the official partner-support example: 4000 NBI -> 861 base capacity', () => {
    const r = calculatePartnerSupport({ historicalNBGI: 6000, historicalChildCosts: 0, currentRecipientNBI: 0, currentPayerNBI: 4000 });
    expect(r.capacity.base).toBe(861);
  });

  it('enforces child-support priority before PAL', () => {
    const r = calculatePartnerSupport({ historicalNBGI: 6000, historicalChildCosts: 0, currentRecipientNBI: 0, currentPayerNBI: 4000, currentChildSupport: 900 });
    expect(r.capacity.remainingNet).toBe(0);
    expect(r.result.monthlyNet).toBe(0);
  });

  it('sums concrete need items rather than averaging them', () => {
    const r = calculatePartnerSupport({ historicalNBGI: 0, historicalChildCosts: 0, currentRecipientNBI: 0, currentPayerNBI: 4000, useHofnorm: false, concreteNeedItems: [{label:'Wonen',monthly:1000},{label:'Verzekering',monthly:200}] });
    expect(r.need.concreteItemsTotal).toBe(1200);
  });

  it('flags impossible timeline and historical child-cost combinations', () => {
    const r = calculatePartnerSupport({ historicalNBGI: 3000, historicalChildCosts: 4000, currentRecipientNBI: 0, currentPayerNBI: 4000, historicalDate:'2026-06-01', effectiveDate:'2026-01-01' });
    expect(r.warnings.some(x => x.includes('hoger dan het historische NBGI'))).toBe(true);
    expect(r.warnings.some(x => x.includes('vóór de historische peildatum'))).toBe(true);
  });
});
