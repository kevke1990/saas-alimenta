import { describe, expect, it } from 'vitest';
import { applyScenarioChanges, calculateScenario } from './scenario-engine';

const base = {
  historicalNBGI: 6000,
  parents: [{ nbi: 4000, kgb: 0 }, { nbi: 2500, kgb: 500 }],
  children: [{ age: 10, residence: 'B' as const, specialCosts: 0 }]
};

describe('Scenario engine 1.2', () => {
  it('patches a parent income without mutating the base', () => {
    const next = applyScenarioChanges(base, { parents: { '0': { nbi: 5000 } } });
    expect(next.parents[0].nbi).toBe(5000);
    expect(base.parents[0].nbi).toBe(4000);
  });
  it('recalculates child support from changed income', () => {
    const a = calculateScenario(base, {});
    const b = calculateScenario(base, { parents: { '0': { nbi: 5000 } } });
    expect(b.child.parentResults[0].capacity).toBeGreaterThan(a.child.parentResults[0].capacity);
  });
  it('can recalculate linked partner support with scenario child support', () => {
    const partnerInput = { historicalNBGI: 8000, historicalChildCosts: 1000, currentRecipientNBI: 1000, currentPayerNBI: 6000 };
    const r = calculateScenario(base, { parents: { '0': { nbi: 5000 } } }, partnerInput);
    expect(r.partner).not.toBeNull();
    expect(r.partner!.capacity.childSupportShare).toBeGreaterThanOrEqual(0);
  });
});
