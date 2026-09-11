import React from 'react';
import { SegmentPermission } from '../../types/crm';
import { getDefaultPermissionsForRole } from '../../utils/rbacPermissions';
import { CheckSquare, Square, RotateCcw, ShieldCheck } from 'lucide-react';

interface Props {
  permissions: SegmentPermission[];
  onChange: (permissions: SegmentPermission[]) => void;
  roleName?: string;
  roleLabel?: string;
  readOnly?: boolean;
  isLoading?: boolean;
}

export const SegmentPermissionsMatrix: React.FC<Props> = ({
  permissions,
  onChange,
  roleName = 'bd_exec',
  roleLabel,
  readOnly = false,
  isLoading = false,
}) => {
  const displayRole = roleLabel || roleName.replace(/_/g, ' ').toUpperCase();

  const handleToggle = (segmentKey: string, field: keyof Omit<SegmentPermission, 'segmentKey' | 'segmentLabel'>) => {
    if (readOnly || isLoading) return;
    const updated = permissions.map((p) => {
      if (p.segmentKey === segmentKey) {
        return { ...p, [field]: !p[field] };
      }
      return p;
    });
    onChange(updated);
  };

  const handleSelectAll = (field: keyof Omit<SegmentPermission, 'segmentKey' | 'segmentLabel'>, value: boolean) => {
    if (readOnly || isLoading) return;
    const updated = permissions.map((p) => ({ ...p, [field]: value }));
    onChange(updated);
  };

  const handleResetDefaults = () => {
    if (readOnly || isLoading) return;
    const defaults = getDefaultPermissionsForRole(roleName);
    onChange(defaults);
  };

  return (
    <div style={{ marginTop: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
      {/* Explicit Enterprise Role-Level Scope Warning Banner */}
      <div
        style={{
          padding: '10px 14px',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '6px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
        }}
      >
        <ShieldCheck size={18} style={{ color: '#1d4ed8', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '12px', color: '#1e40af', lineHeight: '1.45' }}>
          <strong style={{ display: 'block', marginBottom: '2px', color: '#1e3a8a' }}>
            Enterprise Role Permissions — {displayRole}
          </strong>
          <span>
            These permissions are assigned at the <strong>ROLE level</strong>. Changes will apply to <strong>ALL users</strong> assigned to this role in this organization.
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <strong style={{ fontSize: '13px', color: '#0f172a' }}>
              Action Permission Matrix ({displayRole})
            </strong>
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b', display: 'block', marginTop: '2px' }}>
            Source of truth: Supabase role_permissions. Configures enterprise RBAC action access for this role.
          </span>
        </div>

        {!readOnly && !isLoading && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleSelectAll('canAdd', true)}
              style={{ fontSize: '11px', padding: '4px 8px' }}
              title="Enable Addition across all segments (in memory until saved)"
            >
              + Allow All Addition
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleSelectAll('canEdit', true)}
              style={{ fontSize: '11px', padding: '4px 8px' }}
              title="Enable Edit across all segments (in memory until saved)"
            >
              + Allow All Edit
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleResetDefaults}
              style={{ fontSize: '11px', padding: '4px 8px', color: '#0284c7', borderColor: '#bae6fd' }}
              title="Reset in-memory matrix to baseline role defaults"
            >
              <RotateCcw size={12} />
              Reset Defaults
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
          <span>Loading active role permissions from Supabase...</span>
        </div>
      ) : (

      <div style={{ overflowX: 'auto' }}>
        <table className="crm-table" style={{ fontSize: '12px', width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '8px 10px', color: '#475569', fontWeight: 700 }}>Segment / Module</th>
              <th style={{ textAlign: 'center', padding: '8px', color: '#4f46e5', width: '15%' }}>👁️ View</th>
              <th style={{ textAlign: 'center', padding: '8px', color: '#059669', width: '15%' }}>➕ Addition</th>
              <th style={{ textAlign: 'center', padding: '8px', color: '#2563eb', width: '15%' }}>✏️ Edit</th>
              <th style={{ textAlign: 'center', padding: '8px', color: '#dc2626', width: '15%' }}>🗑️ Delete</th>
              <th style={{ textAlign: 'center', padding: '8px', color: '#9333ea', width: '15%' }}>📥 Export</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((perm) => (
              <tr key={perm.segmentKey} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1e293b' }}>
                  {perm.segmentLabel}
                </td>

                {/* View */}
                <td style={{ textAlign: 'center', padding: '6px' }}>
                  <input
                    type="checkbox"
                    checked={perm.canView}
                    disabled={readOnly}
                    onChange={() => handleToggle(perm.segmentKey, 'canView')}
                    style={{ width: '16px', height: '16px', cursor: readOnly ? 'default' : 'pointer', accentColor: '#4f46e5' }}
                  />
                </td>

                {/* Addition (Create) */}
                <td style={{ textAlign: 'center', padding: '6px' }}>
                  <input
                    type="checkbox"
                    checked={perm.canAdd}
                    disabled={readOnly}
                    onChange={() => handleToggle(perm.segmentKey, 'canAdd')}
                    style={{ width: '16px', height: '16px', cursor: readOnly ? 'default' : 'pointer', accentColor: '#059669' }}
                  />
                </td>

                {/* Edit */}
                <td style={{ textAlign: 'center', padding: '6px' }}>
                  <input
                    type="checkbox"
                    checked={perm.canEdit}
                    disabled={readOnly}
                    onChange={() => handleToggle(perm.segmentKey, 'canEdit')}
                    style={{ width: '16px', height: '16px', cursor: readOnly ? 'default' : 'pointer', accentColor: '#2563eb' }}
                  />
                </td>

                {/* Delete */}
                <td style={{ textAlign: 'center', padding: '6px' }}>
                  <input
                    type="checkbox"
                    checked={perm.canDelete}
                    disabled={readOnly}
                    onChange={() => handleToggle(perm.segmentKey, 'canDelete')}
                    style={{ width: '16px', height: '16px', cursor: readOnly ? 'default' : 'pointer', accentColor: '#dc2626' }}
                  />
                </td>

                {/* Export */}
                <td style={{ textAlign: 'center', padding: '6px' }}>
                  <input
                    type="checkbox"
                    checked={perm.canExport}
                    disabled={readOnly}
                    onChange={() => handleToggle(perm.segmentKey, 'canExport')}
                    style={{ width: '16px', height: '16px', cursor: readOnly ? 'default' : 'pointer', accentColor: '#9333ea' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
};
