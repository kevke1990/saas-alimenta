/**
 * Verified 2012 historical norm data from the official Rechtspraak
 * Alimentatienormen appendices (January and July 2012).
 *
 * This module contains source-backed data only. It does NOT activate 2012
 * calculations; the historical execution gate remains fail-closed until the
 * complete 2012 rule/parameter set and independent reference calculations are
 * verified.
 */

export const HISTORICAL_2012_SOURCE = {
  januaryAppendix: "https://www.rechtspraak.nl/binaries/_rts_1769091268416/content/assets/lbvr/an/lbvr-an-bijlage-2012-eerste-helft.pdf",
  julyAppendix: "https://www.rechtspraak.nl/binaries/_rts_1769091269183/content/assets/lbvr/an/lbvr-an-bijlage-2012-tweede-helft.pdf",
  report: "https://www.rechtspraak.nl/binaries/_rts_1768896833188/content/assets/lbvr/an/lbvr-an-rapport-alimentatienormen-2012.pdf",
  tableLocator: "Bijlage 2012, paragraaf 28, Tabellen 1 en 2, pp. 13-15",
  capacityLocator: "Bijlage 2012, paragraaf 9 en draagkrachtmodellen",
  taxLocator: "Bijlage 2012, paragraaf 115, pp. 20-21",
  kgbLocator: "Bijlage 2012, paragraaf 7, pp. 10-11",
} as const;

export const HISTORICAL_2012_INCOME_POINTS = [1250, 1500, 1750, 2000, 2500, 3000, 3500, 4000, 4500, 5000] as const;

export const HISTORICAL_2012_CHILD_POINTS = {
  one: [0, 0, 2, 4],
  two: [0, 2, 4, 6],
  three: [0, 3, 5, 7],
  four: [0, 4, 6, 8],
} as const;

export const HISTORICAL_2012_CHILD_COST_TABLES = {
  1: [[4,155,195,240,280,365,450,535,620,705,790],[3,150,190,235,275,360,445,530,615,700,785],[2,145,185,230,270,355,440,525,610,695,780],[1,140,180,225,265,350,435,520,605,690,775],[0,130,175,215,260,345,430,510,600,685,770]],
  2: [[12,230,295,360,425,555,685,815,945,1075,1205],[11,225,290,355,420,550,680,810,940,1070,1200],[10,220,285,350,415,545,675,805,935,1065,1195],[9,215,280,345,410,540,670,800,930,1060,1190],[8,210,275,340,405,535,665,795,925,1055,1185],[7,205,270,335,400,530,660,790,920,1050,1180],[6,200,265,330,395,525,655,785,915,1045,1175],[5,195,260,325,390,520,650,780,910,1040,1170],[4,190,255,320,385,515,645,775,905,1035,1165],[3,185,250,315,380,510,640,770,900,1030,1160],[2,180,245,310,375,505,635,765,895,1025,1155],[1,175,240,305,370,500,630,760,890,1020,1150],[0,170,235,300,365,495,625,755,885,1015,1145]],
  3: [[21,290,375,455,540,705,870,1035,1200,1365,1530],[20,285,370,450,535,700,865,1030,1195,1360,1525],[19,280,365,445,530,695,860,1025,1190,1355,1520],[18,275,360,440,525,690,855,1020,1185,1350,1515],[17,275,355,440,520,685,850,1015,1180,1345,1510],[16,270,350,435,515,680,845,1010,1175,1340,1505],[15,265,345,430,510,675,840,1005,1170,1335,1500],[14,260,340,425,505,670,835,1000,1165,1330,1495],[13,255,335,420,500,665,830,995,1160,1325,1490],[12,250,335,415,500,665,830,995,1160,1325,1490],[11,245,330,410,495,660,825,990,1155,1320,1485],[10,240,325,405,490,655,820,985,1150,1315,1480],[9,235,320,400,485,650,815,980,1145,1310,1475],[8,230,315,395,480,645,810,975,1140,1305,1470],[7,230,310,395,475,640,805,970,1135,1300,1465],[6,225,305,390,470,635,800,965,1130,1295,1460],[5,220,300,385,465,630,795,960,1125,1290,1455],[4,215,295,380,460,625,790,955,1120,1285,1450],[3,210,290,375,455,620,785,950,1115,1280,1445],[2,205,290,370,455,620,785,950,1115,1280,1445],[1,200,285,365,450,615,780,945,1110,1275,1440],[0,195,280,360,445,610,775,940,1105,1270,1435]],
  4: [[32,350,450,550,650,850,1050,1250,1450,1650,1850],[31,345,445,545,645,845,1045,1245,1445,1645,1845],[30,340,440,540,640,840,1040,1240,1440,1640,1840],[29,340,440,540,640,840,1040,1240,1440,1640,1840],[28,335,435,535,635,835,1035,1235,1435,1635,1835],[27,330,430,530,630,830,1030,1230,1430,1630,1830],[26,325,425,525,625,825,1025,1225,1425,1625,1825],[25,320,420,520,620,820,1020,1220,1420,1620,1820],[24,320,420,520,620,820,1020,1220,1420,1620,1820],[23,315,415,515,615,815,1015,1215,1415,1615,1815],[22,310,410,510,610,810,1010,1210,1410,1610,1810],[21,305,405,505,605,805,1005,1205,1405,1605,1805],[20,300,400,500,600,800,1000,1200,1400,1600,1800],[19,295,395,495,595,795,995,1195,1395,1595,1795],[18,295,395,495,595,795,995,1195,1395,1595,1795],[17,290,390,490,590,790,990,1190,1390,1590,1790],[16,285,385,485,585,785,985,1185,1385,1585,1785],[15,280,380,480,580,780,980,1180,1380,1580,1780],[14,275,375,475,575,775,975,1175,1375,1575,1775],[13,275,375,475,575,775,975,1175,1375,1575,1775],[12,270,370,470,570,770,970,1170,1370,1570,1770],[11,265,365,465,565,765,965,1165,1365,1565,1765],[10,260,360,460,560,760,960,1160,1360,1560,1760],[9,255,355,455,555,755,955,1155,1355,1555,1755],[8,255,355,455,555,755,955,1155,1355,1555,1755],[7,250,350,450,550,750,950,1150,1350,1550,1750],[6,245,345,445,545,745,945,1145,1345,1545,1745],[5,240,340,440,540,740,940,1140,1340,1540,1740],[4,235,335,435,535,735,935,1135,1335,1535,1735],[3,235,335,435,535,735,935,1135,1335,1535,1735],[2,230,330,430,530,730,930,1130,1330,1530,1730],[1,225,325,425,525,725,925,1125,1325,1525,1725],[0,220,320,420,520,720,920,1120,1320,1520,1720]],
} as const;

