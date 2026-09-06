/**
 * Canonical family model for the Alimenta Pro calculation flow.
 *
 * The UI and Case.data may evolve independently, but calculations should
 * consume one explicit family contract so names and family context are not
 * lost between wizard steps, calculation and reporting.
 */

export type FamilyPersonRole = "PARENT_A" | "PARENT_B";
export type RelationshipStatus =
  | "MARRIED"
  | "REGISTERED_PARTNERSHIP"
  | "COHABITING_WITH_AGREEMENT"
  | "COHABITING_WITHOUT_AGREEMENT"
  | "SEPARATED"
  | "DIVORCED"
  | "OTHER";

export type HousingType = "RENT" | "OWN_HOME" | "OTHER";
export type ChildResidence = "A" | "B" | "50-50";

export type FamilyPerson = {
  role: FamilyPersonRole;
  name: string;
  email?: string;
  phone?: string;
};

export type FamilyChild = {
  id: string;
  name: string;
  dateOfBirth?: string;
  age?: number;
  residence: ChildResidence;
  specialCostsMonthly?: number;
  ownIncomeMonthly?: number;
  studyGrantMonthly?: number;
  studentType?: "MBO" | "HBO" | "OTHER";
  livesAtHome?: boolean;
};

export type Housing = {
  type: HousingType;
  monthlyCost?: number;
  mortgageInterestMonthly?: number;
  mortgagePrincipalMonthly?: number;
  housingBenefitMonthly?: number;
  wozValue?: number;
  notes?: string;
};

export type NewPartner = {
  present: boolean;
  name?: string;
  relationshipStatus?: RelationshipStatus;
  netIncomeMonthly?: number;
  grossIncomeMonthly?: number;
  children?: Array<{
    id: string;
    name: string;
    age?: number;
    ownIncomeMonthly?: number;
  }>;
  notes?: string;
};

export type FamilyContext = {
  relationshipStatus: RelationshipStatus;
  separationDate?: string;
  calculationDate?: string;
  parentA: FamilyPerson;
  parentB: FamilyPerson;
  children: FamilyChild[];
  housing: {
    parentA: Housing;
    parentB: Housing;
  };
  newPartners: {
    parentA?: NewPartner;
    parentB?: NewPartner;
  };
};

const nonNegative = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
};

const cleanName = (value: unknown, fallback: string) => {
  const name = String(value ?? "").trim();
  return name || fallback;
};

export function createFamilyContext(input: Partial<FamilyContext> & {
  parentA?: Partial<FamilyPerson>;
  parentB?: Partial<FamilyPerson>;
  children?: FamilyChild[];
}): FamilyContext {
  const children = (input.children ?? []).map((child, index) => ({
    ...child,
    id: String(child.id || `child-${index + 1}`),
    name: cleanName(child.name, `Kind ${index + 1}`),
    residence: child.residence ?? "A",
    specialCostsMonthly: nonNegative(child.specialCostsMonthly),
    ownIncomeMonthly: nonNegative(child.ownIncomeMonthly),
    studyGrantMonthly: nonNegative(child.studyGrantMonthly),
  }));

  return {
    relationshipStatus: input.relationshipStatus ?? "SEPARATED",
    separationDate: input.separationDate,
    calculationDate: input.calculationDate,
    parentA: {
      role: "PARENT_A",
      name: cleanName(input.parentA?.name, "Persoon A"),
      email: input.parentA?.email,
      phone: input.parentA?.phone,
    },
    parentB: {
      role: "PARENT_B",
      name: cleanName(input.parentB?.name, "Persoon B"),
      email: input.parentB?.email,
      phone: input.parentB?.phone,
    },
    children,
    housing: {
      parentA: input.housing?.parentA ?? { type: "RENT", monthlyCost: 0 },
      parentB: input.housing?.parentB ?? { type: "RENT", monthlyCost: 0 },
    },
    newPartners: {
      parentA: input.newPartners?.parentA,
      parentB: input.newPartners?.parentB,
    },
  };
}

export function validateFamilyContext(family: FamilyContext): string[] {
  const errors: string[] = [];
  if (!family.parentA.name.trim()) errors.push("Naam persoon A ontbreekt.");
  if (!family.parentB.name.trim()) errors.push("Naam persoon B ontbreekt.");
  if (family.children.length === 0) errors.push("Minimaal één kind is vereist.");
  if (family.children.length > 10) errors.push("Maximaal 10 kinderen per dossier.");

  for (const [index, child] of family.children.entries()) {
    if (!child.name.trim()) errors.push(`Naam kind ${index + 1} ontbreekt.`);
    if (!child.id.trim()) errors.push(`ID kind ${index + 1} ontbreekt.`);
  }

  for (const [label, housing] of [
    ["persoon A", family.housing.parentA],
    ["persoon B", family.housing.parentB],
  ] as const) {
    if (nonNegative(housing.monthlyCost) < 0) {
      errors.push(`Woonlast ${label} is ongeldig.`);
    }
  }

  return errors;
}

/**
 * Creates a stable, report-friendly identity map. This is intentionally
 * independent of presentation components so every wizard/result/report can
 * use the same names.
 */
export function familyIdentity(family: FamilyContext) {
  return {
    parentA: family.parentA.name,
    parentB: family.parentB.name,
    children: family.children.map((child) => ({ id: child.id, name: child.name })),
    childCount: family.children.length,
  };
}
