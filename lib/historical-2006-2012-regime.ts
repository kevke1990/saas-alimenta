export type Historical2006_2012Period = {
  id: string;
  from: string;
  to: string;
  method: "pre-2013";
  childSupportPercentage: 70;
  source: string;
  status: "verified-source";
};

// The pre-April-2013 method is intentionally represented separately from
// the 2013+ capacity formula. The 2012 report explicitly specifies 70% for
// child support; numeric period-specific inputs are added only when verified
// against the primary historical annexes.
export const HISTORICAL_2006_2012_PERIODS: Historical2006_2012Period[] = [
  { id: "2006-historical", from: "2006-01-01", to: "2006-12-31", method: "pre-2013", childSupportPercentage: 70, source: "Rechtspraak Rapport Alimentatienormen 2012 / historical method", status: "verified-source" },
  { id: "2007-historical", from: "2007-01-01", to: "2007-12-31", method: "pre-2013", childSupportPercentage: 70, source: "Rechtspraak Rapport Alimentatienormen 2012 / historical method", status: "verified-source" },
  { id: "2008-historical", from: "2008-01-01", to: "2008-12-31", method: "pre-2013", childSupportPercentage: 70, source: "Rechtspraak Rapport Alimentatienormen 2012 / historical method", status: "verified-source" },
  { id: "2009-historical", from: "2009-01-01", to: "2009-12-31", method: "pre-2013", childSupportPercentage: 70, source: "Rechtspraak Rapport Alimentatienormen 2012 / historical method", status: "verified-source" },
  { id: "2010-historical", from: "2010-01-01", to: "2010-12-31", method: "pre-2013", childSupportPercentage: 70, source: "Rechtspraak Rapport Alimentatienormen 2012 / historical method", status: "verified-source" },
  { id: "2011-historical", from: "2011-01-01", to: "2011-12-31", method: "pre-2013", childSupportPercentage: 70, source: "Rechtspraak Rapport Alimentatienormen 2012 / historical method", status: "verified-source" },
  { id: "2012-historical", from: "2012-01-01", to: "2012-12-31", method: "pre-2013", childSupportPercentage: 70, source: "Rechtspraak Rapport Alimentatienormen 2012", status: "verified-source" },
];

export function getHistorical2006_2012Period(date: string): Historical2006_2012Period | null {
  return HISTORICAL_2006_2012_PERIODS.find((period) => date >= period.from && date <= period.to) ?? null;
}
