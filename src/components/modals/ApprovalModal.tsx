import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, ShieldAlert, Save } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';

export const ApprovalModal: React.FC = () => {
  const { closeModal, activeModal, updateTaskStatus, updateOpportunity, updateOpportunityDelegation, currentUser } = useCRM();
  const data = activeModal.data; // { type: 'task' | 'opportunity' | 'delegation', item: any }

  const [decision, setDecision] = useState<'Approved' | 'Rejected'>('Approved');
  const [remarks, setRemarks] = useState('');
  const [approverName, setApproverName] = useState(currentUser.name || 'Department Head');

  if (!data || !data.item) return null;

  const { type, item } = data;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().slice(0, 10);

    if (type === 'task') {
      updateTaskStatus(
        item.id,
        decision as any,
        remarks || (decision === 'Approved' ? 'Approved by department head.' : 'Request rejected.')
      );
    } else if (type === 'opportunity') {
      updateOpportunity(item.id, {
        approvalStatus: decision,
        approvalRemarks: remarks || (decision === 'Approved' ? 'Deal terms approved.' : 'Deal proposal rejected.'),
        approvedBy: approverName,
        approvedDate: today,
        status: decision === 'Rejected' ? 'Lost' : item.status,
      });
    } else if (type === 'delegation') {
      updateOpportunityDelegation(item.id, {
        delegationStatus: decision === 'Approved' ? 'Approved & Handed Off' : 'Rejected',
        delegationRemarks: remarks || `${decision} by ${approverName}`,
      });
    }

    closeModal();
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div
          className="modal-header-section"
          style={{
            background: decision === 'Approved' ? '#f0fdf4' : '#fef2f2',
            borderBottom: `1px solid ${decision === 'Approved' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          <div className="modal-header-title">
            {decision === 'Approved' ? (
              <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
            ) : (
              <XCircle size={18} style={{ color: '#dc2626' }} />
            )}
            <span style={{ color: decision === 'Approved' ? '#166534' : '#991b1b' }}>
              {decision === 'Approved' ? 'Approve Workflow & Deal' : 'Reject Workflow / Request'}
            </span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-section">
            {/* Target Item Overview */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                {item.title || item.name}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                {item.clientName && <span>Client: <strong>{item.clientName}</strong> • </span>}
                {item.department && <span>Department: <strong>{item.department}</strong> • </span>}
                {item.stage && <span>Pipeline Stage: <strong>{item.stage}</strong></span>}
              </div>
            </div>

            {/* Decision Selector */}
            <div className="form-group">
              <label style={{ fontWeight: 700 }}>Approval Decision *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setDecision('Approved')}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: `2px solid ${decision === 'Approved' ? '#16a34a' : '#e2e8f0'}`,
                    background: decision === 'Approved' ? '#f0fdf4' : '#ffffff',
                    color: decision === 'Approved' ? '#166534' : '#64748b',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <CheckCircle2 size={16} style={{ color: decision === 'Approved' ? '#16a34a' : '#94a3b8' }} />
                  <span>Approve &amp; Sign Off</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('Rejected')}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: `2px solid ${decision === 'Rejected' ? '#dc2626' : '#e2e8f0'}`,
                    background: decision === 'Rejected' ? '#fef2f2' : '#ffffff',
                    color: decision === 'Rejected' ? '#991b1b' : '#64748b',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <XCircle size={16} style={{ color: decision === 'Rejected' ? '#dc2626' : '#94a3b8' }} />
                  <span>Reject Request</span>
                </button>
              </div>
            </div>

            {/* Approver Name */}
            <div className="form-group">
              <label>Authorized Approver Name</label>
              <input
                type="text"
                required
                className="form-control"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
              />
            </div>

            {/* Approval / Rejection Remarks */}
            <div className="form-group">
              <label>
                {decision === 'Approved' ? 'Approval Conditions / Remarks' : 'Rejection Reason & Remarks *'}
              </label>
              <textarea
                required={decision === 'Rejected'}
                rows={3}
                className="form-control"
                placeholder={
                  decision === 'Approved'
                    ? 'e.g., Approved subject to 15% advance payment and standard liability caps.'
                    : 'e.g., Commercial margins below minimum CFO threshold (need min 20% margin).'
                }
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div
              style={{
                fontSize: '11.5px',
                color: decision === 'Approved' ? '#166534' : '#991b1b',
                background: decision === 'Approved' ? '#f0fdf4' : '#fef2f2',
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${decision === 'Approved' ? '#bbf7d0' : '#fecaca'}`,
              }}
            >
              {decision === 'Approved'
                ? '✓ This approval with your remarks will be recorded in the audit log and the workflow status will be updated to Approved.'
                : '⚠ Rejecting this item will update the status to Rejected and notify the business development owner with the provided remarks.'}
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${decision === 'Approved' ? 'btn-success' : 'btn-danger'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={14} />
              <span>Submit {decision}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
