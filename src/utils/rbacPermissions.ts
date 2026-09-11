import { SegmentPermission } from '../types/crm';
import { UserRoleEnum } from '../types/database.types';

export type CRMAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'approve' | 'assign' | 'admin';

export const ALL_SEGMENTS: Array<{ key: string; label: string }> = [
  { key: 'clients', label: 'Clients & Corporate Accounts' },
  { key: 'opportunities', label: 'Opportunity & Deal Pipeline' },
  { key: 'proposals', label: 'Commercial Proposals & Calculator' },
  { key: 'activities', label: 'Activities & Client Meetings' },
  { key: 'followups', label: 'Action Follow-ups & Reminders' },
  { key: 'internal', label: 'Internal Operations Tasks' },
  { key: 'documents', label: 'Documents Vault & Contracts' },
  { key: 'segments', label: 'Business Segments & Analytics' },
  { key: 'users', label: 'System Users & Access Controls' },
];

export interface RoleCapabilities {
  role: UserRoleEnum | string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canApprove: boolean;
  canAssign: boolean;
  canAdmin: boolean;
  description: string;
}

export const ROLE_CAPABILITY_MATRIX: Record<string, RoleCapabilities> = {
  super_admin: {
    role: 'super_admin',
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canApprove: true,
    canAssign: true,
    canAdmin: true,
    description: 'Full CRM access, user admin, employee master governance, system configuration, approvals and audit logs.',
  },
  bd_director: {
    role: 'bd_director',
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canApprove: true,
    canAssign: true,
    canAdmin: false,
    description: 'Firm-wide BD pipeline management, deal delegation, commercial sign-off, team assignment & high-level reporting.',
  },
  bd_manager: {
    role: 'bd_manager',
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canApprove: true,
    canAssign: true,
    canAdmin: false,
    description: 'Regional team & client management, opportunity allocation, proposal appraisals and operational follow-ups.',
  },
  bd_sr_exec: {
    role: 'bd_sr_exec',
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canApprove: false,
    canAssign: false,
    canAdmin: false,
    description: 'Enterprise pipeline origination, client interactions, meeting logs, task delegation and opportunity progression.',
  },
  bd_exec: {
    role: 'bd_exec',
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: false,
    canApprove: false,
    canAssign: false,
    canAdmin: false,
    description: 'Assigned accounts, daily sales prospecting, physical/virtual meetings and reminder management.',
  },
  management_viewer: {
    role: 'management_viewer',
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: true,
    canApprove: false,
    canAssign: false,
    canAdmin: false,
    description: 'Read-only executive analytics dashboards, MMR financial metrics, reports and contract inspection.',
  },
  analyst: {
    role: 'analyst',
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: true,
    canApprove: false,
    canAssign: false,
    canAdmin: false,
    description: 'Data analytics, pipeline velocity tracking, market segment trends and data export.',
  },
};

export function getRoleCapabilities(roleName?: string): RoleCapabilities {
  const normalized = (roleName || '').toLowerCase().replace(/ /g, '_');
  if (normalized === 'system_administrator' || normalized === 'super_admin') {
    return ROLE_CAPABILITY_MATRIX.super_admin;
  }
  if (normalized === 'director' || normalized === 'bd_director') {
    return ROLE_CAPABILITY_MATRIX.bd_director;
  }
  if (normalized === 'bd_manager' || normalized.includes('manager')) {
    return ROLE_CAPABILITY_MATRIX.bd_manager;
  }
  if (normalized === 'senior_bd_executive' || normalized === 'bd_sr_exec') {
    return ROLE_CAPABILITY_MATRIX.bd_sr_exec;
  }
  if (normalized === 'management_reviewer' || normalized === 'management_viewer') {
    return ROLE_CAPABILITY_MATRIX.management_viewer;
  }
  if (normalized === 'business_analyst' || normalized === 'analyst') {
    return ROLE_CAPABILITY_MATRIX.analyst;
  }
  if (ROLE_CAPABILITY_MATRIX[normalized]) {
    return ROLE_CAPABILITY_MATRIX[normalized];
  }
  return ROLE_CAPABILITY_MATRIX.bd_exec;
}

export function canPerformAction(roleName: string | undefined, action: CRMAction): boolean {
  const caps = getRoleCapabilities(roleName);
  switch (action) {
    case 'view':
      return caps.canView;
    case 'create':
      return caps.canCreate;
    case 'edit':
      return caps.canEdit;
    case 'delete':
      return caps.canDelete;
    case 'export':
      return caps.canExport;
    case 'approve':
      return caps.canApprove;
    case 'assign':
      return caps.canAssign;
    case 'admin':
      return caps.canAdmin;
    default:
      return false;
  }
}

