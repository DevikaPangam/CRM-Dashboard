import { CRMModuleKey, PermissionActionEnum } from '../types/database.types';

export interface ModuleAccessRequirement {
  module: CRMModuleKey;
  action: PermissionActionEnum;
  label: string;
}

/**
 * Centralized Single Source of Truth for Module & Tab Authorization Mapping.
 * Maps frontend tab identifiers to canonical DB permission keys and actions.
 */
export const TAB_MODULE_ACCESS_MAP: Record<string, ModuleAccessRequirement> = {
  'tab-dashboard': { module: 'dashboard', action: 'view', label: 'Executive Dashboard' },
  'tab-clients': { module: 'clients', action: 'view', label: 'Client Master Directory' },
  'tab-employee-master': { module: 'team', action: 'view', label: 'Employee Master' },
  'tab-team': { module: 'team', action: 'view', label: 'BD Team' },
  'tab-employee-profile': { module: 'team', action: 'view', label: 'Employee Profile & Performance' },
  'tab-segments': { module: 'segments', action: 'view', label: 'Business Segments' },
  'tab-opportunities': { module: 'opportunities', action: 'view', label: 'Opportunities & Leads' },
  'tab-calculator': { module: 'calculator', action: 'view', label: 'Proposal Calculator' },
  'tab-activities': { module: 'activities', action: 'view', label: 'Interactions & Activities' },
  'tab-followups': { module: 'followups', action: 'view', label: 'Follow-up Tracker' },
  'tab-internal': { module: 'internal', action: 'view', label: 'Internal Tasks' },
  'tab-documents': { module: 'documents', action: 'view', label: 'Stage Documents' },
  'tab-review': { module: 'review', action: 'view', label: 'Monthly Management Review' },
  'tab-users': { module: 'users', action: 'view', label: 'System Users & Access Control' },
};

/**
 * Returns the access requirement for a tab, or null if unknown.
 */
export const getTabAccessRequirement = (tabId: string): ModuleAccessRequirement | null => {
  return TAB_MODULE_ACCESS_MAP[tabId] || null;
};

/**
 * Returns the first authorized default tab for a user based on live `can(module, action)` resolver.
 * Prefers 'tab-dashboard' if view permission is granted, otherwise picks the first permitted tab.
 */
export const getAuthorizedDefaultTab = (
  can: (module: CRMModuleKey, action: PermissionActionEnum) => boolean
): string => {
  if (can('dashboard', 'view')) {
    return 'tab-dashboard';
  }
  const permittedEntry = Object.entries(TAB_MODULE_ACCESS_MAP).find(([, req]) =>
    can(req.module, req.action)
  );
  return permittedEntry ? permittedEntry[0] : 'tab-dashboard';
};
