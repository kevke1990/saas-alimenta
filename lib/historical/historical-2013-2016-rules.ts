export const HISTORICAL_2013_2016_RULES = {
  whkEffective: "2015-01-01",
  kgbIncludedInChildNeedFrom: "2013-01-01",
  singleParentKgbHeadIncludedFrom: "2015-01-01",
  transitionDate2013: "2013-04-01",
  source: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/expertgroep-alimentatienormen",
} as const;

export function historicalRulesFor2013_2016(date: string) {
  if (date < "2013-04-01") {
    return {
      ...HISTORICAL_2013_2016_RULES,
      regime: "pre-2013-guidelines" as const,
      kgbTreatment: undefined as undefined,
    };
  }
  if (date < "2015-01-01") return { ...HISTORICAL_2013_2016_RULES, regime: "2013-guidelines" as const, kgbTreatment: "child-need" as const };
  return { ...HISTORICAL_2013_2016_RULES, regime: "whk" as const, kgbTreatment: "child-need-including-single-parent-head" as const };
}
