import { ALIMENTATION_INDEXATION } from "./norms";

/**
 * Returns the compounded statutory alimentatie indexation from the supplied
 * source year through the target year. The source amount is treated as an
 * amount before the source year's statutory indexation is applied.
 */
export function getCumulativeIndexationFactor(fromYear: number, toYear: number): number {
  if (!Number.isInteger(fromYear) || !Number.isInteger(toYear)) {
    throw new Error("Indexatiejaren moeten gehele jaren zijn.");
  }
  if (toYear < fromYear) {
    throw new Error("Het indexeringsjaar kan niet vóór het bronjaar liggen.");
  }

  let factor = 1;
  for (let year = fromYear; year <= toYear; year += 1) {
    const rate = ALIMENTATION_INDEXATION[year];
    if (rate === undefined) {
      throw new Error(`Geen wettelijke alimentatie-indexering bekend voor ${year}.`);
    }
    factor *= 1 + rate;
  }
  return factor;
}
