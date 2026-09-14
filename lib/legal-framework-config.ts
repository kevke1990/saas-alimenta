/**
 * Legal and guideline configuration for the Alimenta calculation engine.
 *
 * The January 2026 Rapport Alimentatienormen is the normative calculation
 * framework. These entries are source metadata and calculation anchors; they
 * do not replace the year-specific tables, factual evidence or professional
 * legal review.
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

export interface Alimentatienormen2026Config {
  sourceId: string;
  version: "januari 2026";
  chapters: {
    income: string[];
    need: string[];
    capacity: string[];
    workflow: string[];
  };
  calculationAnchors: {
    useNetModelBelowGrossMonthly: number;
    useGrossModelFromGrossMonthly: number;
    careDiscountRequiresSeparateAssessment: boolean;
    maximumIsMinimumOfNeedAndCapacity: boolean;
    childrenUnder21HavePriority: boolean;
  };
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
    id: "BW_1_397",
    title: "Artikel 1:397 BW — behoefte en draagkracht",
    kind: "law",
    jurisdiction: "NL",
    appliesTo: ["behoefte", "draagkracht", "onderhoudsbijdrage"],
    url: "https://wetten.overheid.nl/BWBR0002656/",
    note: "De wettelijke maatstaven behoefte en draagkracht vormen de basis; de concrete invulling volgt uit de richtlijnen en omstandigheden van het geval.",
  },
  {
    id: "BW_1_400",
    title: "Artikel 1:400 lid 1 BW — rangorde onderhoudsverplichtingen",
    kind: "law",
    jurisdiction: "NL",
    appliesTo: ["voorrang kinderen", "stiefkinderen", "onderhoudsverplichtingen"],
    url: "https://wetten.overheid.nl/BWBR0002656/",
    note: "Kinderen en stiefkinderen tot 21 jaar hebben voorrang boven andere onderhoudsgerechtigden bij onvoldoende draagkracht.",
  },
  {
    id: "BW_1_404",
    title: "Artikel 1:404 BW — bijdrage naar draagkracht",
    kind: "law",
    jurisdiction: "NL",
    appliesTo: ["ouders", "verzorging en opvoeding", "draagkracht"],
    url: "https://wetten.overheid.nl/BWBR0002656/",
    note: "Ouders zijn verplicht naar draagkracht te voorzien in de kosten van verzorging en opvoeding van hun minderjarige kinderen.",
  },
  {
    id: "RAPPORT_ALIMENTATIENORMEN_2026_VOLLEDIG",
    title: "Rapport Alimentatienormen — versie januari 2026 — volledig rapport",
    kind: "guideline",
    jurisdiction: "NL",
    appliesTo: ["NBI", "KGB", "behoefte", "eigen aandeel", "draagkracht", "zorgkorting", "stappenplan", "rekenvoorbeelden"],
    url: "https://www.rechtspraak.nl/binaries/_rts_1768906378057/content/assets/lbvr/an/lbvr-an-rapport-alimentatienormen-versie-januari-2026.pdf",
    note: "De volledige PDF is de primaire richtlijnbron voor de engine. De hoofdstukken en bijlagen moeten als afzonderlijke, controleerbare rekenstappen worden verwerkt.",
  },
  {
    id: "RAPPORT_ALIMENTATIENORMEN_2026_H2",
    title: "Rapport Alimentatienormen 2026 — hoofdstuk 2: netto besteedbaar (gezins)inkomen",
    kind: "guideline",
    jurisdiction: "NL",
    appliesTo: ["netto model", "bruto model", "NBI", "NBGI", "KGB", "ondernemer", "DGA", "vermogen"],
    url: "https://www.rechtspraak.nl/binaries/_rts_1768906378057/content/assets/lbvr/an/lbvr-an-rapport-alimentatienormen-versie-januari-2026.pdf",
    note: "De engine moet het gekozen inkomensmodel vastleggen en inkomsten uit dienstbetrekking, uitkering, onderneming, DGA-inkomen en vermogen afzonderlijk kunnen onderbouwen.",
  },
  {
    id: "RAPPORT_ALIMENTATIENORMEN_2026_H3",
    title: "Rapport Alimentatienormen 2026 — hoofdstuk 3: behoefte en eigen aandeel",
    kind: "guideline",
    jurisdiction: "NL",
    appliesTo: ["eigen aandeel", "gezinsinkomen tijdens samenleving", "kinderen", "schaalvoordelen", "indexering"],
    url: "https://www.rechtspraak.nl/binaries/_rts_1768906378057/content/assets/lbvr/an/lbvr-an-rapport-alimentatienormen-versie-januari-2026.pdf",
    note: "De behoefte voor kinderalimentatie wordt volgens de tabel eigen aandeel bepaald; leeftijd wordt daarin niet afzonderlijk gebruikt en het tabelbedrag wordt bij meerdere kinderen verdeeld.",
  },
  {
    id: "RAPPORT_ALIMENTATIENORMEN_2026_H4",
    title: "Rapport Alimentatienormen 2026 — hoofdstuk 4: draagkracht",
    kind: "guideline",
    jurisdiction: "NL",
    appliesTo: ["draagkracht", "gecorrigeerde bijstandsnorm", "woonbudget", "noodzakelijke lasten", "draagkrachtruimte", "zorgkorting", "aanvaardbaarheidstoets"],
    url: "https://www.rechtspraak.nl/binaries/_rts_1768906378057/content/assets/lbvr/an/lbvr-an-rapport-alimentatienormen-versie-januari-2026.pdf",
    note: "De volledige draagkrachtberekening moet NBI, KGB, gecorrigeerde bijstandsnorm, woonbudget en andere noodzakelijke lasten zichtbaar verwerken. De draagkracht volgt uit de draagkrachtruimte volgens de toepasselijke formule of tabel.",
  },
  {
    id: "RAPPORT_ALIMENTATIENORMEN_2026_H5",
    title: "Rapport Alimentatienormen 2026 — hoofdstuk 5: stappenplannen en rekenvoorbeelden",
    kind: "guideline",
    jurisdiction: "NL",
    appliesTo: ["stappenplan kinderalimentatie", "stappenplan partneralimentatie", "rekenvoorbeelden", "niet-verwijtbare lasten", "aanvaardbaarheidstoets"],
    url: "https://www.rechtspraak.nl/binaries/_rts_1768906378057/content/assets/lbvr/an/lbvr-an-rapport-alimentatienormen-versie-januari-2026.pdf",
    note: "De implementatie moet de volgorde van het stappenplan kunnen tonen en iedere tussenuitkomst opslaan voor audit en vergelijking.",
  },
  {
    id: "RECHTSPRAAK_EIGEN_AANDEEL_TABEL_2026",
    title: "Bijlage 4 — tabel eigen aandeel van ouders in de kosten van de kinderen",
    kind: "table",
    jurisdiction: "NL",
    appliesTo: ["behoefte", "eigen aandeel", "kinderen", "peiljaar 2026"],
    url: "https://www.rechtspraak.nl/binaries/_rts_1768906378057/content/assets/lbvr/an/lbvr-an-rapport-alimentatienormen-versie-januari-2026.pdf",
    note: "De tabel moet per peiljaar worden ingelezen of als gecontroleerde dataset beschikbaar zijn; het rapport vermeldt dat de tabel in 2025 ingrijpend is gewijzigd en in 2026 opnieuw is aangepast.",
  },
  {
    id: "RECHTSPRAAK_DRAAGKRACHTTABEL_2026",
    title: "Bijlage 5 — draagkrachttabel kinderalimentatie 2026",
    kind: "table",
    jurisdiction: "NL",
    appliesTo: ["draagkracht", "peiljaar 2026", "kinderalimentatie"],
    url: "https://www.rechtspraak.nl/binaries/_rts_1768906378057/content/assets/lbvr/an/lbvr-an-rapport-alimentatienormen-versie-januari-2026.pdf",
    note: "De tabel of de onderliggende formule moet exact en versieerbaar worden verwerkt, inclusief afronding en toepassingsvoorwaarden.",
  },
];

export const ALIMENTATIENORMEN_2026: Alimentatienormen2026Config = {
  sourceId: "RAPPORT_ALIMENTATIENORMEN_2026_VOLLEDIG",
  version: "januari 2026",
  chapters: {
    income: [
      "Hoofdstuk 2: netto besteedbaar gezinsinkomen en netto besteedbaar inkomen",
      "Netto model en bruto model",
      "Kindgebonden budget als afzonderlijke component bij kinderalimentatie",
      "Inkomen uit dienstbetrekking, uitkering, onderneming, DGA en vermogen",
    ],
    need: [
      "Hoofdstuk 3: behoefte en eigen aandeel",
      "Tabel eigen aandeel van ouders in de kosten van de kinderen",
      "Gezinsinkomen tijdens de laatste periode van samenwoning",
      "Schaalvoordelen bij meerdere kinderen",
      "Indexering wanneer een eerder peiljaar wordt gebruikt",
    ],
    capacity: [
      "Hoofdstuk 4: draagkracht",
      "NBI plus toepasselijk KGB",
      "Gecorrigeerde bijstandsnorm",
      "Woonbudget",
      "Andere noodzakelijke lasten en bijzondere omstandigheden",
      "Draagkrachtruimte en toepasselijke draagkrachtformule of draagkrachttabel",
      "Zorgkorting als afzonderlijke stap",
      "Aanvaardbaarheidstoets en inkomensvergelijking waar relevant",
    ],
    workflow: [
      "Hoofdstuk 5: stappenplan kinderalimentatie",
      "Alle tussenstappen, gebruikte tabellen, aannames, overrides en afrondingen opslaan",
      "Afwijkingen van de aanbevelingen expliciet motiveren",
    ],
  },
  calculationAnchors: {
    useNetModelBelowGrossMonthly: 2175,
    useGrossModelFromGrossMonthly: 2175,
    careDiscountRequiresSeparateAssessment: true,
    maximumIsMinimumOfNeedAndCapacity: true,
    childrenUnder21HavePriority: true,
  },
};

export const LEGAL_FRAMEWORK_VERSION = "2026.02";
