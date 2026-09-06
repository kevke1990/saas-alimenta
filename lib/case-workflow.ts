export type CaseWorkflowStep =
  | 'CALCULATION'
  | 'SCENARIOS'
  | 'HISTORY'
  | 'REVIEW'
  | 'REPORT';

export type CaseWorkflowStatus =
  | 'INCOMPLETE'
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
  description: string;
};

export function buildCaseWorkflow(id: string, state: CaseWorkflowState): CaseWorkflowItem[] {
  return [
    {
      step: 'CALCULATION',
      label: 'Berekening',
      href: `/cases/${id}`,
      complete: state.hasCalculation,
      active: state.hasCalculation,
      description: 'Actuele berekening en betalingsverplichting.',
    },
    {
      step: 'SCENARIOS',
      label: 'Scenario’s',
      href: `/cases/${id}/scenarios`,
      complete: state.hasScenarios,
      active: state.hasCalculation,
      description: 'Alternatieve uitgangspunten vergelijken en toepassen.',
    },
    {
      step: 'HISTORY',
      label: 'Historie',
      href: `/cases/${id}/history`,
      complete: state.hasHistory,
      active: state.hasHistory,
      description: 'Ongewijzigde berekeningssnapshots en auditgeschiedenis.',
    },
    {
      step: 'REVIEW',
      label: 'Professionele review',
      href: `/cases/${id}/review`,
      complete: state.status === 'REVIEWED' || state.status === 'APPROVED' || state.status === 'FINAL',
      active: state.reviewReady,
      description: 'Signalen beoordelen, opmerkingen vastleggen en goedkeuren.',
    },
    {
      step: 'REPORT',
      label: 'Rapport',
      href: `/api/cases/${id}/report`,
      complete: state.reportAvailable,
      active: state.hasCalculation,
      description: 'Professioneel rapport op basis van de actuele snapshot.',
    },
  ];
}
