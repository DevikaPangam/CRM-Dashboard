import React, { useState, useEffect } from 'react';
import { X, FileEdit, Save } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useRBAC } from '../../context/RBACContext';
import { CRMDocument } from '../../types/crm';
import { PIPELINE_STAGES, DOCUMENT_TYPES } from '../../utils/seedData';

export const EditDocModal: React.FC = () => {
  const { closeModal, activeModal, updateDocument, opportunities } = useCRM();
  const { canEdit } = useRBAC();
  const docToEdit: CRMDocument | undefined = activeModal.data;

  const [formData, setFormData] = useState({
    name: docToEdit?.name || '',
    stage: docToEdit?.stage || PIPELINE_STAGES[0],
    documentType: docToEdit?.documentType || DOCUMENT_TYPES[0],
    opportunityId: docToEdit?.opportunityId || '',
    notes: docToEdit?.notes || '',
  });

  useEffect(() => {
    if (docToEdit) {
      setFormData({
        name: docToEdit.name,
        stage: docToEdit.stage,
        documentType: docToEdit.documentType,
        opportunityId: docToEdit.opportunityId || '',
        notes: docToEdit.notes || '',
      });
    }
  }, [docToEdit]);

  if (!docToEdit) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit('documents')) {
      alert('Security Policy Violation: You do not have permission to edit document metadata.');
      return;
    }
    if (!formData.name.trim()) return;

    const opp = opportunities.find((o) => o.id === formData.opportunityId);

    updateDocument(docToEdit.id, {
      name: formData.name,
      stage: formData.stage,
      documentType: formData.documentType,
      opportunityId: formData.opportunityId || undefined,
      opportunityTitle: opp ? opp.title : docToEdit.opportunityTitle,
      clientId: opp ? opp.clientId : docToEdit.clientId,
      clientName: opp ? opp.clientName : docToEdit.clientName,
      notes: formData.notes,
    });

    closeModal();
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <FileEdit size={18} style={{ color: '#0284c7' }} />
            <span>Edit Document Name &amp; Stage Details ({docToEdit.id})</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-section">
            <div className="form-group">
              <label>File Name * (Edit for any stage)</label>
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
                <label>Document Category</label>
                <select
                  className="form-control"
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                >
                  {DOCUMENT_TYPES.map((dt) => (
                    <option key={dt} value={dt}>
                      {dt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Associated Pipeline Stage</label>
                <select
                  className="form-control"
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                >
                  {PIPELINE_STAGES.map((stg) => (
                    <option key={stg} value={stg}>
                      {stg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Associated Lead / Opportunity</label>
              <select
                className="form-control"
                value={formData.opportunityId}
                onChange={(e) => setFormData({ ...formData, opportunityId: e.target.value })}
              >
                <option value="">-- Standalone Document --</option>
                {opportunities.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.title} ({opp.clientName})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Version Notes &amp; Scope Details</label>
              <textarea
                className="form-control"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={14} />
              <span>Save Document Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
