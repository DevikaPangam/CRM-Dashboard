import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';

export const AddTeamModal: React.FC = () => {
  const { closeModal, addTeamMember, addUser } = useCRM();

  const [formData, setFormData] = useState({
    name: '',
    title: 'BD Manager',
    email: '',
    phone: '',
    region: 'West Region',
    annualTargetINR: 50000000,
    createUserAccount: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addTeamMember({
      name: formData.name,
      title: formData.title,
      email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@corpbd.com`,
      phone: formData.phone || '+91 98000 00000',
      region: formData.region,
      annualTargetINR: Number(formData.annualTargetINR) || 0,
      achievedINR: 0,
      activeOppsCount: 0,
      status: 'Active',
    });

    if (formData.createUserAccount) {
      addUser({
        name: formData.name,
        email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@corpbd.com`,
        role: 'BD Manager',
        role_name: formData.title,
        status: 'Active',
        allowed_tabs: [
          'tab-dashboard',
          'tab-clients',
          'tab-team',
          'tab-opportunities',
          'tab-activities',
          'tab-followups',
          'tab-internal',
          'tab-review',
        ],
      });
    }

    closeModal();
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <UserPlus size={18} style={{ color: '#0284c7' }} />
            <span>Add BD Team Member</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-section">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Varun Kapoor"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Job Title / Designation</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Senior BD Manager"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Assigned Region</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="North &amp; West"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="varun.k@corpbd.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+91 98200 44556"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Annual Revenue Target (INR ₹)</label>
              <input
                type="number"
                className="form-control"
                value={formData.annualTargetINR}
                onChange={(e) => setFormData({ ...formData, annualTargetINR: Number(e.target.value) || 0 })}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
              <input
                type="checkbox"
                id="createUserAcc"
                checked={formData.createUserAccount}
                onChange={(e) => setFormData({ ...formData, createUserAccount: e.target.checked })}
              />
              <label htmlFor="createUserAcc" style={{ fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
                Automatically provision user login and CRM dashboard access
              </label>
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Team Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
