import React, { useState, useEffect } from 'react';
import { X, Shield, Save, Mail, AlertTriangle, KeyRound, UserX, CheckCircle, RefreshCw } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { updateAdminUser, triggerPasswordReset, revokeUserAccess, getHierarchyOptions, HierarchyOptions } from '../../services/adminService';
import { UserRoleEnum, UserStatusEnum } from '../../types/database.types';

const ROLE_OPTIONS: Array<{ value: UserRoleEnum; label: string; description: string; requiresSuperAdmin?: boolean }> = [
  { value: 'super_admin', label: 'Super Administrator', description: 'Full system & tenant management authority', requiresSuperAdmin: true },
  { value: 'bd_director', label: 'BD Director', description: 'Strategic pipeline oversight, MMR & approvals' },
  { value: 'bd_manager', label: 'BD Manager', description: 'Team leader, pipeline reviews & commercial proposals' },
  { value: 'bd_sr_exec', label: 'Senior BD Executive', description: 'Enterprise deal inception & key accounts' },
  { value: 'bd_exec', label: 'BD Executive', description: 'Daily client interactions, leads & follow-ups' },
  { value: 'management_viewer', label: 'Management Reviewer', description: 'Read-only executive analytics & reports' },
  { value: 'analyst', label: 'Business Analyst', description: 'Data export & analytics dashboards' },
];

