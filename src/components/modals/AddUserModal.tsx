import React, { useState, useEffect } from 'react';
import { X, ShieldPlus, Mail, Lock, UserCheck, AlertCircle, Building2, Users } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { validateCorporateEmail } from '../../utils/authValidators';
import { provisionUser, getHierarchyOptions, HierarchyOptions } from '../../services/adminService';
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

export const AddUserModal: React.FC = () => {
  const { closeModal, addUser } = useCRM();
  const { profile } = useAuth();

  const isSuperAdmin = profile?.role === 'super_admin';

  const [hierarchy, setHierarchy] = useState<HierarchyOptions>({
    organizations: [{ id: '00000000-0000-0000-0000-000000000001', name: 'Rajmudra Group', slug: 'rajmudra-group' }],
    teams: [],
    managers: [],
  });

  const [formData, setFormData] = useState({
    fullName: '',
    workEmail: '',
    role: 'bd_exec' as UserRoleEnum,
    department: 'Business Development',
    designation: 'BD Executive',
    teamId: '',
    managerId: '',
    organizationId: profile?.organization_id || '00000000-0000-0000-0000-000000000001',
    status: 'active' as UserStatusEnum,
    provisioningMethod: 'invite' as 'invite' | 'password',
    tempPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getHierarchyOptions().then((opts) => {
      if (isMounted) {
        setHierarchy(opts);
        if (opts.teams.length > 0 && !formData.teamId) {
          setFormData((prev) => ({ ...prev, teamId: opts.teams[0].id }));
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.fullName.trim() || !formData.workEmail.trim()) {
      setErrorMessage('Full Name and Work Email are required.');
      return;
    }

    const emailValidation = validateCorporateEmail(formData.workEmail);
    if (!emailValidation.isValid) {
      setErrorMessage(emailValidation.error || 'Invalid corporate email address.');
      return;
    }

    if (formData.role === 'super_admin' && !isSuperAdmin) {
      setErrorMessage('Security Policy: Only a Super Administrator can assign the Super Admin role.');
      return;
    }

    if (formData.provisioningMethod === 'password' && (!formData.tempPassword || formData.tempPassword.length < 8)) {
      setErrorMessage('Temporary password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const result = await provisionUser({
        full_name: formData.fullName.trim(),
        email: formData.workEmail.trim().toLowerCase(),
        role: formData.role,
        department: formData.department.trim(),
        designation: formData.designation.trim(),
        team_id: formData.teamId || null,
        manager_id: formData.managerId || null,
        organization_id: formData.organizationId,
        status: formData.status,
        provisioning_method: formData.provisioningMethod,
        temp_password: formData.tempPassword,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to provision user.');
        setLoading(false);
        return;
      }

      // Map role to display format for CRM context
      let legacyRole: any = 'BD Executive';
      if (formData.role === 'super_admin') legacyRole = 'System Administrator';
      else if (formData.role === 'bd_director' || formData.role === 'bd_manager') legacyRole = 'BD Manager';
      else if (formData.role === 'management_viewer') legacyRole = 'Management Reviewer';

      // Update local CRM state
      addUser({
        name: formData.fullName.trim(),
        email: formData.workEmail.trim().toLowerCase(),
        role: legacyRole,
        role_name: formData.role,
        status: formData.status === 'active' ? 'Active' : 'Inactive',
        allowed_tabs: ['tab-dashboard', 'tab-clients', 'tab-opportunities', 'tab-activities', 'tab-followups'],
      });

      setSuccessMessage(result.message || 'User provisioned successfully!');
      setTimeout(() => {
        closeModal();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during user provisioning.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <ShieldPlus size={18} style={{ color: '#0284c7' }} />
            <span>Administrator User Provisioning (Rajmudra Group)</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
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
                <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
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
                <UserCheck size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Row 1: Full Name & Work Email */}
            <div className="form-grid-2">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Ramesh Patil"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Work Email (@rajmudragroup.com) *</label>
                <input
                  type="email"
                  required
                  className="form-control"
                  placeholder="ramesh.patil@rajmudragroup.com"
                  value={formData.workEmail}
                  onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'block' }}>
                  Hosted on Zoho Mail • CRM access restricted to corporate domain
                </span>
              </div>
            </div>

            {/* Row 2: Role & Department */}
            <div className="form-grid-2">
              <div className="form-group">
                <label>Assigned System Role *</label>
                <select
                  className="form-control"
                  value={formData.role}
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
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'block' }}>
                  {ROLE_OPTIONS.find((r) => r.value === formData.role)?.description}
                </span>
              </div>

              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Business Development / Corporate Fleet"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
            </div>

            {/* Row 3: Designation & Organization */}
            <div className="form-grid-2">
              <div className="form-group">
                <label>Designation</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Senior Business Development Executive"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Organization (Multi-Tenant Unit)</label>
                <select
                  className="form-control"
                  value={formData.organizationId}
                  disabled={!isSuperAdmin}
                  onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                >
                  {hierarchy.organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Team & Manager */}
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

            {/* Row 5: Account Status & Provisioning Method */}
            <div className="form-grid-2">
              <div className="form-group">
                <label>Initial Account Status</label>
                <select
                  className="form-control"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatusEnum })}
                >
                  <option value="active">Active (Immediate Login Permitted)</option>
                  <option value="pending_invite">Pending Invite (Awaiting Activation)</option>
                  <option value="inactive">Inactive / Staged</option>
                </select>
              </div>

              <div className="form-group">
                <label>Authentication &amp; Provisioning Method</label>
                <div style={{ display: 'flex', gap: '14px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="provisioningMethod"
                      value="invite"
                      checked={formData.provisioningMethod === 'invite'}
                      onChange={() => setFormData({ ...formData, provisioningMethod: 'invite' })}
                    />
                    <Mail size={14} style={{ color: '#0284c7' }} />
                    <span>Email Invitation Link</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="provisioningMethod"
                      value="password"
                      checked={formData.provisioningMethod === 'password'}
                      onChange={() => setFormData({ ...formData, provisioningMethod: 'password' })}
                    />
                    <Lock size={14} style={{ color: '#16a34a' }} />
                    <span>Set Temporary Password</span>
                  </label>
                </div>
              </div>
            </div>

            {formData.provisioningMethod === 'password' && (
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label>Temporary CRM Password (Min 8 characters) *</label>
                <input
                  type="password"
                  required
                  className="form-control"
                  placeholder="Enter initial secure temporary password"
                  value={formData.tempPassword}
                  onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <span>Provisioning User...</span>
              ) : (
                <>
                  <ShieldPlus size={15} />
                  <span>Provision &amp; Grant Access</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
