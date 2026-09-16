export const NORM_VERSION = "2026.1";
export type NormYear = 2024 | 2025 | 2026;
export type NormSet = {
  year: NormYear;
  version: string;
  effectiveFrom: string;
  source: string;
  sourceVersion: string;
  needIncomePoints: number[];
  needTable: Record<number, number[]>;
  capacity: { underAow: { minimumNbi: number; formulaThreshold: number; necessary: number; housingPct: number; low: [number, number][] }; aow: { minimumNbi: number; formulaThreshold: number; necessary: number; housingPct: number; low: [number, number][] } };
  careDiscount: { minDays: number; maxDays: number; pct: number }[];
};

const NEED_TABLE_2024: Record<number, number[]> = { 1:[150,190,230,310,395,475,555,635,720,800,880], 2:[225,305,380,515,655,790,925,1060,1200,1335,1470], 3:[245,310,380,535,690,845,1000,1155,1310,1465,1620], 4:[280,360,450,635,820,1005,1190,1375,1560,1745,1930] };
const NEED_POINTS_2024 = [1500,1750,2000,2500,3000,3500,4000,4500,5000,5500,6000];
const NEED_TABLE_2025: Record<number, number[]> = { 1:[200,285,375,465,545,615,680,745,810,870,930,990], 2:[350,490,635,780,910,1030,1150,1265,1380,1490,1595,1700], 3:[350,505,655,805,950,1090,1220,1350,1480,1605,1725,1845], 4:[420,605,785,965,1140,1305,1470,1630,1785,1940,2090,2240] };
const NEED_POINTS_2025 = [2000,2500,3000,3500,4000,4500,5000,5500,6000,6500,7000,7500];
const NEED_TABLE_2026: Record<number, number[]> = { 1:[200,275,350,425,540,610,680,745,805,870,930,985], 2:[345,475,605,735,905,1025,1145,1260,1375,1485,1590,1695], 3:[345,495,645,795,945,1080,1215,1345,1470,1595,1720,1835], 4:[410,590,770,950,1130,1295,1460,1620,1775,1930,2080,2230] };
const NEED_POINTS_2026 = [2000,2500,3000,3500,4000,4500,5000,5500,6000,6500,7000,7500];
const CARE_DISCOUNT_RULES = [{minDays:0,maxDays:0.99,pct:0.05},{minDays:1,maxDays:1.99,pct:0.15},{minDays:2,maxDays:2.99,pct:0.25},{minDays:3,maxDays:7,pct:0.35}];
const CAPACITY_2024 = { underAow:{low:[[1815,51],[1865,77],[1915,96],[1965,109],[2015,116],[2065,123]] as [number,number][],minimumNbi:1815,formulaThreshold:2065,necessary:1270,housingPct:0.30}, aow:{low:[[2030,50],[2080,73],[2130,88],[2180,95],[2230,102]] as [number,number][],minimumNbi:2030,formulaThreshold:2230,necessary:1415,housingPct:0.30} };
const CAPACITY_2025 = { underAow:{low:[[1875,53],[1925,79],[1975,98],[2025,110],[2075,117],[2125,124]] as [number,number][],minimumNbi:1875,formulaThreshold:2125,necessary:1310,housingPct:0.30}, aow:{low:[[2100,50],[2150,50],[2200,72],[2250,88],[2300,102]] as [number,number][],minimumNbi:2100,formulaThreshold:2300,necessary:1465,housingPct:0.30} };
const CAPACITY_2026 = { underAow:{low:[[1950,50],[2000,77],[2050,96],[2100,109],[2150,116]] as [number,number][],minimumNbi:1950,formulaThreshold:2200,necessary:1365,housingPct:0.30}, aow:{low:[[2180,51],[2230,77],[2280,97],[2330,109],[2380,116]] as [number,number][],minimumNbi:2180,formulaThreshold:2430,necessary:1525,housingPct:0.30} };

export const NORM_SETS: Record<NormYear, NormSet> = {
  2024:{year:2024,version:"2024.1",effectiveFrom:"2024-01-01",source:"Rechtspraak / Expertgroep Alimentatienormen",sourceVersion:"Rapport Alimentatienormen januari 2024",needIncomePoints:NEED_POINTS_2024,needTable:NEED_TABLE_2024,capacity:CAPACITY_2024,careDiscount:CARE_DISCOUNT_RULES},
  2025:{year:2025,version:"2025.1",effectiveFrom:"2025-01-01",source:"Rechtspraak / Expertgroep Alimentatienormen",sourceVersion:"Rapport Alimentatienormen januari 2025",needIncomePoints:NEED_POINTS_2025,needTable:NEED_TABLE_2025,capacity:CAPACITY_2025,careDiscount:CARE_DISCOUNT_RULES},
  2026:{year:2026,version:"2026.1",effectiveFrom:"2026-01-01",source:"Rechtspraak / Expertgroep Alimentatienormen",sourceVersion:"Rapport Alimentatienormen januari 2026",needIncomePoints:NEED_POINTS_2026,needTable:NEED_TABLE_2026,capacity:CAPACITY_2026,careDiscount:CARE_DISCOUNT_RULES},
};
export function getNormSet(year:number):NormSet { if(!(year in NORM_SETS)) throw new Error(`Geen ondersteunde NormSet voor ${year}.`); return NORM_SETS[year as NormYear]; }

// Backward-compatible exports used by the existing 2026 engine.
export const NEED_TABLE = NEED_TABLE_2026;
export const NBGI_POINTS = NEED_POINTS_2026;
export const CAPACITY = CAPACITY_2026;
export const CARE_DISCOUNT = CARE_DISCOUNT_RULES;

export const KGB_2026 = { thresholds:{single:29736,couple:39141},phaseoutPct:0.076,assetLimit:{single:146011,couple:184633},base:{single:[5996,8576,11156],couple:[2580,5160,7740]},age12to15:724,age16to17:964,thirdChild:2580 };
export const WSF_2026_H1 = { mbo:{home:657.49,away:928.58,tuition:121.50}, hbo:{home:936.46,away:1130.77,tuition:216.75} };
export const WSF_2026 = { mbo:{home:657.49,away:928.58,tuition:125.92}, hbo:{home:936.46,away:1130.77,tuition:224.50} };
export const ALIMENTATION_INDEXATION:Record<number,number> = {2024:0.062,2025:0.065,2026:0.046};
export function getIndexationFactor(year:number):number { const rate=ALIMENTATION_INDEXATION[year]; if(rate===undefined) throw new Error(`Geen wettelijke alimentatie-indexering bekend voor ${year}.`); return 1+rate; }
export const INDEXATION_2026 = ALIMENTATION_INDEXATION[2026];
