import React, { useState } from 'react';
import { X, Upload, FileText, Check } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { PIPELINE_STAGES, DOCUMENT_TYPES } from '../../utils/seedData';

export const UploadDocModal: React.FC = () => {
  const { closeModal, activeModal, addDocument, opportunities, clients, currentUser } = useCRM();

  const preselectedOppId = activeModal.data?.opportunityId || opportunities[0]?.id || '';
  const preselectedOpp = opportunities.find((o) => o.id === preselectedOppId);

  const [formData, setFormData] = useState({
    name: activeModal.data?.defaultFilename || 'Commercial_Proposal_Final_v1.pdf',
    opportunityId: preselectedOpp?.id || '',
    opportunityTitle: preselectedOpp?.title || '',
    clientId: preselectedOpp?.clientId || clients[0]?.id || '',
    clientName: preselectedOpp?.clientName || clients[0]?.name || '',
    stage: preselectedOpp?.stage || PIPELINE_STAGES[6],
    documentType: DOCUMENT_TYPES[0],
    fileSize: '2.5 MB',
    fileExtension: 'pdf',
    notes: '',
  });

  const handleOppChange = (oppId: string) => {
    const opp = opportunities.find((o) => o.id === oppId);
    if (opp) {
      setFormData((prev) => ({
        ...prev,
        opportunityId: opp.id,
        opportunityTitle: opp.title,
        clientId: opp.clientId,
        clientName: opp.clientName,
        stage: opp.stage,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const ext = formData.name.split('.').pop() || 'pdf';

    addDocument({
      name: formData.name,
      originalFilename: formData.name,
      opportunityId: formData.opportunityId || undefined,
      opportunityTitle: formData.opportunityTitle || undefined,
      clientId: formData.clientId || undefined,
      clientName: formData.clientName || undefined,
      stage: formData.stage,
      documentType: formData.documentType,
      fileSize: formData.fileSize || '1.8 MB',
      fileExtension: ext.toLowerCase(),
      uploadedBy: currentUser.name,
      notes: formData.notes,
    });

    closeModal();
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <Upload size={18} style={{ color: '#ec4899' }} />
            <span>Upload &amp; Tag Document to Pipeline Stage</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-section">
            <div className="form-group">
              <label>File Name (Editable) *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. ABC_EV_Rate_Card_v3.pdf"
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
              <label>Link to Lead / Opportunity</label>
              <select
                className="form-control"
                value={formData.opportunityId}
                onChange={(e) => handleOppChange(e.target.value)}
              >
                <option value="">-- Standalone Client Document --</option>
                {opportunities.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.title} ({opp.clientName})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Document Notes &amp; Version History</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Details on approvals, version changes, scope alterations..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer',
              }}
              onClick={() => {
                const dummyName = prompt('Enter or simulate new uploaded file name:', formData.name);
                if (dummyName) setFormData({ ...formData, name: dummyName });
              }}
            >
              <FileText size={32} style={{ color: '#0284c7', margin: '0 auto 8px' }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                Drag and drop files here, or click to browse
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Supports PDF, DOCX, XLSX, DWG, PPTX up to 50MB
              </div>
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Upload size={14} />
              <span>Save &amp; Attach Document</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