export function getDefaultPermissionsForRole(roleName: string): SegmentPermission[] {
  const roleLower = (roleName || '').toLowerCase().replace(/ /g, '_');
  const isSuper = roleLower === 'super_admin' || roleLower === 'system_administrator';
  const isDirector = roleLower === 'bd_director';
  const isManager = roleLower === 'bd_manager' || roleLower.includes('manager') || roleLower.includes('supervisor');
  const isSrExec = roleLower === 'bd_sr_exec' || roleLower.includes('senior');
  const isExec = roleLower === 'bd_exec' || roleLower.includes('executive') || roleLower.includes('engineer') || roleLower.includes('counsel');
  const isViewer = roleLower === 'management_viewer' || roleLower === 'management_reviewer';
  const isAnalyst = roleLower === 'analyst' || roleLower === 'business_analyst';

  return ALL_SEGMENTS.map((seg) => {
    if (isSuper) {
      return {
        segmentKey: seg.key,
        segmentLabel: seg.label,
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
      };
    }
    if (isDirector) {
      const isUserMgmt = seg.key === 'users';
      return {
        segmentKey: seg.key,
        segmentLabel: seg.label,
        canView: true,
        canAdd: !isUserMgmt,
        canEdit: !isUserMgmt,
        canDelete: seg.key !== 'users' && seg.key !== 'segments',
        canExport: true,
      };
    }
    if (isManager) {
      const isUserMgmt = seg.key === 'users' || seg.key === 'segments';
      return {
        segmentKey: seg.key,
        segmentLabel: seg.label,
        canView: true,
        canAdd: !isUserMgmt,
        canEdit: !isUserMgmt,
        canDelete: seg.key === 'clients' || seg.key === 'opportunities' || seg.key === 'proposals' || seg.key === 'activities' || seg.key === 'followups' || seg.key === 'internal',
        canExport: true,
      };
    }
    if (isSrExec) {
      const restricted = seg.key === 'users' || seg.key === 'segments';
      return {
        segmentKey: seg.key,
        segmentLabel: seg.label,
        canView: !restricted,
        canAdd: !restricted,
        canEdit: !restricted,
        canDelete: false,
        canExport: true,
      };
    }
    if (isExec) {
      const restricted = seg.key === 'users' || seg.key === 'segments';
      return {
        segmentKey: seg.key,
        segmentLabel: seg.label,
        canView: !restricted,
        canAdd: !restricted,
        canEdit: !restricted,
        canDelete: false,
        canExport: false,
      };
    }
    if (isViewer || isAnalyst) {
      return {
        segmentKey: seg.key,
        segmentLabel: seg.label,
        canView: seg.key !== 'users',
        canAdd: false,
        canEdit: false,
        canDelete: false,
        canExport: true,
      };
    }
    // Default fallback
    return {
      segmentKey: seg.key,
      segmentLabel: seg.label,
      canView: seg.key !== 'users',
      canAdd: false,
      canEdit: false,
      canDelete: false,
      canExport: false,
    };
  });
}

/**
 * Filters CRM records (opportunities, clients, activities, followups) based on active user role.
 * Executive: Individual assigned records.
 * Manager: Regional & team records.
 * Director / Super Admin / Viewer: Firm-wide records.
 */
export function scopeRecordsByUserRole<T extends Record<string, any>>(
  records: T[],
  currentUser: { name?: string; email?: string; employee_id?: string; team_id?: string; region?: string },
  currentRole: UserRoleEnum | string,
  ownerKey: keyof T = 'owner'
): T[] {
  if (!records || records.length === 0) return [];

  const roleStr = (typeof currentRole === 'string' ? currentRole : '').toLowerCase().replace(/ /g, '_');
  const isFirmWide =
    roleStr === 'super_admin' ||
    roleStr === 'system_administrator' ||
    roleStr === 'bd_director' ||
    roleStr === 'management_viewer' ||
    roleStr === 'management_reviewer' ||
    roleStr === 'analyst' ||
    roleStr === 'business_analyst';

  if (isFirmWide) {
    return records;
  }

  const userName = (currentUser.name || '').toLowerCase();
  const userEmail = (currentUser.email || '').toLowerCase();
  const userEmpId = (currentUser.employee_id || '').toLowerCase();

  const isManager = roleStr === 'bd_manager' || roleStr.includes('manager') || roleStr.includes('supervisor');

  if (isManager) {
    return records.filter((r) => {
      const val = String(r[ownerKey] || r.accountOwner || r.user || r.assigned_to || r.owner || '').toLowerCase();
      const matchName = Boolean(userName && val.includes(userName));
      const matchEmail = Boolean(userEmail && val.includes(userEmail));
      const matchEmp = Boolean(userEmpId && val.includes(userEmpId));
      const matchRegion = Boolean(r.region && currentUser.region && String(r.region).toLowerCase() === String(currentUser.region).toLowerCase());
      const matchTeam = Boolean(r.team_id && currentUser.team_id && r.team_id === currentUser.team_id);

      return matchName || matchEmail || matchEmp || matchRegion || matchTeam;
    });
  }

  // BD Executive / Senior Executive scope: records owned by the user
  return records.filter((r) => {
    const val = String(r[ownerKey] || r.accountOwner || r.user || r.assigned_to || r.created_by || r.owner || '').toLowerCase();
    if (!val || val === 'all' || val === 'system') return true;
    const matchName = userName && val.includes(userName);
    const matchEmail = userEmail && val.includes(userEmail);
    const matchEmp = userEmpId && val.includes(userEmpId);
    return Boolean(matchName || matchEmail || matchEmp);
  });
}
