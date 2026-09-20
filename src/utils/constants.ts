/**
 * CANONICAL OPPORTUNITY ENUM MAPPINGS
 * ─────────────────────────────────────────────────────────────────────────────
 * Source of truth: LIVE production PostgreSQL enums at:
 *   lyaryldpiviaytcarbtn.supabase.co
 *
 * Confirmed via:
 *   - MODULES_SALES_OPERATIONS_REVIEW_MIGRATION.sql (first to execute, created
 *     the types; subsequent migrations silently skipped by EXCEPTION WHEN
 *     duplicate_object)
 *   - Production error rejection of 'In Process' as opportunity_status_enum value
 *
 * LIVE opportunity_stage_enum values:
 *   'Lead / Inception', 'Discovery & Requirement', 'Proposal Formulation',
 *   'Commercial Discussion', 'Executive Review', 'Negotiation & Legal',
 *   'Won & Handed Off', 'Lost'
 *
 * LIVE opportunity_status_enum values:
 *   'Open', 'Won', 'Lost', 'On Hold', 'Discarded'
 *
 * LIVE delegation_status_enum values:
 *   'Pending Action', 'In Review', 'Approved & Handed Off',
 *   'Action Completed', 'Escalated', 'Rejected'
 *
 * DESIGN DECISION:
 *   UI labels match DB values 1:1 EXCEPT for stages where the DB value
 *   'Proposal Formulation' is shown to users as 'Proposal / Commercial Shared'
 *   and 'Won & Handed Off' is shown as 'Won' for brevity.
 *   No silent aliasing of unsupported values (e.g. old 'In Process', 'Closed',
 *   'Closed Won', 'Closed Lost') is permitted.
 */

export const OPPORTUNITY_STAGE_MAP = [
  { dbValue: 'Lead / Inception',       label: 'Lead / Inception' },
  { dbValue: 'Discovery & Requirement', label: 'Discovery & Requirement' },
  { dbValue: 'Proposal Formulation',   label: 'Proposal / Commercial Shared' },
  { dbValue: 'Commercial Discussion',  label: 'Commercial Discussion' },
  { dbValue: 'Executive Review',       label: 'Executive Review' },
  { dbValue: 'Negotiation & Legal',    label: 'Negotiation & Legal' },
  { dbValue: 'Won & Handed Off',       label: 'Won' },
  { dbValue: 'Lost',                   label: 'Lost' },
] as const;

/**
 * LIVE opportunity_status_enum values exposed directly as UI labels.
 * 'In Process' and 'Closed' were from the older initial migration and do NOT
 * exist in the live database. They are NOT silently aliased.
 */
export const OPPORTUNITY_STATUS_MAP = [
  { dbValue: 'Open',      label: 'Open' },
  { dbValue: 'Won',       label: 'Won' },
  { dbValue: 'Lost',      label: 'Lost' },
  { dbValue: 'On Hold',   label: 'On Hold' },
  { dbValue: 'Discarded', label: 'Discarded' },
] as const;

export const DELEGATION_STATUS_MAP = [
  { dbValue: 'Pending Action',       label: 'Pending Action' },
  { dbValue: 'In Review',            label: 'In Review' },
  { dbValue: 'Approved & Handed Off', label: 'Approved & Handed Off' },
  { dbValue: 'Action Completed',     label: 'Action Completed' },
  { dbValue: 'Escalated',            label: 'Escalated' },
  { dbValue: 'Rejected',             label: 'Rejected' },
] as const;

export const PIPELINE_STAGES = OPPORTUNITY_STAGE_MAP.map(s => s.label);
export const OPPORTUNITY_STATUSES = OPPORTUNITY_STATUS_MAP.map(s => s.label);
export const DELEGATION_STATUSES = DELEGATION_STATUS_MAP.map(s => s.label);

// ─── UI → DB ─────────────────────────────────────────────────────────────────

export function getStageDbValue(uiLabel: string): string {
  const match = OPPORTUNITY_STAGE_MAP.find(m => m.label === uiLabel);
  // If value is already a valid DB value (e.g. 'Proposal Formulation'), pass through
  const directMatch = OPPORTUNITY_STAGE_MAP.find(m => m.dbValue === uiLabel);
  return match ? match.dbValue : (directMatch ? directMatch.dbValue : 'Lead / Inception');
}

export function getStatusDbValue(uiLabel: string): string {
  const match = OPPORTUNITY_STATUS_MAP.find(m => m.label === uiLabel);
  const directMatch = OPPORTUNITY_STATUS_MAP.find(m => m.dbValue === uiLabel);
  return match ? match.dbValue : (directMatch ? directMatch.dbValue : 'Open');
}

export function getDelegationStatusDbValue(uiLabel: string): string {
  const match = DELEGATION_STATUS_MAP.find(m => m.label === uiLabel);
  const directMatch = DELEGATION_STATUS_MAP.find(m => m.dbValue === uiLabel);
  return match ? match.dbValue : (directMatch ? directMatch.dbValue : 'Pending Action');
}

// ─── DB → UI ─────────────────────────────────────────────────────────────────

export function getStageUiLabel(dbValue: string): string {
  const match = OPPORTUNITY_STAGE_MAP.find(m => m.dbValue === dbValue);
  return match ? match.label : dbValue; // Fall back to raw value rather than wrong label
}

export function getStatusUiLabel(dbValue: string): string {
  const match = OPPORTUNITY_STATUS_MAP.find(m => m.dbValue === dbValue);
  return match ? match.label : dbValue;
}

export function getDelegationStatusUiLabel(dbValue: string): string {
  const match = DELEGATION_STATUS_MAP.find(m => m.dbValue === dbValue);
  return match ? match.label : dbValue;
}
