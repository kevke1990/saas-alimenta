import { describe, expect, it } from "vitest";
import { createFamilyContext, familyIdentity, validateFamilyContext } from "./family-model";

describe("canonical family model", () => {
  it("keeps both parent identities and every child identity together", () => {
    const family = createFamilyContext({
      relationshipStatus: "DIVORCED",
      parentA: { role: "PARENT_A", name: "Ouder A" },
      parentB: { role: "PARENT_B", name: "Ouder B" },
      children: [
        { id: "yuna", name: "Yuna", residence: "A" },
        { id: "jayda", name: "Jayda", residence: "B" },
      ],
    });

    expect(familyIdentity(family)).toEqual({
      parentA: "Ouder A",
      parentB: "Ouder B",
      children: [
        { id: "yuna", name: "Yuna", gender: "ONBEKEND" },
        { id: "jayda", name: "Jayda", gender: "ONBEKEND" },
      ],
      childCount: 2,
    });
  });

  it("supports housing, relationship status and new partner context", () => {
    const family = createFamilyContext({
      relationshipStatus: "REGISTERED_PARTNERSHIP",
      parentA: { role: "PARENT_A", name: "Ouder A" },
      parentB: { role: "PARENT_B", name: "Ouder B" },
      children: [{ id: "child-1", name: "Kind", residence: "50-50" }],
      housing: {
        parentA: { type: "OWN_HOME", monthlyCost: 1650, wozValue: 420000 },
        parentB: { type: "RENT", monthlyCost: 1100 },
      },
      newPartners: {
        parentB: {
          present: true,
          name: "Nieuwe partner",
          relationshipStatus: "COHABITING_WITH_AGREEMENT",
          netIncomeMonthly: 2800,
          children: [{ id: "partner-child", name: "Stiefkind", age: 8 }],
        },
      },
    });

    expect(family.relationshipStatus).toBe("REGISTERED_PARTNERSHIP");
    expect(family.housing.parentA.type).toBe("OWN_HOME");
    expect(family.housing.parentB.monthlyCost).toBe(1100);
    expect(family.newPartners.parentB?.children?.[0].name).toBe("Stiefkind");
    expect(validateFamilyContext(family)).toEqual([]);
  });

  it("creates stable fallback identities when the wizard has incomplete labels", () => {
    const family = createFamilyContext({
      children: [{ id: "", name: "", residence: "A" }],
    });

    expect(family.parentA.name).toBe("Persoon A");
    expect(family.parentB.name).toBe("Persoon B");
    expect(family.children[0].name).toBe("Kind 1");
    expect(family.children[0].id).toBe("child-1");
  });
});
