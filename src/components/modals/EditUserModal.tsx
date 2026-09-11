import React, { useState, useEffect } from 'react';
import { X, Shield, Save, Mail, AlertTriangle, KeyRound, UserX, CheckCircle, Building2 } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { updateAdminUser, triggerPasswordReset, revokeUserAccess, getHierarchyOptions, HierarchyOptions } from '../../services/adminService';
import { UserRoleEnum, UserStatusEnum } from '../../types/database.types';
import { SegmentPermissionsMatrix } from '../common/SegmentPermissionsMatrix';
import { getDefaultPermissionsForRole } from '../../utils/rbacPermissions';
import { SegmentPermission } from '../../types/crm';

const ROLE_OPTIONS: Array<{ value: UserRoleEnum; label: string; description: string; requiresSuperAdmin?: boolean }> = [
  { value: 'super_admin', label: 'Super Administrator', description: 'Full system & tenant management authority', requiresSuperAdmin: true },
  { value: 'bd_director', label: 'BD Director', description: 'Strategic pipeline oversight, MMR & approvals' },
  { value: 'bd_manager', label: 'BD Manager', description: 'Team leader, pipeline reviews & commercial proposals' },
  { value: 'bd_sr_exec', label: 'Senior BD Executive', description: 'Enterprise deal inception & key accounts' },
  { value: 'bd_exec', label: 'BD Executive', description: 'Daily client interactions, leads & follow-ups' },
  { value: 'operations_manager', label: 'Operations Manager', description: 'Fleet logistics, driver roster & route control' },
  { value: 'cops_supervisor', label: 'Centralised Ops Supervisor', description: 'Control tower telemetry & panic response' },
  { value: 'maintenance_engineer', label: 'Maintenance Workshop Eng', description: 'Preventive maintenance & workshop repair' },
  { value: 'finance_executive', label: 'Finance & Pricing Exec', description: 'Commercial pricing, client invoicing & audits' },
  { value: 'legal_counsel', label: 'Legal & Contracts Counsel', description: 'Master contracts, SLAs & statutory compliance' },
  { value: 'management_viewer', label: 'Management Reviewer', description: 'Read-only executive analytics & reports' },
  { value: 'analyst', label: 'Business Analyst', description: 'Data export & analytics dashboards' },
];

