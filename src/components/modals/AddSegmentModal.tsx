import React, { useState } from 'react';
import { X, Layers } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';

export const AddSegmentModal: React.FC = () => {
  const { closeModal, addSegment, teamMembers } = useCRM();

  const [formData, setFormData] = useState({
    name: '',
    category: 'Corporate Mobility',
    targetMarginPct: 20,
    leadOwner: teamMembers[0]?.name || 'Rahul Sharma',
    description: '',
  });

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
            <span>Add Business Segment</span>
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
