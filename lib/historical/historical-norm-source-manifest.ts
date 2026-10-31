/**
 * Official source manifest for historical Alimentatienormen.
 *
 * This is a provenance layer only. It does not make a period executable and
 * deliberately contains no reconstructed financial values.
 */

export const RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE =
  "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/expertgroep-alimentatienormen";

export type HistoricalNormSource = {
  periodId: string;
  effectiveFrom: string;
  effectiveTo: string;
  sourceTitle: string;
  sourcePage: string;
  parameterDocuments: readonly string[];
  transitionNote?: string;
};

export const HISTORICAL_NORM_SOURCE_MANIFEST: readonly HistoricalNormSource[] = [
  {
    periodId: "2011-H2",
    effectiveFrom: "2011-07-01",
    effectiveTo: "2011-12-31",
    sourceTitle: "Bijlage 2011, tweede helft",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Bijlage 2011, tweede helft",],
  },
  {
    periodId: "2012-H1",
    effectiveFrom: "2012-01-01",
    effectiveTo: "2012-06-30",
    sourceTitle: "Bijlage 2012, eerste helft",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Bijlage 2012, eerste helft"],
  },
  {
    periodId: "2012-H2",
    effectiveFrom: "2012-07-01",
    effectiveTo: "2012-12-31",
    sourceTitle: "Bijlage 2012, tweede helft",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Bijlage 2012, tweede helft"],
  },
  {
    periodId: "2013-H1",
    effectiveFrom: "2013-01-01",
    effectiveTo: "2013-06-30",
    sourceTitle: "Rapport/bijlagen 2013",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: [
      "Rapport Alimentatienormen, versie april 2013",
      "Bijlage 2013, eerste helft",
    ],
    transitionNote: "The official archive lists an April 2013 report and a first-half attachment; exact parameter effective dates must be verified before activation.",
  },
  {
    periodId: "2013-H2",
    effectiveFrom: "2013-07-01",
    effectiveTo: "2013-12-31",
    sourceTitle: "Rapport Alimentatienormen, versie juli 2013",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Bijlage 2013, tweede helft", "Draagkrachttabel juli 2013"],
  },
  {
    periodId: "2014-H1",
    effectiveFrom: "2014-01-01",
    effectiveTo: "2014-06-30",
    sourceTitle: "Rapport Alimentatienormen, versie januari 2014",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Behoeftetabel 2014", "Bijlage 2014, eerste helft", "Draagkrachttabel 2014"],
  },
  {
    periodId: "2014-H2",
    effectiveFrom: "2014-07-01",
    effectiveTo: "2014-12-31",
    sourceTitle: "Rapport Alimentatienormen, versie juli 2014",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Bijlage 2014, tweede helft", "Draagkrachttabel 2014"],
  },
  {
    periodId: "2015-H1",
    effectiveFrom: "2015-01-01",
    effectiveTo: "2015-06-30",
    sourceTitle: "Rapport Alimentatienormen 2015",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Behoeftetabel 2015", "Bijlage 2015, eerste helft", "Draagkrachttabel 2015"],
  },
  {
    periodId: "2015-H2",
    effectiveFrom: "2015-07-01",
    effectiveTo: "2015-12-31",
    sourceTitle: "Rapport Alimentatienormen 2015",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Behoeftetabel 2015", "Bijlage 2015, tweede helft", "Draagkrachttabel 2015"],
  },
  {
    periodId: "2016-H1",
    effectiveFrom: "2016-01-01",
    effectiveTo: "2016-06-30",
    sourceTitle: "Rapport Alimentatienormen 2016",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Behoeftetabel 2016", "Bijlage 2016, eerste helft", "Draagkrachttabel 2016"],
  },
  {
    periodId: "2016-H2",
    effectiveFrom: "2016-07-01",
    effectiveTo: "2016-12-31",
    sourceTitle: "Rapport Alimentatienormen 2016",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Behoeftetabel 2016", "Bijlage 2016, tweede helft", "Draagkrachttabel 2016"],
  },
  {
    periodId: "2017-H1",
    effectiveFrom: "2017-01-01",
    effectiveTo: "2017-06-30",
    sourceTitle: "Rapport Alimentatienormen 2017 januari",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Behoeftetabel 2017", "Bijlage 2017 eerste helft", "Draagkrachttabel 2017"],
  },
  {
    periodId: "2017-H2",
    effectiveFrom: "2017-07-01",
    effectiveTo: "2017-12-31",
    sourceTitle: "Rapport Alimentatienormen 2017",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Behoeftetabel 2017", "Bijlage 2017 tweede helft", "Draagkrachttabel 2017"],
  },
  {
    periodId: "2018",
    effectiveFrom: "2018-01-01",
    effectiveTo: "2018-12-31",
    sourceTitle: "Rapport Alimentatienormen 2018",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Behoeftetabel 2018", "Bijlage rapport alimentatienormen versie januari 2018", "Bijlage rapport alimentatienormen versie juli 2018", "Draagkrachttabel 2018"],
  },
  {
    periodId: "2019",
    effectiveFrom: "2019-01-01",
    effectiveTo: "2019-12-31",
    sourceTitle: "Rapport Alimentatienormen 2019",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Behoeftetabel alimentatie 2019", "Bijlage rapport alimentatienormen versie januari 2019", "Bijlage rapport alimentatienormen versie juli 2019", "Draagkrachttabel alimentatie 2019"],
  },
  {
    periodId: "2020-H1",
    effectiveFrom: "2020-01-01",
    effectiveTo: "2020-06-30",
    sourceTitle: "Rapport Alimentatienormen 2020 januari",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Behoeftetabel alimentatie 2020", "Bijlage rapport alimentatienormen versie januari 2020", "Draagkrachttabel alimentatie 2020"],
  },
  {
    periodId: "2020-H2",
    effectiveFrom: "2020-07-01",
    effectiveTo: "2020-12-31",
    sourceTitle: "Rapport Alimentatienormen 2020",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Bijlage rapport alimentatienormen versie juli 2020", "Draagkrachttabel alimentatie 2020"],
  },
  {
    periodId: "2021",
    effectiveFrom: "2021-01-01",
    effectiveTo: "2021-12-31",
    sourceTitle: "Rapport Alimentatienormen 2021",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Behoeftetabel alimentatie 2021", "Bijlage rapport alimentatienormen versie januari 2021", "Bijlage rapport alimentatienormen versie juli 2021", "Draagkrachttabel alimentatie 2021"],
  },
  {
    periodId: "2022",
    effectiveFrom: "2022-01-01",
    effectiveTo: "2022-12-31",
    sourceTitle: "Rapport Alimentatienormen 2022",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Behoeftetabel 2022", "Bijlage rapport alimentatienormen versie januari 2022", "Bijlage rapport alimentatienormen versie juli 2022", "Draagkrachttabel alimentatie 2022"],
  },
  {
    periodId: "2023",
    effectiveFrom: "2023-01-01",
    effectiveTo: "2023-12-31",
    sourceTitle: "Rapport Alimentatienormen 2023",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Behoeftetabel alimentatie 2023", "Bijlage rapport alimentatienormen versie januari 2023", "Bijlage rapport alimentatienormen versie juli 2023", "Draagkrachttabel alimentatie 2023"],
  },
  {
    periodId: "2024",
    effectiveFrom: "2024-01-01",
    effectiveTo: "2024-12-31",
    sourceTitle: "Rapport Alimentatienormen 2024",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Behoeftetabel 2024", "Bijlage rapport alimentatienormen versie januari 2024", "Bijlage rapport alimentatienormen versie juli 2024", "Draagkrachttabel alimentatie 2024"],
  },
  {
    periodId: "2025",
    effectiveFrom: "2025-01-01",
    effectiveTo: "2025-12-31",
    sourceTitle: "Rapport Alimentatienormen 2025",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Behoeftetabel 2025", "Bijlage rapport alimentatienormen versie januari 2025", "Bijlage rapport alimentatienormen versie juli 2025", "Draagkrachttabel alimentatie 2025"],
  },
  {
    periodId: "2026-H1",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-06-30",
    sourceTitle: "Rapport Alimentatienormen januari 2026",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Behoeftetabel 2026", "Bijlage rapport alimentatienormen januari 2026", "Draagkrachttabel alimentatie 2026"],
  },
  {
    periodId: "2026-H2",
    effectiveFrom: "2026-07-01",
    effectiveTo: "2026-12-31",
    sourceTitle: "Rapport Alimentatienormen juli 2026",
    sourcePage: RECHTSPRAAK_ALIMENTATIENORMEN_ARCHIVE,
    parameterDocuments: ["Bijlage rapport alimentatienormen juli 2026", "Draagkrachttabel alimentatie 2026"],
  },
];
