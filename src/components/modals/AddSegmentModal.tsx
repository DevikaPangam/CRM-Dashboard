import React, { useState } from 'react';
import { X, Layers, ShieldAlert } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useRBAC } from '../../context/RBACContext';

export const AddSegmentModal: React.FC = () => {
  const { closeModal, addSegment, teamMembers, currentUser } = useCRM();
  const { isSuperAdmin, canCreate } = useRBAC();
  const isAdmin = isSuperAdmin || canCreate('segments');

  const [formData, setFormData] = useState({
    name: '',
    category: 'Corporate Mobility',
    targetMarginPct: 20,
    leadOwner: 'Devika Pangam',
    description: '',
  });

  if (!isAdmin) {
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content-box" style={{ maxWidth: '420px', textAlign: 'center', padding: '24px' }}>
          <ShieldAlert size={36} style={{ color: '#dc2626', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Access Restricted
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            Only System Administrators have permission to create business segments and assign Practice Leads.
          </p>
          <button className="btn btn-secondary" onClick={closeModal}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addSegment({
      name: formData.name,
      category: formData.category,
      targetMarginPct: Number(formData.targetMarginPct) || 20,
      leadOwner: formData.leadOwner,
      description: formData.description,
      activeClientsCount: 0,
      pipelineValueINR: 0,
    });

    closeModal();
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <Layers size={18} style={{ color: '#10b981' }} />
            <span>Add Business Segment (System Admin)</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-section">
            <div className="form-group">
              <label>Business Segment Name *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Electric Vehicle Fleet Solutions"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Industry Category</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Clean Energy Logistics"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Target Gross Margin (%)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  className="form-control"
                  value={formData.targetMarginPct}
                  onChange={(e) => setFormData({ ...formData, targetMarginPct: Number(e.target.value) || 20 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Practice Lead / Segment Head (Admin Only)</label>
              <select
                className="form-control"
                value={formData.leadOwner}
                onChange={(e) => setFormData({ ...formData, leadOwner: e.target.value })}
              >
                {teamMembers.map((tm) => (
                  <option key={tm.id} value={tm.name}>
                    {tm.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Description &amp; Offerings</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Key services included under this segment..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Segment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
