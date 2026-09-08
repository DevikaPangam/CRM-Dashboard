import React, { useState, useEffect } from 'react';
import { X, Shield, Save } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { User, UserRole } from '../../types/crm';

const ALL_TABS = [
  { id: 'tab-dashboard', label: 'Management Dashboard', desc: 'KPI cards, conversion funnel & pipeline trends' },
  { id: 'tab-clients', label: 'Client Master', desc: 'Enterprise accounts, contact details & directory' },
  { id: 'tab-team', label: 'BD Team & Owners', desc: 'BD executive performance, targets & regions' },
  { id: 'tab-segments', label: 'Business Segments', desc: 'Practice lines, margin targets & service division' },
  { id: 'tab-opportunities', label: 'Leads & Opportunities', desc: 'Full opportunity pipeline table & stages' },
  { id: 'tab-calculator', label: 'Proposal Calculator', desc: 'Live Streamlit commercial proposal & pricing formula engine' },
  { id: 'tab-activities', label: 'Engagement & Interactions', desc: 'Chronological timeline of meetings & calls' },
  { id: 'tab-followups', label: 'Follow-up Tracker', desc: 'Overdue alerts, action items & due dates' },
  { id: 'tab-internal', label: 'Internal BD Activities', desc: 'Cross-department tasks & approval workflows' },
  { id: 'tab-review', label: 'Monthly Management Review', desc: 'MMR executive analytics & win/loss retrospectives' },
  { id: 'tab-users', label: 'Users & Permissions', desc: 'System administrator security & RBAC management' },
];

export const EditUserModal: React.FC = () => {
  const { closeModal, activeModal, updateUser, currentUser } = useCRM();
  const userToEdit: User | undefined = activeModal.data;

  const [formData, setFormData] = useState({
    name: userToEdit?.name || '',
    email: userToEdit?.email || '',
    role: (userToEdit?.role || 'BD Executive') as UserRole,
    status: (userToEdit?.status || 'Active') as 'Active' | 'Inactive',
    allowed_tabs: userToEdit?.allowed_tabs || [],
  });

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        status: userToEdit.status,
        allowed_tabs: userToEdit.allowed_tabs || [],
      });
    }
  }, [userToEdit]);

  if (!userToEdit) return null;

  // Guard: Only System Administrator can grant/edit user permissions
  const isAdmin = currentUser.role === 'System Administrator';

  const toggleTab = (tabId: string) => {
    setFormData((prev) => {
      const exists = prev.allowed_tabs.includes(tabId);
      const updated = exists ? prev.allowed_tabs.filter((t) => t !== tabId) : [...prev.allowed_tabs, tabId];
      return { ...prev, allowed_tabs: updated };
    });
  };

  const handleRolePreset = (role: UserRole) => {
    let tabs = ['tab-dashboard', 'tab-clients', 'tab-opportunities', 'tab-activities', 'tab-followups'];
    if (role === 'System Administrator') {
      tabs = ALL_TABS.map((t) => t.id);
    } else if (role === 'BD Manager') {
      tabs = ['tab-dashboard', 'tab-clients', 'tab-team', 'tab-opportunities', 'tab-activities', 'tab-followups', 'tab-internal', 'tab-review'];
    } else if (role === 'Management Reviewer') {
      tabs = ['tab-dashboard', 'tab-review', 'tab-opportunities', 'tab-team', 'tab-segments'];
    }
    setFormData({ ...formData, role, allowed_tabs: tabs });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Security Alert: Only System Administrators can modify user permissions.');
      return;
    }
    if (!formData.name.trim() || !formData.email.trim()) return;

    updateUser(userToEdit.id, {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      role_name: formData.role,
      status: formData.status,
      allowed_tabs: formData.allowed_tabs,
    });

    closeModal();
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <Shield size={18} style={{ color: '#dc2626' }} />
            <span>Edit User &amp; Module Permissions ({userToEdit.name})</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-section">
            {!isAdmin && (
              <div
                style={{
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '10px',
                  marginBottom: '14px',
                  color: '#991b1b',
                  fontSize: '12px',
                }}
              >
                ⚠ Access Restricted: You must be logged in as a <strong>System Administrator</strong> to modify user roles and permissions.
              </div>
            )}

            <div className="form-grid-2">
              <div className="form-group">
                <label>User Full Name *</label>
                <input
                  type="text"
                  required
                  disabled={!isAdmin}
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Corporate Email *</label>
                <input
                  type="email"
                  required
                  disabled={!isAdmin}
                  className="form-control"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Assigned Role (Sets Default Preset)</label>
                <select
                  className="form-control"
                  disabled={!isAdmin}
                  value={formData.role}
                  onChange={(e) => handleRolePreset(e.target.value as UserRole)}
                >
                  <option value="System Administrator">System Administrator (Full Access)</option>
                  <option value="BD Manager">BD Manager (Pipeline &amp; Review)</option>
                  <option value="BD Executive">BD Executive (Field &amp; Accounts)</option>
                  <option value="Management Reviewer">Management Reviewer (Executive MMR)</option>
                  <option value="Viewer">Viewer (Read-Only)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Account Status</label>
                <select
                  className="form-control"
                  disabled={!isAdmin}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive / Suspended</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Granular Module Access Permissions (Admin Controlled)
                </label>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {formData.allowed_tabs.length} of {ALL_TABS.length} Modules Permitted
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px',
                  background: '#f8fafc',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
              >
                {ALL_TABS.map((tab) => {
                  const isChecked = formData.allowed_tabs.includes(tab.id);
                  return (
                    <label
                      key={tab.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '8px 10px',
                        background: isChecked ? '#f0fdf4' : '#ffffff',
                        border: `1px solid ${isChecked ? '#bbf7d0' : '#e2e8f0'}`,
                        borderRadius: '6px',
                        cursor: isAdmin ? 'pointer' : 'not-allowed',
                        transition: 'var(--transition-fast)',
                      }}
                    >
                      <input
                        type="checkbox"
                        disabled={!isAdmin}
                        style={{ marginTop: '3px' }}
                        checked={isChecked}
                        onChange={() => toggleTab(tab.id)}
                      />
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '12px', color: '#0f172a', display: 'block' }}>{tab.label}</strong>
                        <span style={{ fontSize: '10.5px', color: '#64748b', lineHeight: 1.2, display: 'block' }}>
                          {tab.desc}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            {isAdmin && (
              <button type="submit" className="btn btn-primary">
                <Save size={14} />
                <span>Save Permissions</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