export const EditUserModal: React.FC = () => {
  const { closeModal, activeModal, updateUser } = useCRM();
  const { profile } = useAuth();
  const userToEdit: any = activeModal.data;

  const isSuperAdmin = profile?.role === 'super_admin';
  const isEditingSelf = userToEdit && profile?.id === userToEdit.id;

  const [hierarchy, setHierarchy] = useState<HierarchyOptions>({
    organizations: [],
    teams: [],
    managers: [],
  });

  // Map legacy role to UserRoleEnum if needed
  const getMappedRole = (roleStr?: string): UserRoleEnum => {
    if (roleStr === 'System Administrator' || roleStr === 'super_admin') return 'super_admin';
    if (roleStr === 'BD Manager' || roleStr === 'bd_director' || roleStr === 'bd_manager') return 'bd_manager';
    if (roleStr === 'Management Reviewer' || roleStr === 'management_viewer') return 'management_viewer';
    if (roleStr === 'Senior BD Executive' || roleStr === 'bd_sr_exec') return 'bd_sr_exec';
    if (roleStr === 'Business Analyst' || roleStr === 'analyst') return 'analyst';
    return 'bd_exec';
  };

  const [formData, setFormData] = useState({
    fullName: userToEdit?.name || userToEdit?.full_name || '',
    email: userToEdit?.email || '',
    role: getMappedRole(userToEdit?.role_name || userToEdit?.role),
    department: userToEdit?.department || 'Business Development',
    designation: userToEdit?.designation || 'BD Executive',
    teamId: userToEdit?.team_id || '',
    managerId: userToEdit?.manager_id || '',
    status: (userToEdit?.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active') as UserStatusEnum,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getHierarchyOptions().then((opts) => {
      if (isMounted) setHierarchy(opts);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        fullName: userToEdit.name || userToEdit.full_name || '',
        email: userToEdit.email || '',
        role: getMappedRole(userToEdit.role_name || userToEdit.role),
        department: userToEdit.department || 'Business Development',
        designation: userToEdit.designation || 'BD Executive',
        teamId: userToEdit.team_id || '',
        managerId: userToEdit.manager_id || '',
        status: (userToEdit.status?.toLowerCase() === 'inactive' || userToEdit.status?.toLowerCase() === 'suspended' ? 'inactive' : 'active') as UserStatusEnum,
      });
    }
  }, [userToEdit]);

  if (!userToEdit) return null;

  const handleRoleChange = (role: UserRoleEnum) => {
    let designation = formData.designation;
    if (role === 'super_admin') designation = 'Managing Director / System Admin';
    else if (role === 'bd_director') designation = 'Director - Business Development';
    else if (role === 'bd_manager') designation = 'Senior Manager - Corporate Sales';
    else if (role === 'bd_sr_exec') designation = 'Senior BD Executive';
    else if (role === 'bd_exec') designation = 'BD Executive';
    else if (role === 'management_viewer') designation = 'Executive Reviewer';
    else if (role === 'analyst') designation = 'Commercial Analyst';

    setFormData({ ...formData, role, designation });
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (isEditingSelf && formData.role !== profile?.role) {
      setErrorMessage('Security Alert: You cannot modify your own administrator role.');
      return;
    }

    if (formData.role === 'super_admin' && !isSuperAdmin) {
      setErrorMessage('Security Alert: Only a Super Administrator can assign the Super Admin role.');
      return;
    }

    setLoading(true);

    try {
      const res = await updateAdminUser(userToEdit.id, {
        full_name: formData.fullName.trim(),
        role: formData.role,
        department: formData.department.trim(),
        designation: formData.designation.trim(),
        team_id: formData.teamId || null,
        manager_id: formData.managerId || null,
        status: formData.status,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update user profile.');
        setLoading(false);
        return;
      }

      // Map display role for CRMContext
      let legacyRole: any = 'BD Executive';
      if (formData.role === 'super_admin') legacyRole = 'System Administrator';
      else if (formData.role === 'bd_director' || formData.role === 'bd_manager') legacyRole = 'BD Manager';
      else if (formData.role === 'management_viewer') legacyRole = 'Management Reviewer';

      updateUser(userToEdit.id, {
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        role: legacyRole,
        role_name: formData.role,
        status: formData.status === 'active' ? 'Active' : 'Inactive',
      });

      setSuccessMessage('User profile and access permissions updated successfully.');
      setTimeout(() => {
        closeModal();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!window.confirm(`Send password reset email to ${formData.email}?`)) return;
    setActionLoading('reset');
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await triggerPasswordReset(userToEdit.id);
    setActionLoading(null);
    if (res.success) {
      setSuccessMessage(`Password reset link sent to ${formData.email}.`);
    } else {
      setErrorMessage(res.error || 'Failed to trigger password reset.');
    }
  };

  const handleRevokeAccess = async () => {
    if (isEditingSelf) {
      alert('You cannot revoke your own active administrator account.');
      return;
    }
    if (!window.confirm(`Revoke all active sessions and suspend account for ${formData.fullName}?`)) return;

    setActionLoading('revoke');
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await revokeUserAccess(userToEdit.id);
    setActionLoading(null);
    if (res.success) {
      setFormData((prev) => ({ ...prev, status: 'suspended' as any }));
      updateUser(userToEdit.id, { status: 'Inactive' });
      setSuccessMessage(`Access revoked for ${formData.fullName}. Account is now suspended.`);
    } else {
      setErrorMessage(res.error || 'Failed to revoke access.');
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <Shield size={18} style={{ color: '#0284c7' }} />
            <span>Manage User &amp; Access Controls ({formData.fullName})</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSaveChanges} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-section" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {errorMessage && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  color: '#991b1b',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  color: '#166534',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Row 1: Full Name & Email */}
            <div className="form-grid-2">
              <div className="form-group">
                <label>User Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Corporate Work Email</label>
                <input
                  type="email"
                  required
                  className="form-control"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Row 2: Role & Department */}
            <div className="form-grid-2">
              <div className="form-group">
                <label>Assigned System Role *</label>
                <select
                  className="form-control"
                  value={formData.role}
                  disabled={isEditingSelf}
                  onChange={(e) => handleRoleChange(e.target.value as UserRoleEnum)}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.requiresSuperAdmin && !isSuperAdmin}
                    >
                      {opt.label} {opt.requiresSuperAdmin && !isSuperAdmin ? '(Super Admin Only)' : ''}
                    </option>
                  ))}
                </select>
                {isEditingSelf && (
                  <span style={{ fontSize: '11px', color: '#991b1b', marginTop: '3px', display: 'block' }}>
                    Self-escalation protection: Administrators cannot modify their own assigned role.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
            </div>

            {/* Row 3: Designation & Status */}
            <div className="form-grid-2">
              <div className="form-group">
                <label>Designation</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Account Status</label>
                <select
                  className="form-control"
                  value={formData.status}
                  disabled={isEditingSelf}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatusEnum })}
                >
                  <option value="active">Active (Full CRM Access Permitted)</option>
                  <option value="inactive">Inactive / Suspended</option>
                  <option value="pending_invite">Pending Invite Activation</option>
                </select>
              </div>
            </div>

            {/* Row 4: Team & Reporting Manager */}
            <div className="form-grid-2">
              <div className="form-group">
                <label>Assigned BD Team</label>
                <select
                  className="form-control"
                  value={formData.teamId}
                  onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                >
                  <option value="">-- No Specific Team --</option>
                  {hierarchy.teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Reporting Manager</label>
                <select
                  className="form-control"
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                >
                  <option value="">-- No Direct Manager (Top Level) --</option>
                  {hierarchy.managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.designation || m.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Security Actions Panel */}
            <div
              style={{
                marginTop: '16px',
                padding: '14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            >
              <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '10px' }}>
                Privileged Security Operations
              </strong>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetPassword}
                  disabled={actionLoading !== null}
                >
                  <KeyRound size={14} style={{ color: '#0284c7' }} />
                  <span>{actionLoading === 'reset' ? 'Sending Link...' : 'Trigger Password Reset Email'}</span>
                </button>

                {!isEditingSelf && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fff' }}
                    onClick={handleRevokeAccess}
                    disabled={actionLoading !== null}
                  >
                    <UserX size={14} style={{ color: '#dc2626' }} />
                    <span>{actionLoading === 'revoke' ? 'Revoking...' : 'Revoke Access & Suspend Sessions'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <span>Saving Changes...</span>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save User Access Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
