/**
 * Legal and guideline configuration for the Alimenta calculation engine.
 *
 * These entries are source metadata and review anchors. They are not, by
 * themselves, an automated legal conclusion or a replacement for the
 * applicable year-specific tables and professional review.
 */

export type LegalSourceKind = "law" | "guideline" | "government" | "table";

export interface LegalSourceConfig {
  id: string;
  title: string;
  kind: LegalSourceKind;
  jurisdiction: "NL";
  appliesTo: string[];
  url?: string;
  note: string;
}

export const LEGAL_FRAMEWORK_CONFIG: LegalSourceConfig[] = [
  {
    id: "BW_1_395",
    title: "Artikel 1:395 BW — onderhoudsplicht stiefouder voor minderjarige stiefkinderen",
    kind: "law",
    jurisdiction: "NL",
    appliesTo: ["stiefkind", "minderjarig", "verzorging en opvoeding"],
    url: "https://wetten.overheid.nl/BWBR0002656/",
    note: "De stiefouderplicht geldt onder de wettelijke voorwaarden, waaronder huwelijk of geregistreerd partnerschap en behoren tot het gezin.",
  },
  {
    id: "BW_1_395A_LID_2",
    title: "Artikel 1:395a lid 2 BW — onderhoudsplicht stiefouder voor jongmeerderjarige stiefkinderen",
    kind: "law",
    jurisdiction: "NL",
    appliesTo: ["stiefkind", "18-21 jaar", "levensonderhoud en studie"],
    url: "https://wetten.overheid.nl/BWBR0002656/",
    note: "De bepaling ziet op meerderjarige kinderen die de leeftijd van 21 jaar nog niet hebben bereikt en geldt onder de wettelijke voorwaarden.",
  },
  {
    id: "RAPPORT_ALIMENTATIENORMEN_2026_H4",
    title: "Rapport Alimentatienormen — versie januari 2026 — hoofdstuk 4 Draagkracht",
    kind: "guideline",
    jurisdiction: "NL",
    appliesTo: ["draagkracht", "kinderalimentatie", "partneralimentatie", "NBI", "draagkrachtruimte"],
    url: "https://www.rechtspraak.nl/binaries/_rts_1768906378057/content/assets/lbvr/an/lbvr-an-rapport-alimentatienormen-versie-januari-2026.pdf",
    note: "Hoofdstuk 4 beschrijft het kernschema: NBI en — bij kinderalimentatie — KGB, verminderd met gecorrigeerde bijstandsnorm, woonbudget en andere noodzakelijke lasten; draagkracht is een percentage van de draagkrachtruimte.",
  },
  {
    id: "RECHTSPRAAK_DRAAGKRACHTTABEL_2026",
    title: "Draagkrachttabel alimentatie 2026",
    kind: "table",
    jurisdiction: "NL",
    appliesTo: ["draagkracht", "peiljaar 2026", "kinderalimentatie"],
    url: "https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/civiel/familie-en-jeugdrecht/alimentatie-draagkrachttabel/draagkrachttabel-alimentatie-2026",
    note: "De berekening moet de tabel of formule van het gekozen peiljaar expliciet vastleggen; afwijkingen en bijzondere lasten moeten afzonderlijk worden gemotiveerd.",
  },
];

export const LEGAL_FRAMEWORK_VERSION = "2026.01";
