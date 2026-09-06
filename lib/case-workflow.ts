export type CaseWorkflowStep =
  | 'CALCULATION'
  | 'SCENARIOS'
  | 'HISTORY'
  | 'REVIEW'
  | 'REPORT';

export type CaseWorkflowStatus =
  | 'INCOMPLETE'
  | 'READY_FOR_REVIEW'
  | 'REVIEWED'
  | 'APPROVED'
  | 'FINAL';

export type CaseWorkflowState = {
  status: CaseWorkflowStatus;
  hasCalculation: boolean;
  hasScenarios: boolean;
  hasHistory: boolean;
  reviewReady: boolean;
  reportAvailable: boolean;
};

export type CaseWorkflowItem = {
  step: CaseWorkflowStep;
  label: string;
  href: string;
  complete: boolean;
  active: boolean;
  locked: boolean;
  required: boolean;
  description: string;
};

export function buildCaseWorkflow(id: string, state: CaseWorkflowState): CaseWorkflowItem[] {
  const finalised = state.status === 'FINAL';
  const approved = state.status === 'APPROVED' || finalised;

  return [
    { step: 'CALCULATION', label: 'Berekening', href: `/cases/${id}`, complete: state.hasCalculation, active: state.hasCalculation, locked: approved, required: true, description: 'Actuele berekening en betalingsverplichting.' },
    { step: 'SCENARIOS', label: 'Scenario’s', href: `/cases/${id}/scenarios`, complete: state.hasScenarios, active: state.hasCalculation, locked: approved, required: false, description: 'Alternatieve uitgangspunten vergelijken en toepassen.' },
    { step: 'HISTORY', label: 'Historie', href: `/cases/${id}/history`, complete: state.hasHistory, active: state.hasHistory, locked: false, required: false, description: 'Ongewijzigde berekeningssnapshots en auditgeschiedenis.' },
    { step: 'REVIEW', label: 'Professionele review', href: `/cases/${id}/review`, complete: state.status === 'REVIEWED' || approved, active: state.reviewReady || state.status === 'REVIEWED', locked: false, required: true, description: 'Signalen beoordelen, opmerkingen vastleggen en goedkeuren.' },
    { step: 'REPORT', label: 'Rapport', href: `/api/cases/${id}/report`, complete: state.reportAvailable, active: state.hasCalculation, locked: false, required: true, description: 'Professioneel rapport op basis van de actuele snapshot.' },
  ];
}

export function getNextCaseWorkflowStep(items: CaseWorkflowItem[]): CaseWorkflowItem | null {
  return items.find((item) => item.required && !item.complete && item.active && !item.locked)
    || items.find((item) => item.required && !item.complete && !item.locked)
    || null;
}

export function workflowStatusLabel(status: CaseWorkflowStatus): string {
  return {
    INCOMPLETE: 'Nog te controleren',
    READY_FOR_REVIEW: 'Klaar voor review',
    REVIEWED: 'Gereviewd',
    APPROVED: 'Goedgekeurd',
    FINAL: 'Definitief',
  }[status];
}
