export const OPPORTUNITY_STAGE_MAP = [
  { dbValue: 'Lead / Inception', label: 'Lead / Inception' },
  { dbValue: 'Discovery & Requirement', label: 'Discovery & Requirement' },
  { dbValue: 'Proposal Formulation', label: 'Proposal / Commercial Shared' },
  { dbValue: 'Commercial Discussion', label: 'Commercial Discussion' },
  { dbValue: 'Executive Review', label: 'Executive Review' },
  { dbValue: 'Negotiation & Legal', label: 'Negotiation & Legal' },
  { dbValue: 'Closed Won', label: 'Won' },
  { dbValue: 'Closed Lost', label: 'Lost' },
  { dbValue: 'On Hold', label: 'On Hold' }
] as const;

export const OPPORTUNITY_STATUS_MAP = [
  { dbValue: 'Open', label: 'Open' },
  { dbValue: 'In Process', label: 'In Process' },
  { dbValue: 'Won', label: 'Won' },
  { dbValue: 'Lost', label: 'Lost' },
  { dbValue: 'On Hold', label: 'On Hold' },
  { dbValue: 'Closed', label: 'Closed' }
] as const;

export const DELEGATION_STATUS_MAP = [
  { dbValue: 'Pending Action', label: 'Pending Action' },
  { dbValue: 'In Review', label: 'In Review' },
  { dbValue: 'Approved & Handed Off', label: 'Approved & Handed Off' },
  { dbValue: 'Action Completed', label: 'Action Completed' },
  { dbValue: 'Escalated', label: 'Escalated' },
  { dbValue: 'Rejected', label: 'Rejected' }
] as const;

export const PIPELINE_STAGES = OPPORTUNITY_STAGE_MAP.map(s => s.label);
export const OPPORTUNITY_STATUSES = OPPORTUNITY_STATUS_MAP.map(s => s.label);
export const DELEGATION_STATUSES = DELEGATION_STATUS_MAP.map(s => s.label);

export function getStageDbValue(uiLabel: string): string {
  const match = OPPORTUNITY_STAGE_MAP.find(m => m.label === uiLabel);
  return match ? match.dbValue : 'Lead / Inception'; // Fallback
}

export function getStageUiLabel(dbValue: string): string {
  const match = OPPORTUNITY_STAGE_MAP.find(m => m.dbValue === dbValue);
  return match ? match.label : 'Lead / Inception'; // Fallback
}

export function getStatusDbValue(uiLabel: string): string {
  const match = OPPORTUNITY_STATUS_MAP.find(m => m.label === uiLabel);
  return match ? match.dbValue : 'Open'; // Fallback
}

export function getStatusUiLabel(dbValue: string): string {
  const match = OPPORTUNITY_STATUS_MAP.find(m => m.dbValue === dbValue);
  return match ? match.label : 'Open'; // Fallback
}

export function getDelegationStatusDbValue(uiLabel: string): string {
  const match = DELEGATION_STATUS_MAP.find(m => m.label === uiLabel);
  return match ? match.dbValue : 'Pending Action'; // Fallback
}

export function getDelegationStatusUiLabel(dbValue: string): string {
  const match = DELEGATION_STATUS_MAP.find(m => m.dbValue === dbValue);
  return match ? match.label : 'Pending Action'; // Fallback
}