export const HISTORICAL_2012_CAPACITY_BASELINE = {
  july2012: { assistanceNormMonthly: { married: 1337, singleParent: 1203, single: 936 }, housingComponentMonthly: 213, contactStayCostPerDay: 5, contactTravelCostPerKm: 0.125, capacityShare: { family: 0.5, single: 0.7 } },
  january2012: { assistanceNormMonthly: { married: 1336, singleParent: 1203, single: 935 }, housingComponentMonthly: 213, contactStayCostPerDay: 5, contactTravelCostPerKm: 0.125, capacityShare: { family: 0.5, single: 0.7 } },
} as const;

export const HISTORICAL_2012_TAX = {
  box1: [
    { max: 18945, rateUnder65: 0.331, rate65Plus: 0.152 },
    { max: 33863, rateUnder65: 0.4195, rate65Plus: 0.2405 },
    { max: 56491, rateUnder65: 0.42, rate65Plus: 0.42 },
    { max: null, rateUnder65: 0.52, rate65Plus: 0.52 },
  ],
  box2Rate: 0.25,
  box3Rate: 0.30,
  box3ReturnRate: 0.04,
  holidayBonusTaxablePercent: 0.99,
  holidayBonusUntaxedPercent: 0.01,
  generalTaxCredit: { under65: 2033, age65Plus: 934 },
  lowIncomeEarnedIncomeCreditMaximum: 1574,
  earnedIncomeCreditHighIncomeMaximum: 1574,
} as const;

export const HISTORICAL_2012_KGB = {
  january2012: {
    incomeThresholdFull: 28897,
    noRightFromIncomeByChildren: { 1: 41880, 2: 47870, 3: 52610 },
    baseByChildren: { 1: 1017, 2: 1478, 3: 1661 },
    additionalPerChildFromFourth: 106,
    ageIncrease12to15: 231,
    ageIncrease16to17: 296,
  },
  july2012: {
    incomeThresholdFull: 28897,
    noRightFromIncomeByChildren: { 1: 41880, 2: 47870, 3: 52610 },
    baseByChildren: { 1: 1017, 2: 1478, 3: 1661 },
    additionalPerChildFromFourth: 106,
    ageIncrease12to15: 226,
    ageIncrease16to17: 290,
  },
} as const;

export const HISTORICAL_2012_HEALTH = {
  mandatoryExcessAnnual: 220,
  nominalZvwIncludedMonthly: { single: 49, couple: 93 },
} as const;

export type Historical2012ChildTable = keyof typeof HISTORICAL_2012_CHILD_COST_TABLES;

export function getHistorical2012ChildCostTable(children: number) {
  if (!Number.isInteger(children) || children < 1) throw new Error("Aantal kinderen moet minimaal 1 zijn.");
  return HISTORICAL_2012_CHILD_COST_TABLES[Math.min(children, 4) as Historical2012ChildTable];
}
