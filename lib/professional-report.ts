import { isReviewBindingCurrent, type ReviewCalculationBinding } from './review-binding';

export type ProfessionalReport = {
  title: string;
  generatedAt: string;
  caseName: string;
  clientName?: string;
  status: string;
  reviewScore?: number;
  reviewStatus?: string;
  calculation: { id?: string; engineVersion?: string; normVersion?: string; fingerprint?: string; createdAt?: string };
  provenance: { snapshotId?: string; fingerprint?: string; engineVersion?: string; normVersion?: string; generatedFromApprovedSnapshot: boolean };
  summary: { childSupportMonthly: number; partnerSupportGrossMonthly: number; partnerSupportNetMonthly: number; totalMonthlyPayments: number; totalNeed: number; totalCapacity: number; capacityDeficit: number };
  children: Array<Record<string, unknown>>;
  parents: Array<Record<string, unknown>>;
  partnerSupport?: Record<string, unknown>;
  audit: { priorityAudit?: Record<string, unknown>; warnings: string[]; disclaimer: string };
};

const num = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;

export function buildProfessionalReport(input: any): ProfessionalReport {
  const result = input.result || {};
  const combined = result.combined || {};
  const parents = Array.isArray(input.data?.parents) ? input.data.parents : [];
  const children = Array.isArray(input.data?.children) ? input.data.children : [];
  const calculations = Array.isArray(input.calculations) ? input.calculations : [];
  const latest = calculations[0];
  const pal = combined.partnerSupport || result.partnerSupport;
  const fingerprint = typeof result.calculationFingerprint === 'string' ? result.calculationFingerprint : undefined;
  const snapshotId = typeof latest?.id === 'string' ? latest.id : undefined;
  const engineVersion = latest?.engineVersion || result.engineVersion;
  const normVersion = latest?.normVersion || result.normVersion;
  const currentBinding: ReviewCalculationBinding | undefined = latest?.id ? {
    calculationId: latest.id,
    fingerprint: fingerprint ?? null,
    engineVersion: engineVersion ?? '',
    normVersion: normVersion ?? '',
  } : undefined;
  const suppliedApprovalBinding = input.approvalBinding as ReviewCalculationBinding | undefined;
  const statusApproved = String(input.reviewStatus || '') === 'APPROVED' || String(input.reviewStatus || '') === 'FINAL';
  const approved = statusApproved && !!currentBinding && !!suppliedApprovalBinding && isReviewBindingCurrent(suppliedApprovalBinding, currentBinding);

  return {
    title: 'Alimenta Pro — professioneel rekenrapport', generatedAt: new Date().toISOString(),
    caseName: String(input.name || 'Onbenoemd dossier'), clientName: input.client?.name || undefined,
    status: String(input.reviewStatus || 'INCOMPLETE'), reviewScore: input.review?.score, reviewStatus: input.reviewStatus,
    calculation: { id: snapshotId, engineVersion, normVersion, fingerprint, createdAt: latest?.createdAt ? new Date(latest.createdAt).toISOString() : undefined },
    provenance: { snapshotId, fingerprint, engineVersion, normVersion, generatedFromApprovedSnapshot: approved },
    summary: {
      childSupportMonthly: num(combined.childSupportTotal),
      partnerSupportGrossMonthly: num(combined.partnerSupportMonthlyGross ?? pal?.monthlyGross ?? pal?.result?.monthlyGross),
      partnerSupportNetMonthly: num(combined.partnerSupportMonthlyNet ?? pal?.monthlyNet ?? pal?.result?.monthlyNet),
      totalMonthlyPayments: num(combined.totalMonthlyPayments || num(combined.childSupportTotal) + num(pal?.monthlyGross ?? pal?.result?.monthlyGross)),
      totalNeed: num(result.totalNeed), totalCapacity: num(result.totalCapacity), capacityDeficit: num(result.capacityDeficit),
    },
    children: children.map((child: any, i: number) => ({ index: i + 1, name: child.name || `Kind ${i + 1}`, age: child.age, residence: child.residence, specialCosts: num(child.specialCosts), ownIncome: num(child.ownIncome) })),
    parents: parents.map((parent: any, i: number) => ({ index: i + 1, name: parent.name || `Ouder ${String.fromCharCode(65 + i)}`, nbi: num(parent.nbi), kgb: num(parent.kgb), housingCosts: num(parent.housing?.monthlyCosts ?? parent.housingCosts), careDaysPerWeek: num(parent.careDaysPerWeek) })),
    partnerSupport: pal || undefined,
    audit: {
      priorityAudit: combined.priorityAudit,
      warnings: Array.from(new Set([...(Array.isArray(result.warnings) ? result.warnings : []), ...(Array.isArray(pal?.warnings) ? pal.warnings : [])].map(String))),
      disclaimer: 'Dit rapport is een professionele reken- en signaleringsweergave. Het systeem neemt geen juridisch besluit en vervangt de professionele beoordeling niet.',
    },
  };
}
