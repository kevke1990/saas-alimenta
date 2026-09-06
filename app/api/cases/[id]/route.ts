import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculate } from "@/lib/calculator";
import { calculatePartnerSupport } from "@/lib/partner-engine";
import { caseCreateSchema } from "@/lib/case-validation";
import { calculationFingerprint } from "@/lib/calculation-snapshot";
import { buildCombinedAudit } from "@/lib/combined-audit";
import { calculationLockMessage, isCaseLockedForCalculation } from "@/lib/case-lock";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: u.id }, include: { client: true, calculations: true } });
  if (!c) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(c);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: u.id } });
  if (!c) return new NextResponse("Not found", { status: 404 });
  await db.case.update({ where: { id }, data: { status: "ARCHIVED" } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const u = await requireUser();
    const { id } = await params;
    const existing = await db.case.findFirst({
      where: { id, userId: u.id, status: { not: "ARCHIVED" } },
      include: { calculations: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!existing) return new NextResponse("Dossier niet gevonden.", { status: 404 });
    if (isCaseLockedForCalculation(existing.reviewStatus)) {
      return new NextResponse(calculationLockMessage(existing.reviewStatus), { status: 409 });
    }

    const raw = await req.json();
    const parsed = caseCreateSchema.safeParse({
      name: raw.name ?? existing.name,
      clientId: raw.clientId ?? existing.clientId ?? undefined,
      data: raw.data,
      meta: raw.meta,
    });
    if (!parsed.success) return new NextResponse("Ongeldige berekeningsinvoer", { status: 422 });

    const body = parsed.data;
    const calculationInput = {
      ...body.data,
      parents: body.data.parents.map((parent) => ({ ...parent, nbi: Number(parent.nbi ?? 0) })),
    };
    const childResult: any = calculate(calculationInput);
    const childPayments = [0, 0];
    for (const t of childResult.transfers || []) childPayments[t.payerIndex] += Number(t.payment || 0);

    let partnerSupport: any = null;
    if (body.data.partnerSupport?.enabled) {
      const ps = body.data.partnerSupport;
      const payerIndex = ps.payerIndex;
      const recipientIndex = payerIndex === 0 ? 1 : 0;
      const payer = body.data.parents[payerIndex];
      const recipient = body.data.parents[recipientIndex];
      const payerNbi = Number(childResult.incomeResults?.[payerIndex]?.nbiMonthly ?? payer.nbi) || 0;
      const recipientNbi = Number(childResult.incomeResults?.[recipientIndex]?.nbiMonthly ?? recipient.nbi) || 0;
      partnerSupport = calculatePartnerSupport({
        historicalNBGI: Number(ps.historicalNBGI || body.data.historicalNBGI || 0),
        historicalChildCosts: Number(ps.historicalChildCosts || childResult.totalNeed || 0),
        currentChildSupport: childPayments[payerIndex],
        currentRecipientNBI: recipientNbi,
        currentPayerNBI: payerNbi,
        payerTaxableIncomeAnnual: Number(ps.payerTaxableIncomeAnnual || payerNbi * 12),
        payerAow: !!payer.aow,
        payerIsFamily: !!payer.newPartner?.present && !(payer.newPartner.selfSupporting ?? true),
        payerHousingCosts: Number(payer.housing?.monthlyCosts || payer.housingCosts || 0),
        payerMortgageInterestTaxBenefitMonthly: Number(ps.payerMortgageInterestTaxBenefitMonthly || payer.housing?.mortgageInterestTaxBenefitMonthly || 0),
        payerMortgagePrincipalMonthly: Number(payer.housing?.mortgagePrincipalMonthly || 0),
        payerOtherNecessaryCosts: Number(payer.specialNecessaryCosts || 0),
        payerOtherMaintenance: Number(payer.otherMaintenance || 0),
        payerOtherMaintenanceObligations: Number(ps.payerOtherMaintenanceObligations || 0),
        payerPensionProvisionMonthly: Number(ps.payerPensionProvisionMonthly || 0),
        payerCapacityAdjustment: Number(payer.capacityAdjustment || 0),
        recipientVerdiencapaciteit: Number(ps.recipientVerdiencapaciteit || 0),
        recipientOtherIncomeMonthly: Number(ps.recipientOtherIncomeMonthly || 0),
        recipientAssetsIncomeMonthly: Number(ps.recipientAssetsIncomeMonthly || 0),
        payerAssetsIncomeMonthly: 0,
        payerOwnHome: payer.housing?.type === "OWNED",
        incomeComparisonEnabled: !!ps.incomeComparisonEnabled,
        durationException: ps.durationException || "NONE",
        useHofnorm: ps.useHofnorm !== false,
        concreteNeedNet: Number(ps.concreteNeedNet || 0),
        effectiveDate: body.meta?.effectiveDate,
      });
    }

    const childSupportTotal = childPayments.reduce((a, b) => a + b, 0);
    const partnerPayer = body.data.partnerSupport?.enabled ? body.data.partnerSupport.payerIndex : null;
    const partnerGross = Number(partnerSupport?.result?.monthlyGross || 0);
    const partnerNet = Number(partnerSupport?.result?.monthlyNet || 0);
    const combinedPaymentByParent = [childPayments[0], childPayments[1]];
    if (partnerPayer !== null) combinedPaymentByParent[partnerPayer] += partnerGross;
    const totalMonthlyPayments = combinedPaymentByParent.reduce((a, b) => a + b, 0);
    const primaryPayerIndex = partnerPayer !== null ? partnerPayer : childPayments[0] >= childPayments[1] ? 0 : 1;
    const combinedAudit = buildCombinedAudit({
      childSupportByParent: childPayments,
      partnerPayerIndex: partnerPayer,
      partnerMonthlyNet: partnerNet,
      partnerMonthlyGross: partnerGross,
      partnerCapacityRemainingNet: Number(partnerSupport?.capacity?.remainingNet || 0),
    });
    const oldResult: any = existing.result || {};
    const combined = {
      childSupportTotal,
      childSupportByParent: childPayments,
      partnerSupport: partnerSupport ? { payerIndex: partnerPayer, recipientIndex: partnerPayer === null ? null : partnerPayer === 0 ? 1 : 0, monthlyNet: partnerNet, monthlyGross: partnerGross } : null,
      combinedPaymentByParent,
      totalMonthlyPayments,
      primaryPayerIndex,
      priorityAudit: combinedAudit,
      explanation: [
        { label: "Totale kinderalimentatie", value: childSupportTotal },
        { label: "Partneralimentatie netto", value: partnerNet },
        { label: "Partneralimentatie bruto / betaling", value: partnerGross },
        { label: "Totale maandelijkse betalingen", value: totalMonthlyPayments },
      ],
    };
    const productionResult = { ...childResult, combined, partnerSupport, family: oldResult.family, identity: oldResult.identity };
    const fingerprint = calculationFingerprint(body.data, childResult.engineVersion, childResult.normVersion);

    const updated = await db.$transaction(async (tx) => {
      const c = await tx.case.update({
        where: { id },
        data: {
          name: body.name,
          data: body.data,
          result: { ...productionResult, calculationFingerprint: fingerprint },
          status: "CALCULATED",
          reviewStatus: "INCOMPLETE",
          reviewedAt: null,
          approvedAt: null,
          approvedByUserId: null,
          calculationVersion: childResult.normVersion,
          metadata: (body.meta ?? existing.metadata ?? {}) as any,
        },
      });
      await tx.calculation.create({ data: { caseId: id, engineVersion: childResult.engineVersion, normVersion: childResult.normVersion, inputSnapshot: body.data, result: { ...productionResult, calculationFingerprint: fingerprint } } });
      await tx.auditLog.create({ data: { userId: u.id, action: "CASE_RECALCULATED", metadata: { caseId: id, fingerprint, previousCalculationId: existing.calculations[0]?.id || null, engineVersion: childResult.engineVersion, normVersion: childResult.normVersion } } });
      return c;
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return new NextResponse(e?.message || "Wijzigen en herberekenen mislukt", { status: 400 });
  }
}
