import React, { useState, useEffect } from 'react';
import { X, Edit3, UserCheck, UserX, AlertTriangle, Save, Trash2 } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { TeamMember } from '../../types/crm';

export const EditTeamModal: React.FC = () => {
  const { closeModal, activeModal, updateTeamMember, deleteTeamMember } = useCRM();
  const memberToEdit: TeamMember | undefined = activeModal.data;

  const [formData, setFormData] = useState({
    name: memberToEdit?.name || '',
    title: memberToEdit?.title || '',
    email: memberToEdit?.email || '',
    phone: memberToEdit?.phone || '',
    region: memberToEdit?.region || '',
    annualTargetINR: memberToEdit?.annualTargetINR || 50000000,
    status: (memberToEdit?.status || 'Active') as TeamMember['status'],
  });

  useEffect(() => {
    if (memberToEdit) {
      setFormData({
        name: memberToEdit.name,
        title: memberToEdit.title,
        email: memberToEdit.email,
        phone: memberToEdit.phone,
        region: memberToEdit.region,
        annualTargetINR: memberToEdit.annualTargetINR,
        status: memberToEdit.status || 'Active',
      });
    }
  }, [memberToEdit]);

  if (!memberToEdit) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    updateTeamMember(memberToEdit.id, {
      name: formData.name,
      title: formData.title,
      email: formData.email,
      phone: formData.phone,
      region: formData.region,
      annualTargetINR: Number(formData.annualTargetINR) || 0,
      status: formData.status,
    });

    closeModal();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete team member "${memberToEdit.name}"? This action cannot be undone.`)) {
      deleteTeamMember(memberToEdit.id);
      closeModal();
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <Edit3 size={18} style={{ color: '#0284c7' }} />
            <span>Edit BD Team Member ({memberToEdit.name})</span>
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
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Assigned Region</label>
                <input
                  type="text"
                  className="form-control"
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Annual Revenue Target (INR ₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.annualTargetINR}
                  onChange={(e) => setFormData({ ...formData, annualTargetINR: Number(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label>Account / User Status</label>
                <select
                  className="form-control"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  style={{
                    fontWeight: 700,
                    color: formData.status === 'Active' ? '#16a34a' : formData.status === 'Disabled' ? '#dc2626' : '#64748b'
                  }}
                >
                  <option value="Active">🟢 Active (Full Access)</option>
                  <option value="Inactive">⚪ Inactive (On Leave / Dormant)</option>
                  <option value="Disabled">🔴 Disabled (User Disabled / Access Revoked)</option>
                </select>
              </div>
            </div>

            {formData.status === 'Disabled' && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#991b1b',
                  marginTop: '6px'
                }}
              >
                <AlertTriangle size={16} />
                <span>
                  <strong>User Disabled:</strong> This member will be flagged as disabled across the CRM and prevented from taking on new pipeline ownership.
                </span>
              </div>
            )}
          </div>

          <div className="modal-footer-section" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Trash2 size={14} />
              <span>Delete Member</span>
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={14} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
