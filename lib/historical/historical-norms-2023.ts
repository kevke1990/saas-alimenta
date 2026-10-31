/**
 * Verified historical inputs for the 2023 Expertgroep Alimentatienormen set.
 *
 * Values are transcribed from the official January/July 2023 Rechtspraak
 * publications. This module remains data-only: 2023 is executable only when
 * every required adapter input has independently verified provenance.
 */

export const HISTORICAL_NORM_2023_SOURCE = {
  reportJanuary: "https://www.rechtspraak.nl/SiteCollectionDocuments/tremarapport-versie-2023-januari.pdf",
  appendixJanuary: "https://www.rechtspraak.nl/binaries/_rts_1768838151764/content/assets/rvdr/wa/2023/rvdr-wa-2023-bijlage-2023-eerste-helft-rapport-alimentatienormen.pdf",
  appendixJuly: "https://www.rechtspraak.nl/binaries/content/assets/rvdr/wa/2023/rvdr-wa-2023-bijlage-2023-tweede-helft-rapport-alimentatienormen.pdf",
  needTable: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/behoeftetabel-2023",
  capacityTable: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/alimentatie-draagkrachttabel-2023",
  archive: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/expertgroep-alimentatienormen",
} as const;

export const HISTORICAL_NORM_2023 = {
  year: 2023 as const,
  effectiveFrom: "2023-01-01",
  effectiveTo: "2023-12-31",
  version: "2023.2",
  needIncomePoints: [1500, 1750, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000],
  needTable: {
    1: [150, 190, 230, 310, 390, 470, 550, 630, 710, 790, 870],
    2: [235, 310, 380, 515, 650, 785, 920, 1055, 1190, 1325, 1460],
    3: [245, 315, 390, 545, 700, 855, 1010, 1165, 1320, 1475, 1630],
    4: [280, 370, 460, 645, 830, 1015, 1200, 1385, 1570, 1755, 1940],
  } as Record<number, number[]>,
  capacity: {
    underAow: {
      minimumNbi: 1680,
      formulaThreshold: 1930,
      necessary: 1175,
      housingPct: 0.30,
      low: [[1680, 51], [1730, 77], [1780, 97], [1830, 109], [1880, 116], [1930, 123]] as [number, number][],
    },
    aow: {
      minimumNbi: 1890,
      formulaThreshold: 2090,
      necessary: 1315,
      housingPct: 0.30,
      low: [[1890, 52], [1940, 74], [1990, 90], [2040, 97], [2090, 104]] as [number, number][],
    },
  },
  careDiscount: [
    { minDays: 0, maxDays: 0.99, pct: 0.05 },
    { minDays: 1, maxDays: 1.99, pct: 0.15 },
    { minDays: 2, maxDays: 2.99, pct: 0.25 },
    { minDays: 3, maxDays: 7, pct: 0.35 },
  ],
  wsfPeriods: [
    { from: "2023-01-01", to: "2023-07-31", mbo: { home: 556.95, away: 786.59, tuition: 103.25 }, hbo: { home: 957.87, away: 957.87, tuition: 184.08 } },
    { from: "2023-08-01", to: "2023-08-31", mbo: { home: 556.95, away: 786.59, tuition: 113.08 }, hbo: { home: 957.87, away: 957.87, tuition: 184.08 } },
    { from: "2023-09-01", to: "2023-12-31", mbo: { home: 556.95, away: 786.59, tuition: 113.08 }, hbo: { home: 957.87, away: 957.87, tuition: 192.83 } },
  ],
  fiscal: {
    maxDeductionRate: 0.3693,
    aanmerkelijkBelangRate: 0.269,
    box3TaxFreeAsset: 57000,
    kgbAssetLimitSingle: 127582,
    kgbAssetLimitWithPartner: 161329,
  },
  social: {
    zvwSelfPaidRate: 0.0543,
    zvwEmployerRate: 0.0668,
    zvwMaxContributionIncome: 66956,
    nominalPremiumLowIncomeReduction: [3, 50] as [number, number],
  },
  otherNormInputs: {
    taxCredits: {
      generalMaxUnderAow: 3070,
      generalMaxAow: 1583,
      employmentMaxUnderAow: 5052,
      employmentMaxAow: 2604,
      incomeDependentCombinationMaxUnderAow: 2694,
      incomeDependentCombinationMaxAow: 1389,
      youngDisabled: 820,
      elderlyUnderIncome: 1835,
      elderlyUpperIncome: 0,
      singleElderly: 478,
      greenInvestmentPct: 0.007,
      aowAgeBoundaryMonths: 10,
    },
    subsistenceBenefit: {
      underAow: {
        january: { married: 1708, single: 1196 },
        july: { married: 1738, single: 1217 },
      },
      aow: {
        january: { married: 1807, single: 1331 },
        july: { married: 1844, single: 1358 },
      },
    },
    holidayVoucherTaxablePct: 0.99,
    holidayVoucherUntaxedPct: 0.01,
    box3DeemedReturns: {
      savingsPct: 0.0036,
      otherAssetsPct: 0.0617,
      debtsPct: 0.0257,
    },
    box3BridgingLegislationYears: [2023, 2024, 2025],
    minimumIncomeFormula: {
      standardNecessaryCosts: 1175,
      housingPct: 0.30,
      capacityPct: 0.70,
    },
  },
  verification: {
    needTable: "verified",
    capacity: "verified",
    careDiscount: "verified",
    wsf: "verified",
    fiscalParameters: "verified",
    socialPremiumParameters: "verified",
    minimumIncome: "verified",
    otherRequiredNormInputs: "verified",
  } as const,
} as const;

export type HistoricalNorm2023 = typeof HISTORICAL_NORM_2023;
