import { SegmentPermission } from '../types/crm';

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

export function getDefaultPermissionsForRole(roleName: string): SegmentPermission[] {
  const roleLower = (roleName || '').toLowerCase();
  const isSuper = roleLower === 'super_admin' || roleLower === 'system administrator';
  const isDirectorOrManager = roleLower === 'bd_director' || roleLower === 'bd_manager' || roleLower === 'bd manager' || roleLower.includes('manager') || roleLower.includes('supervisor');
  const isExec = roleLower === 'bd_sr_exec' || roleLower === 'bd_exec' || roleLower === 'bd executive' || roleLower.includes('executive') || roleLower.includes('engineer') || roleLower.includes('counsel');

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
    if (isDirectorOrManager) {
      const isUserMgmt = seg.key === 'users';
      return {
        segmentKey: seg.key,
        segmentLabel: seg.label,
        canView: true,
        canAdd: !isUserMgmt,
        canEdit: !isUserMgmt,
        canDelete: seg.key === 'clients' || seg.key === 'opportunities' || seg.key === 'proposals' || seg.key === 'activities' || seg.key === 'internal',
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
    // Reviewer / Viewer / Analyst
    return {
      segmentKey: seg.key,
      segmentLabel: seg.label,
      canView: seg.key !== 'users',
      canAdd: false,
      canEdit: false,
      canDelete: false,
      canExport: true,
    };
  });
}
