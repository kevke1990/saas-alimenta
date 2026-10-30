/**
 * Official historical source registry for 2006-2012.
 *
 * This is provenance metadata only. A period MUST NOT become executable until
 * every parameter consumed by the calculation adapter has a verified source
 * and a reference calculation.
 *
 * Source: Rechtspraak Expertgroep Alimentatienormen archive.
 */
export const HISTORICAL_ARCHIVE_2006_2012 = {
  sourceIndex: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/expertgroep-alimentatienormen",
  years: {
    2012: {
      periods: ["2012-01-01/2012-06-30", "2012-07-01/2012-12-31"],
      sources: ["Rapport Alimentatienormen 2012", "Bijlage 2012 eerste helft", "Bijlage 2012 tweede helft"],
      status: "source_catalogued",
    },
    2011: {
      periods: ["2011-01-01/2011-06-30", "2011-07-01/2011-12-31"],
      sources: ["Bijlage 2011 tweede helft"],
      status: "source_catalogued",
    },
    2010: {
      periods: ["2010-01-01/2010-12-31"],
      sources: ["Historische parameters opgenomen in de officiële 2011 tweede-halfjaarbijlage"],
      status: "source_catalogued",
    },
    2009: {
      periods: ["2009-01-01/2009-12-31"],
      sources: ["Historische parameters opgenomen in de officiële 2011/2012 bijlagen"],
      status: "source_catalogued",
    },
    2008: {
      periods: ["2008-01-01/2008-12-31"],
      sources: ["Historische parameters opgenomen in de officiële 2011 tweede-halfjaarbijlage"],
      status: "source_catalogued",
    },
    2007: {
      periods: ["2007-01-01/2007-12-31"],
      sources: ["Historische Expertgroep Alimentatienormen publicaties; exacte parameterlocators nog te verifiëren"],
      status: "source_catalogued",
    },
    2006: {
      periods: ["2006-01-01/2006-12-31"],
      sources: ["Historische Expertgroep Alimentatienormen publicaties; exacte parameterlocators nog te verifiëren"],
      status: "source_catalogued",
    },
  },
} as const;

export type HistoricalArchive2006To2012 = typeof HISTORICAL_ARCHIVE_2006_2012;
