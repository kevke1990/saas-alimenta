import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { requireCaseTenantAccess } from "@/lib/tenant-access";
import { db } from "@/lib/db";
import { calculationLockMessage, isCaseLockedForCalculation } from "@/lib/case-lock";
import { applyIncomeFactMappings, mapApprovedIncomeFacts } from "@/lib/income-fact-provenance";

const isMonthlyUnit = (unit?: string | null) => /monthly|month|maand|per maand/i.test(unit || "");
const isAnnualUnit = (unit?: string | null) => /annual|jaar|per jaar/i.test(unit || "");
const toMonthly = (v: number, unit?: string | null) => (isMonthlyUnit(unit) ? v : Math.round((v / 12) * 100) / 100);
const toAnnual = (v: number, unit?: string | null) => (isMonthlyUnit(unit) && !isAnnualUnit(unit) ? v * 12 : v);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const u = await requireUser();
    const { id } = await params;
    const access = await requireCaseTenantAccess(u.id, id, "PROFESSIONAL");
    const contentType = req.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body: any = isJson
      ? await req.json().catch(() => ({}))
      : Object.fromEntries((await req.formData()).entries());
    const parentIndex = Number(body.parentIndex);
    if (![0, 1].includes(parentIndex)) return new NextResponse("Ongeldige ouder", { status: 422 });

    const c = await db.case.findFirst({ where: { id, organizationId: access.organizationId } });
    if (!c) return new NextResponse("Dossier niet gevonden", { status: 404 });
    if (isCaseLockedForCalculation(c.reviewStatus)) {
      return new NextResponse(calculationLockMessage(c.reviewStatus), { status: 409 });
    }

    const facts = await db.incomeFact.findMany({ where: { caseId: id, status: "APPROVED", parentIndex } });
    if (!facts.length) return new NextResponse("Geen geaccordeerde inkomensfeiten voor deze ouder", { status: 409 });

    let data: any = structuredClone(c.data as any);
    data.parents = data.parents || [{}, {}];
    const mappings = mapApprovedIncomeFacts(
      facts.map((f) => ({
        id: f.id,
        parentIndex: f.parentIndex,
        key: f.key,
        label: f.label,
        valueNumber: f.valueNumber,
        valueText: f.valueText,
        unit: f.unit,
        documentId: f.documentId,
        confidence: f.confidence,
      })),
    );
    data = applyIncomeFactMappings(data, mappings);

    const p = data.parents[parentIndex] || {};
    p.income = p.income || { mode: "GROSS" };
    if (!p.income.mode) p.income.mode = "GROSS";
    for (const f of facts) {
      const v = Number(f.valueNumber) || 0;
      const key = f.key.toLowerCase();
      if (key.includes("salary") || key.includes("grossannual") || key.includes("gross_salary")) {
        p.income.salaryMonthly = toMonthly(v, f.unit);
        p.income.mode = "GROSS";
      } else if (key.includes("holiday")) {
        if (f.unit === "PERCENT") p.income.holidayAllowancePct = v;
        else p.income.holidayAllowanceMonthly = toMonthly(v, f.unit);
      } else if (key.includes("ikb") || key.includes("pkb")) {
        p.income.ikbMonthly = toMonthly(v, f.unit);
      } else if (key.includes("overtime")) {
        p.income.overtimeMonthly = toMonthly(v, f.unit);
      } else if (key.includes("bonus")) {
        p.income.bonusAnnual = toAnnual(v, f.unit);
      } else if (key.includes("13") || key.includes("thirteenth")) {
        p.income.thirteenthMonthAnnual = toAnnual(v, f.unit);
      } else if (key.includes("pension")) {
        p.income.pensionMonthly = toMonthly(v, f.unit);
      } else if (key.includes("net")) {
        p.income.netIncomeMonthly = toMonthly(v, f.unit);
      }
    }
    data.parents[parentIndex] = p;

    await db.$transaction(async (tx) => {
      await tx.case.update({
        where: { id },
        data: {
          data,
          reviewStatus: "INCOMPLETE",
          reviewedAt: null,
          approvedAt: null,
          approvedByUserId: null,
          metadata: { ...((c.metadata as any) || {}), incomeFactsAppliedAt: new Date().toISOString() },
        },
      });
      await tx.auditLog.create({
        data: {
          userId: u.id,
          organizationId: access.organizationId,
          entityType: "CASE",
          entityId: id,
          actorRole: access.role,
          action: "INCOME_FACTS_APPLIED",
          metadata: { caseId: id, parentIndex, factCount: facts.length },
        },
      });
    });

    if (!isJson) {
      return NextResponse.redirect(new URL(`/cases/${id}/documenten`, req.url), 303);
    }
    return NextResponse.json({ ok: true, parentIndex, factCount: facts.length });
  } catch (e: any) {
    return new NextResponse(e?.message || "Inkomen toepassen mislukt", {
      status: e?.message === "UNAUTHORIZED" ? 401 : e?.status === 403 ? 403 : 400,
    });
  }
}

