import React, { useState } from 'react';
import { X, ShieldPlus } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { UserRole } from '../../types/crm';

const ALL_TABS = [
  { id: 'tab-dashboard', label: 'Management Dashboard' },
  { id: 'tab-clients', label: 'Client Master' },
  { id: 'tab-team', label: 'BD Team & Owners' },
  { id: 'tab-segments', label: 'Business Segments' },
  { id: 'tab-opportunities', label: 'Leads & Opportunities' },
  { id: 'tab-calculator', label: 'Proposal Calculator' },
  { id: 'tab-activities', label: 'Engagement & Interactions' },
  { id: 'tab-followups', label: 'Follow-up Tracker' },
  { id: 'tab-internal', label: 'Internal BD Activities' },
  { id: 'tab-review', label: 'Monthly Management Review' },
  { id: 'tab-users', label: 'Users & Permissions' },
];

export const AddUserModal: React.FC = () => {
  const { closeModal, addUser } = useCRM();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'BD Executive' as UserRole,
    status: 'Active' as const,
    allowed_tabs: ['tab-dashboard', 'tab-clients', 'tab-opportunities', 'tab-activities', 'tab-followups'],
  });

  const toggleTab = (tabId: string) => {
    setFormData((prev) => {
      const exists = prev.allowed_tabs.includes(tabId);
      const updated = exists ? prev.allowed_tabs.filter((t) => t !== tabId) : [...prev.allowed_tabs, tabId];
      return { ...prev, allowed_tabs: updated };
    });
  };

  const handleRoleChange = (role: UserRole) => {
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
    if (!formData.name.trim() || !formData.email.trim()) return;

    addUser({
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
      <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <ShieldPlus size={18} style={{ color: '#dc2626' }} />
            <span>Add User &amp; Assign Role Permissions (RBAC)</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-section">
            <div className="form-grid-2">
              <div className="form-group">
                <label>User Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Priya Iyer"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Corporate Email *</label>
                <input
                  type="email"
                  required
                  className="form-control"
                  placeholder="priya.i@corpbd.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>System Role</label>
                <select
                  className="form-control"
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
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
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive / Suspended</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '8px' }}>
                Module Access Permissions
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  background: '#f8fafc',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                {ALL_TABS.map((tab) => (
                  <label
                    key={tab.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      fontSize: '12px',
                      color: '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.allowed_tabs.includes(tab.id)}
                      onChange={() => toggleTab(tab.id)}
                    />
                    <span>{tab.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
