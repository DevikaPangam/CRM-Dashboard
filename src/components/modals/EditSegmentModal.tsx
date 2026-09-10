import React, { useState, useEffect } from 'react';
import { X, Layers, Save, ShieldAlert } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useRBAC } from '../../context/RBACContext';
import { BusinessSegment } from '../../types/crm';

export const EditSegmentModal: React.FC = () => {
  const { closeModal, activeModal, updateSegment, teamMembers, currentUser } = useCRM();
  const { isSuperAdmin, canEdit } = useRBAC();
  const isAdmin = isSuperAdmin || canEdit('segments');
  const segmentToEdit: BusinessSegment | undefined = activeModal.data;

  const [formData, setFormData] = useState({
    name: segmentToEdit?.name || '',
    category: segmentToEdit?.category || 'Corporate Mobility',
    targetMarginPct: segmentToEdit?.targetMarginPct || 20,
    leadOwner: segmentToEdit?.leadOwner || 'Devika Pangam',
    description: segmentToEdit?.description || '',
  });

  useEffect(() => {
    if (segmentToEdit) {
      setFormData({
        name: segmentToEdit.name,
        category: segmentToEdit.category,
        targetMarginPct: segmentToEdit.targetMarginPct,
        leadOwner: segmentToEdit.leadOwner,
        description: segmentToEdit.description,
      });
    }
  }, [segmentToEdit]);

  if (!isAdmin) {
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content-box" style={{ maxWidth: '420px', textAlign: 'center', padding: '24px' }}>
          <ShieldAlert size={36} style={{ color: '#dc2626', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Access Restricted
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            Only System Administrators have permission to edit business segments and assign Practice Leads.
          </p>
          <button className="btn btn-secondary" onClick={closeModal}>
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!segmentToEdit) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    updateSegment(segmentToEdit.id, {
      name: formData.name,
      category: formData.category,
      targetMarginPct: Number(formData.targetMarginPct) || 20,
      leadOwner: formData.leadOwner,
      description: formData.description,
    });

    closeModal();
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <Layers size={18} style={{ color: '#10b981' }} />
            <span>Edit Business Segment ({segmentToEdit.id})</span>
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
              <label>Practice Lead / Segment Head</label>
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
                rows={3}
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
              <Save size={14} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