export const EditUserModal: React.FC = () => {
  const { closeModal, activeModal, updateUser } = useCRM();
  const { profile } = useAuth();
  const { canAdmin, canEdit } = useRBAC();
  const userToEdit: any = activeModal.data;

  const isUserAdmin = canAdmin('users') || canEdit('users');
  const isSuperAdmin = isUserAdmin;
  const isEditingSelf = userToEdit && profile?.id === userToEdit.id;

  const [hierarchy, setHierarchy] = useState<HierarchyOptions>({
    organizations: [],
    departments: [],
    regions: [],
    teams: [],
    managers: [],
  });

  // Map legacy role to UserRoleEnum if needed
  const getMappedRole = (roleStr?: string): UserRoleEnum => {
    if (roleStr === 'System Administrator' || roleStr === 'super_admin') return 'super_admin';
    if (roleStr === 'BD Director' || roleStr === 'bd_director') return 'bd_director';
    if (roleStr === 'BD Manager' || roleStr === 'bd_manager') return 'bd_manager';
    if (roleStr === 'Management Reviewer' || roleStr === 'management_viewer') return 'management_viewer';
    if (roleStr === 'Senior BD Executive' || roleStr === 'bd_sr_exec') return 'bd_sr_exec';
    if (roleStr === 'Business Analyst' || roleStr === 'analyst') return 'analyst';
    if (roleStr === 'Operations Manager' || roleStr === 'operations_manager') return 'operations_manager';
    if (roleStr === 'Centralised Ops Supervisor' || roleStr === 'cops_supervisor') return 'cops_supervisor';
    if (roleStr === 'Maintenance Workshop Eng' || roleStr === 'maintenance_engineer') return 'maintenance_engineer';
    if (roleStr === 'Finance & Pricing Exec' || roleStr === 'finance_executive') return 'finance_executive';
    if (roleStr === 'Legal & Contracts Counsel' || roleStr === 'legal_counsel') return 'legal_counsel';
    return 'bd_exec';
  };

  const [formData, setFormData] = useState({
    fullName: userToEdit?.name || userToEdit?.full_name || '',
    email: userToEdit?.email || '',
    employeeId: userToEdit?.employee_id || '',
    phone: userToEdit?.phone || '',
    role: getMappedRole(userToEdit?.role_name || userToEdit?.role),
    department: userToEdit?.department || 'Business Development',
    designation: userToEdit?.designation || 'BD Executive',
    region: userToEdit?.region || 'West Region',
    regionId: userToEdit?.region_id || '',
    teamId: userToEdit?.team_id || '',
    managerId: userToEdit?.manager_id || '',
    joiningDate: userToEdit?.joining_date || '',
    location: userToEdit?.location || '',
    employmentType: (userToEdit?.employment_type || 'Full-time') as 'Full-time' | 'Contract' | 'Probation' | 'Part-time',
    isRegionalOwner: Boolean(userToEdit?.is_regional_owner),
    annualTargetINR: userToEdit?.annual_target_inr || 0,
    status: (userToEdit?.status?.toLowerCase() === 'inactive' || userToEdit?.status?.toLowerCase() === 'suspended' ? 'inactive' : 'active') as UserStatusEnum,
  });

  const [permissions, setPermissions] = useState<SegmentPermission[]>(() =>
    userToEdit?.permissions && userToEdit.permissions.length > 0
      ? userToEdit.permissions
      : getDefaultPermissionsForRole(userToEdit?.role_name || userToEdit?.role || 'bd_exec')
  );

  const [loading, setLoading] = useState(false);
  const [isHierarchyLoading, setIsHierarchyLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsHierarchyLoading(true);
    getHierarchyOptions(true)
      .then((opts) => {
        if (isMounted) setHierarchy(opts);
      })
      .finally(() => {
        if (isMounted) setIsHierarchyLoading(false);
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
        employeeId: userToEdit.employee_id || '',
        phone: userToEdit.phone || '',
        role: getMappedRole(userToEdit.role_name || userToEdit.role),
        department: userToEdit.department || 'Business Development',
        designation: userToEdit.designation || 'BD Executive',
        region: userToEdit.region || 'West Region',
        regionId: userToEdit.region_id || '',
        teamId: userToEdit.team_id || '',
        managerId: userToEdit.manager_id || '',
        joiningDate: userToEdit.joining_date || '',
        location: userToEdit.location || '',
        employmentType: (userToEdit.employment_type || 'Full-time') as any,
        isRegionalOwner: Boolean(userToEdit.is_regional_owner),
        annualTargetINR: userToEdit.annual_target_inr || 0,
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
    else if (role === 'operations_manager') designation = 'Operations Manager';
    else if (role === 'cops_supervisor') designation = 'Centralised Ops Supervisor';
    else if (role === 'maintenance_engineer') designation = 'Fleet Maintenance Engineer';
    else if (role === 'finance_executive') designation = 'Finance & Commercials Executive';
    else if (role === 'legal_counsel') designation = 'Legal & Contract Compliance Counsel';
    else if (role === 'management_viewer') designation = 'Executive Reviewer';
    else if (role === 'analyst') designation = 'Commercial Analyst';

    setFormData({ ...formData, role, designation });
    setPermissions(getDefaultPermissionsForRole(role));
  };

  const handleRegionChange = (regionId: string) => {
    const selected = hierarchy.regions.find((r) => r.id === regionId);
    setFormData((prev) => ({
      ...prev,
      regionId,
      region: selected ? selected.name : prev.region,
    }));
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

    // Rule 6: Prevent an employee from assigning themselves as manager
    if (formData.managerId && formData.managerId === userToEdit.id) {
      setErrorMessage('Hierarchy Rule Violation: An employee cannot be assigned as their own reporting manager.');
      return;
    }

    setLoading(true);

    try {
      const res = await updateAdminUser(userToEdit.id, {
        full_name: formData.fullName.trim(),
        role: formData.role,
        department: formData.department.trim(),
        designation: formData.designation.trim(),
        employee_id: formData.employeeId.trim() || undefined,
        region: formData.region,
        location: formData.location.trim() || undefined,
        joining_date: formData.joiningDate || undefined,
        employment_type: formData.employmentType,
        is_regional_owner: formData.isRegionalOwner,
        annual_target_inr: Number(formData.annualTargetINR) || 0,
        phone: formData.phone.trim() || undefined,
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

      const selectedTeam = hierarchy.teams.find((t) => t.id === formData.teamId);
      const selectedManager = hierarchy.managers.find((m) => m.id === formData.managerId);

      updateUser(userToEdit.id, {
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        role: legacyRole,
        role_name: formData.role,
        department: formData.department.trim(),
        designation: formData.designation.trim(),
        employee_id: formData.employeeId.trim() || undefined,
        region: formData.region,
        region_id: formData.regionId || undefined,
        location: formData.location.trim() || undefined,
        joining_date: formData.joiningDate || undefined,
        employment_type: formData.employmentType,
        is_regional_owner: formData.isRegionalOwner,
        annual_target_inr: Number(formData.annualTargetINR) || 0,
        phone: formData.phone.trim() || undefined,
        team_id: formData.teamId || undefined,
        team_name: selectedTeam?.name,
        manager_id: formData.managerId || undefined,
        manager_name: selectedManager?.full_name,
        status: formData.status === 'active' ? 'Active' : 'Inactive',
        permissions,
      });

      setSuccessMessage('User profile, hierarchy assignment, and permissions updated successfully.');
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
      setFormData((prev) => ({ ...prev, status: 'inactive' as any }));
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
            <span>Manage Employee &amp; Access Controls ({formData.fullName})</span>
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

            {/* Row 2: Employee ID & Phone */}
            <div className="form-grid-2">
              <div className="form-group">
                <label>Employee ID (ERP / HRMS)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. EMP-2026-042"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Contact Phone / Mobile</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+91 98201 00000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Row 3: Role & Department */}
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
                <label>Department *</label>
                <select
                  className="form-control"
                  value={formData.department}
                  onChange={(e) => {
                    const newDept = e.target.value;
                    setFormData((prev) => {
                      const matchingTeams = hierarchy.teams.filter((t) => {
                        const tDept = (t.department || '').toLowerCase();
                        const targetDept = newDept.toLowerCase();
                        const isMatch = tDept === targetDept || 
                          (targetDept.includes('business development') && (tDept === 'bd' || tDept.includes('business development'))) ||
                          (targetDept.includes('operations') && !targetDept.includes('centralised') && (tDept === 'operations' || tDept === 'ops')) ||
                          (targetDept.includes('centralised operations') && (tDept === 'centralised operations' || tDept === 'cop')) ||
                          (targetDept.includes('maintenance') && (tDept === 'maintenance' || tDept === 'mnt')) ||
                          (targetDept.includes('finance') && (tDept === 'finance' || tDept === 'fin' || tDept.includes('pricing') || tDept.includes('accounts'))) ||
                          (targetDept.includes('legal') && (tDept === 'legal' || tDept === 'leg' || tDept.includes('compliance')));
                        const isRegMatch = !prev.regionId || !t.region_id || t.region_id === prev.regionId;
                        return isMatch && isRegMatch;
                      });
                      return {
                        ...prev,
                        department: newDept,
                        teamId: matchingTeams.length > 0 ? matchingTeams[0].id : prev.teamId,
                      };
                    });
                  }}
                >
                  <optgroup label="Active Departments (Rajmudra Group)">
                    {hierarchy.departments && hierarchy.departments.length > 0 ? (
                      hierarchy.departments
                        .filter((d) => d.is_active)
                        .map((d) => (
                          <option key={d.id} value={d.department_name}>
                            {d.department_name} ({d.department_code})
                          </option>
                        ))
                    ) : (
                      <>
                        <option value="Business Development">Business Development (BD)</option>
                        <option value="Operations">Operations (OPS)</option>
                        <option value="Centralised Operations">Centralised Operations (COP)</option>
                        <option value="Maintenance">Maintenance (MNT)</option>
                        <option value="Finance">Finance (FIN)</option>
                        <option value="Legal">Legal (LEG)</option>
                      </>
                    )}
                  </optgroup>
                  {hierarchy.departments &&
                    hierarchy.departments.filter((d) => !d.is_active).length > 0 && (
                      <optgroup label="Historical / Inactive Departments (Restricted)">
                        {hierarchy.departments
                          .filter((d) => !d.is_active)
                          .map((d) => (
                            <option key={d.id} value={d.department_name}>
                              {d.department_name} ({d.department_code}) — Inactive
                            </option>
                          ))}
                      </optgroup>
                    )}
                  {/* If user's current department is not in departments list, display it */}
                  {formData.department &&
                    !hierarchy.departments.some(
                      (d) => d.department_name.toLowerCase() === formData.department.toLowerCase()
                    ) && (
                      <optgroup label="Current Assigned Department">
                        <option value={formData.department}>{formData.department} (Legacy Custom)</option>
                      </optgroup>
                    )}
                </select>
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'block' }}>
                  Active departments for corporate operations
                </span>
              </div>
            </div>

            {/* Row 4: Designation & Account Status */}
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

            {/* Section: Region, Team & Reporting Manager Structure */}
            <div style={{ margin: '14px 0 10px 0', padding: '12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0369a1', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={15} />
                <span>Organizational Hierarchy &amp; Reporting Assignment</span>
              </div>
              
              <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {/* Region Dropdown */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Region *</label>
                  <select
                    className="form-control"
                    value={formData.regionId}
                    onChange={(e) => handleRegionChange(e.target.value)}
                  >
                    <option value="">-- Select Region --</option>
                    {hierarchy.regions.map((reg) => (
                      <option key={reg.id} value={reg.id}>
                        {reg.name} ({reg.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Team Dropdown */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Assigned Team</label>
                  <select
                    className="form-control"
                    value={formData.teamId}
                    onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                  >
                    <option value="">-- No Specific Team --</option>
                    {hierarchy.teams
                      .filter((t) => {
                        const tDept = (t.department || '').toLowerCase();
                        const targetDept = (formData.department || '').toLowerCase();
                        const isDeptMatch = !targetDept || tDept === targetDept || 
                          (targetDept.includes('business development') && (tDept === 'bd' || tDept.includes('business development'))) ||
                          (targetDept.includes('operations') && !targetDept.includes('centralised') && (tDept === 'operations' || tDept === 'ops')) ||
                          (targetDept.includes('centralised operations') && (tDept === 'centralised operations' || tDept === 'cop')) ||
                          (targetDept.includes('maintenance') && (tDept === 'maintenance' || tDept === 'mnt')) ||
                          (targetDept.includes('finance') && (tDept === 'finance' || tDept === 'fin' || tDept.includes('pricing') || tDept.includes('accounts'))) ||
                          (targetDept.includes('legal') && (tDept === 'legal' || tDept === 'leg' || tDept.includes('compliance')));
                        const isRegionMatch = !formData.regionId || !t.region_id || t.region_id === formData.regionId;
                        return isDeptMatch && isRegionMatch;
                      })
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.code})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Reporting Manager Dropdown — Exclude Self to Prevent Self-Assignment (Rule 6) */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Reporting Manager</label>
                  <select
                    className="form-control"
                    value={formData.managerId}
                    disabled={isHierarchyLoading}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  >
                    {isHierarchyLoading ? (
                      <option value="">Loading active reporting managers…</option>
                    ) : (
                      <>
                        <option value="">-- No Direct Manager (Top Level) --</option>
                        {hierarchy.managers
                          .filter((m) => m.id !== userToEdit.id)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.full_name} ({m.designation || m.role})
                            </option>
                          ))}
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Row 5: Employment Type, Joining Date & Location */}
            <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Employment Type</label>
                <select
                  className="form-control"
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Probation">Probation</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </div>

              <div className="form-group">
                <label>Joining Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Base Location / Hub</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Corporate HQ - Mumbai"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            {/* Regional Owner Checkbox — Strictly restricted to Business Development */}
            {formData.department === 'Business Development' && (
              <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="isRegionalOwnerEdit"
                  checked={formData.isRegionalOwner}
                  onChange={(e) => setFormData({ ...formData, isRegionalOwner: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="isRegionalOwnerEdit" style={{ fontSize: '13px', fontWeight: 500, color: '#334155', cursor: 'pointer', margin: 0 }}>
                  Designate as <strong>Regional Owner / Head</strong> (Appears in Regional Ownership Roster)
                </label>
              </div>
            )}

            {/* Granular Segment Permissions Matrix */}
            <SegmentPermissionsMatrix
              permissions={permissions}
              onChange={setPermissions}
              roleName={formData.role}
            />

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
