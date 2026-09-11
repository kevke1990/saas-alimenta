export const DOCUMENT_CATEGORIES = [
  "INKOMEN",
  "WOONLASTEN",
  "TOESLAGEN",
  "KINDEREN",
  "JURIDISCH",
  "OVERIG",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export type Classification = {
  category: DocumentCategory;
  confidence: number;
  reason: string;
};

const rules: Array<[DocumentCategory, RegExp, string]> = [
  ["INKOMEN", /loonstrook|salaris|jaaropgaaf|werkgeversverklaring|uwv|uitkering|arbeidscontract/i, "Inkomensdocument herkend"],
  ["WOONLASTEN", /huurcontract|huurovereenkomst|hypotheek|hypotheekrente|woonlast/i, "Woonlastdocument herkend"],
  ["TOESLAGEN", /toeslag|kinderopvangtoeslag|kindgebonden budget|kgb|belastingdienst/i, "Toeslagen-/Belastingdienstdocument herkend"],
  ["KINDEREN", /school|kinderopvang|zorgregeling|ouderschapsplan|kind/i, "Document met kind-/zorgcontext herkend"],
  ["JURIDISCH", /beschikking|vonnis|arrest|echtscheiding|alimentatie|advocaat|rechtbank/i, "Juridisch document herkend"],
];

/** Deterministic pre-classification. AI can refine it later, but this never invents a fact. */
export function classifyDocument(name: string, extractedText = ""): Classification {
  const haystack = `${name}\n${extractedText}`.slice(0, 100_000);
  for (const [category, pattern, reason] of rules) {
    if (pattern.test(haystack)) return { category, confidence: 0.85, reason };
  }
  return { category: "OVERIG", confidence: 0.35, reason: "Geen betrouwbare documentcategorie herkend" };
}
