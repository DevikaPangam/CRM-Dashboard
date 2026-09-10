import React, { useState, useEffect } from 'react';
import { X, ShieldPlus, Mail, Lock, UserCheck, AlertCircle, Building2, Users } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { validateCorporateEmail } from '../../utils/authValidators';
import { provisionUser, getHierarchyOptions, HierarchyOptions } from '../../services/adminService';
import { UserRoleEnum, UserStatusEnum } from '../../types/database.types';
import { SegmentPermissionsMatrix } from '../common/SegmentPermissionsMatrix';
import { getDefaultPermissionsForRole } from '../../utils/rbacPermissions';
import { SegmentPermission } from '../../types/crm';

const ROLE_OPTIONS: Array<{ value: UserRoleEnum; label: string; description: string; requiresSuperAdmin?: boolean; defaultDept?: string }> = [
  { value: 'super_admin', label: 'Super Administrator', description: 'Full system & multi-tenant organization authority', requiresSuperAdmin: true },
  { value: 'bd_director', label: 'Director - Business Development', description: 'Commercial pipeline strategy, MMR & high-value deal approvals', defaultDept: 'Business Development' },
  { value: 'bd_manager', label: 'BD Manager', description: 'Regional sales team lead, commercial proposals & appraisals', defaultDept: 'Business Development' },
  { value: 'bd_sr_exec', label: 'Senior BD Executive', description: 'Enterprise deal inception & key corporate accounts', defaultDept: 'Business Development' },
  { value: 'bd_exec', label: 'BD Executive', description: 'Daily client interactions, prospecting & follow-ups', defaultDept: 'Business Development' },
  { value: 'operations_manager', label: 'Operations Manager / Lead', description: 'Fleet dispatch, trip on-time arrival & route execution', defaultDept: 'Operations' },
  { value: 'cops_supervisor', label: 'Centralised Operations Command', description: 'Control Tower monitoring, SOS response & telemetry', defaultDept: 'Centralised Operations' },
  { value: 'maintenance_engineer', label: 'Maintenance Engineer / Lead', description: 'Workshop reliability, PM schedule & breakdown repairs', defaultDept: 'Maintenance' },
  { value: 'finance_executive', label: 'Finance & Accounts Specialist', description: 'Billing reconciliation, invoicing accuracy & DSO collections', defaultDept: 'Finance' },
  { value: 'legal_counsel', label: 'Legal & Compliance Counsel', description: 'Tripartite contract SLAs, NDAs & motor permits', defaultDept: 'Legal' },
  { value: 'management_viewer', label: 'Management Reviewer', description: 'Read-only executive analytics & company reports' },
  { value: 'analyst', label: 'Business Analyst', description: 'Data export & performance analytics dashboards' },
];

