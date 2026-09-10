import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Check, AlertCircle, HardDrive } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { PIPELINE_STAGES, DOCUMENT_TYPES } from '../../utils/seedData';
import { storageService, validateDocumentFile, ALLOWED_EXTENSIONS } from '../../services/storageService';

export const UploadDocModal: React.FC = () => {
  const { closeModal, activeModal, addDocument, opportunities, clients, currentUser } = useCRM();
  const { profile, authUser } = useAuth();
  const { canCreate } = useRBAC();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const preselectedOppId = activeModal.data?.opportunityId || opportunities[0]?.id || '';
  const preselectedOpp = opportunities.find((o) => o.id === preselectedOppId);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: activeModal.data?.defaultFilename || '',
    opportunityId: preselectedOpp?.id || '',
    opportunityTitle: preselectedOpp?.title || '',
    clientId: preselectedOpp?.clientId || clients[0]?.id || '',
    clientName: preselectedOpp?.clientName || clients[0]?.name || '',
    stage: preselectedOpp?.stage || PIPELINE_STAGES[6],
    documentType: DOCUMENT_TYPES[0],
    notes: '',
  });

  const handleFileChange = (file: File) => {
    setErrorMessage(null);
    const validation = validateDocumentFile(file);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Invalid file.');
      return;
    }

    setSelectedFile(file);
    if (!formData.name) {
      setFormData((prev) => ({ ...prev, name: file.name }));
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!canCreate('documents')) {
      setErrorMessage('Security Policy Violation: You do not have permission to upload documents.');
      return;
    }

    if (!selectedFile) {
      setErrorMessage('Please select a file to upload to the secure documents vault.');
      return;
    }

    if (!formData.name.trim()) {
      setErrorMessage('Display filename is required.');
      return;
    }

    setUploading(true);

    try {
      const orgId = profile?.organization_id || '00000000-0000-0000-0000-000000000001';
      const result = await storageService.uploadDocumentFile({
        file: selectedFile,
        displayName: formData.name.trim(),
        documentType: formData.documentType,
        stage: formData.stage,
        clientId: formData.clientId || undefined,
        clientName: formData.clientName || undefined,
        opportunityId: formData.opportunityId || undefined,
        opportunityTitle: formData.opportunityTitle || undefined,
        notes: formData.notes,
        organizationId: orgId,
        userId: authUser?.id,
        userName: profile?.full_name || currentUser.name,
      });

      if (!result.success || !result.document) {
        setErrorMessage(result.error || 'Failed to upload document.');
        setUploading(false);
        return;
      }

      addDocument(result.document);
      closeModal();
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during document upload.');
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <Upload size={18} style={{ color: '#0284c7' }} />
            <span>Upload Document to Vault (Private Supabase Storage)</span>
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

            {/* File Drag & Drop Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? '#0284c7' : '#cbd5e1'}`,
                borderRadius: '8px',
                padding: '24px 16px',
                textAlign: 'center',
                background: isDragging ? '#f0f9ff' : '#f8fafc',
                cursor: 'pointer',
                marginBottom: '16px',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <HardDrive size={28} style={{ color: '#0284c7', margin: '0 auto 8px', display: 'block' }} />
              {selectedFile ? (
                <div>
                  <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                    {selectedFile.name}
                  </strong>
                  <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 600 }}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to Upload
                  </span>
                </div>
              ) : (
                <div>
                  <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                    Click or Drag &amp; Drop Document to Upload
                  </strong>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Supported: PDF, DOCX, XLSX, PPTX, CSV, PNG, JPG (Max 25 MB)
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>File Display Name *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. TCS_Commercial_Proposal_Final_v2.pdf"
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
                <label>Pipeline Stage Tag</label>
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

            <div className="form-grid-2">
              <div className="form-group">
                <label>Associated Client</label>
                <select
                  className="form-control"
                  value={formData.clientId}
                  onChange={(e) => {
                    const c = clients.find((cl) => cl.id === e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      clientId: e.target.value,
                      clientName: c?.name || '',
                    }));
                  }}
                >
                  <option value="">-- General Document (No Client) --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Associated Opportunity Deal</label>
                <select
                  className="form-control"
                  value={formData.opportunityId}
                  onChange={(e) => handleOppChange(e.target.value)}
                >
                  <option value="">-- No Specific Opportunity --</option>
                  {opportunities.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title} ({o.clientName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '10px' }}>
              <label>Internal Notes / Version Remarks</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="e.g. Commercial proposal approved by VP Operations; signed copy awaiting handoff."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={uploading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? (
                <span>Uploading to Vault...</span>
              ) : (
                <>
                  <Upload size={15} />
                  <span>Secure Upload &amp; Tag</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