export const AddUserModal: React.FC = () => {
  const { closeModal, addUser, currentUser } = useCRM();
  const { profile } = useAuth();
  const { canAdmin, canCreate } = useRBAC();

  const isUserAdmin = canAdmin('users') || canCreate('users');
  const isSuperAdmin = isUserAdmin;

  const [hierarchy, setHierarchy] = useState<HierarchyOptions>({
    organizations: [{ id: '00000000-0000-0000-0000-000000000001', name: 'Rajmudra Group', slug: 'rajmudra-group' }],
    departments: [],
    regions: [],
    teams: [],
    managers: [],
  });

  const [formData, setFormData] = useState({
    fullName: '',
    workEmail: '',
    employeeId: '',
    role: 'bd_exec' as UserRoleEnum,
    department: 'Business Development',
    designation: 'BD Executive',
    region: 'West Region',
    regionId: '',
    teamId: '',
    managerId: '',
    joiningDate: new Date().toISOString().split('T')[0],
    location: 'Corporate HQ - Mumbai',
    employmentType: 'Full-time' as 'Full-time' | 'Contract' | 'Probation' | 'Part-time',
    isRegionalOwner: false,
    annualTargetINR: 50000000,
    phone: '',
    organizationId: profile?.organization_id || '00000000-0000-0000-0000-000000000001',
    status: 'active' as UserStatusEnum,
    provisioningMethod: 'invite' as 'invite' | 'password',
    tempPassword: '',
  });

  const [permissions, setPermissions] = useState<SegmentPermission[]>(() => getDefaultPermissionsForRole('bd_exec'));

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getHierarchyOptions().then((opts) => {
      if (isMounted) {
        setHierarchy(opts);
        if (opts.regions.length > 0 && !formData.regionId) {
          setFormData((prev) => ({
            ...prev,
            regionId: opts.regions[0].id,
            region: opts.regions[0].name,
          }));
        }
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
    let dept = formData.department;

    if (role === 'super_admin') designation = 'Managing Director / System Admin';
    else if (role === 'bd_director') { designation = 'Director - Business Development'; dept = 'Business Development'; }
    else if (role === 'bd_manager') { designation = 'Senior Manager - Corporate Sales'; dept = 'Business Development'; }
    else if (role === 'bd_sr_exec') { designation = 'Senior BD Executive'; dept = 'Business Development'; }
    else if (role === 'bd_exec') { designation = 'BD Executive'; dept = 'Business Development'; }
    else if (role === 'operations_manager') { designation = 'Fleet Operations Manager'; dept = 'Operations'; }
    else if (role === 'cops_supervisor') { designation = 'Central Control Tower Supervisor'; dept = 'Centralised Operations'; }
    else if (role === 'maintenance_engineer') { designation = 'Chief Maintenance Engineer'; dept = 'Maintenance'; }
    else if (role === 'finance_executive') { designation = 'Senior Billing & Collections Specialist'; dept = 'Finance'; }
    else if (role === 'legal_counsel') { designation = 'Corporate & Contracts Counsel'; dept = 'Legal'; }
    else if (role === 'management_viewer') designation = 'Executive Reviewer';
    else if (role === 'analyst') designation = 'Commercial Analyst';

    const isBD = dept === 'Business Development';
    setFormData({
      ...formData,
      role,
      designation,
      department: dept,
      isRegionalOwner: isBD ? formData.isRegionalOwner : false,
    });
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
        employee_id: formData.employeeId.trim() || undefined,
        region: formData.region,
        location: formData.location.trim(),
        joining_date: formData.joiningDate,
        employment_type: formData.employmentType,
        is_regional_owner: formData.isRegionalOwner,
        annual_target_inr: Number(formData.annualTargetINR) || 0,
        phone: formData.phone.trim() || undefined,
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

      // Update CRM state & sync with Supabase with full employee attributes
      await addUser({
        id: result.user?.id,
        name: formData.fullName.trim(),
        email: formData.workEmail.trim().toLowerCase(),
        employee_id: formData.employeeId.trim() || undefined,
        role: legacyRole,
        role_name: formData.role,
        department: formData.department.trim(),
        designation: formData.designation.trim(),
        region: formData.region,
        region_id: formData.regionId || undefined,
        location: formData.location.trim(),
        joining_date: formData.joiningDate,
        employment_type: formData.employmentType,
        is_regional_owner: formData.isRegionalOwner,
        team_id: formData.teamId || undefined,
        team_name: hierarchy.teams.find((t) => t.id === formData.teamId)?.name,
        manager_id: formData.managerId || undefined,
        manager_name: hierarchy.managers.find((m) => m.id === formData.managerId)?.full_name,
        annual_target_inr: Number(formData.annualTargetINR) || 0,
        phone: formData.phone.trim() || undefined,
        status: formData.status === 'active' ? 'Active' : 'Inactive',
        allowed_tabs: ['tab-dashboard', 'tab-clients', 'tab-employee-master', 'tab-team', 'tab-employee-profile', 'tab-opportunities', 'tab-activities', 'tab-followups'],
        permissions,
      } as any);

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

            {/* Row 2: Employee ID & Phone */}
            <div className="form-grid-2">
              <div className="form-group">
                <label>Employee ID (ERP / HRMS)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. EMP-2026-088"
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
                        teamId: matchingTeams.length > 0 ? matchingTeams[0].id : '',
                      };
                    });
                  }}
                >
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
                </select>
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'block' }}>
                  Select from active Rajmudra Group departments
                </span>
              </div>
            </div>

            {/* Row 4: Designation & Organization */}
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
                <label>Organization (Multi-Tenant Tenant Unit)</label>
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

                {/* Reporting Manager Dropdown */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Reporting Manager</label>
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
                  placeholder="e.g. Mumbai Corporate HQ"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            {/* Regional Owner Checkbox (Business Development Only) */}
            {formData.department === 'Business Development' && (
              <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="isRegionalOwnerAdd"
                  checked={formData.isRegionalOwner}
                  onChange={(e) => setFormData({ ...formData, isRegionalOwner: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="isRegionalOwnerAdd" style={{ fontSize: '13px', fontWeight: 500, color: '#334155', cursor: 'pointer', margin: 0 }}>
                  Designate as <strong>Regional Owner / Head</strong> (Appears in BD Regional Ownership Roster)
                </label>
              </div>
            )}

            {/* Granular Segment Permissions Matrix */}
            <SegmentPermissionsMatrix
              permissions={permissions}
              onChange={setPermissions}
              roleName={formData.role}
            />

            {/* Row 6: Account Status & Provisioning Method */}
            <div className="form-grid-2" style={{ marginTop: '16px' }}>
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
