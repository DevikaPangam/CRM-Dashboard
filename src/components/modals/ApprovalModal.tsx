import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, ShieldAlert, Save, AlertTriangle } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { CRMModuleKey } from '../../types/database.types';
import { proposalService } from '../../services/proposalService';

export const ApprovalModal: React.FC = () => {
  const { closeModal, activeModal, updateTaskStatus, updateOpportunity, updateOpportunityDelegation, currentUser } = useCRM();
  const { profile, authUser } = useAuth();
  const { canApprove } = useRBAC();
  const data = activeModal.data; // { type: 'task' | 'opportunity' | 'delegation' | 'proposal', item: any }

  const [decision, setDecision] = useState<'Approved' | 'Rejected'>('Approved');
  const [remarks, setRemarks] = useState('');
  const [approverName, setApproverName] = useState(profile?.full_name || currentUser.name || 'Department Head');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!data || !data.item) return null;

  const { type, item } = data;
  const targetModule: CRMModuleKey = type === 'proposal' ? 'calculator' : type === 'opportunity' ? 'opportunities' : type === 'delegation' ? 'opportunities' : 'internal';
  const hasApprovePerm = canApprove(targetModule);

  // Separation of Duties Check: User cannot approve their own item
  const isOwner =
    (item.ownerId && item.ownerId === authUser?.id) ||
    (item.submittedBy && item.submittedBy === authUser?.id) ||
    (item.owner && item.owner === currentUser.name) ||
    (item.assignedBy && item.assignedBy === currentUser.name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!hasApprovePerm) {
      setErrorMessage('Security Policy Violation: You do not have permission to execute approval actions in this module.');
      return;
    }

    if (decision === 'Approved' && isOwner) {
      setErrorMessage('Security Policy Violation: Separation of Duties prevents approving records that you created or own.');
      return;
    }

    if (decision === 'Rejected' && !remarks.trim()) {
      setErrorMessage('A rejection reason is required to give actionable feedback to the author.');
      return;
    }

    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const orgId = profile?.organization_id || '00000000-0000-0000-0000-000000000001';

    try {
      if (type === 'proposal') {
        if (decision === 'Approved') {
          const res = await proposalService.approveProposal(
            item,
            orgId,
            authUser?.id || '',
            approverName,
            remarks
          );
          if (!res.success) {
            setErrorMessage(res.error || 'Failed to approve proposal.');
            setLoading(false);
            return;
          }
        } else {
          const res = await proposalService.rejectProposal(
            item.id,
            orgId,
            authUser?.id || '',
            approverName,
            remarks
          );
          if (!res.success) {
            setErrorMessage(res.error || 'Failed to reject proposal.');
            setLoading(false);
            return;
          }
        }
      } else if (type === 'task') {
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
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during approval submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
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
              {decision === 'Approved' ? 'Executive Commercial Approval' : 'Reject Workflow / Request'}
            </span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-section">
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
                <AlertTriangle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Separation of Duties Warning */}
            {isOwner && decision === 'Approved' && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fef08a',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  color: '#92400e',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ShieldAlert size={16} style={{ color: '#d97706', flexShrink: 0 }} />
                <span>
                  <strong>Separation of Duties Policy:</strong> You are the author/owner of this item. An independent Director / Manager must sign off.
                </span>
              </div>
            )}

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
                {item.title || item.proposalCode || item.name}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                {item.clientName && <span>Client: <strong>{item.clientName}</strong> • </span>}
                {item.totalCommercialValueINR && (
                  <span>Deal Value: <strong>₹{(item.totalCommercialValueINR / 10000000).toFixed(2)} Cr</strong> • </span>
                )}
                {item.versionLabel && <span>Version: <strong>{item.versionLabel}</strong> • </span>}
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
              <label>Authorized Approver</label>
              <input
                type="text"
                required
                className="form-control"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
              />
            </div>

            {/* Remarks */}
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
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (decision === 'Approved' && isOwner)}
              className={`btn ${decision === 'Approved' ? 'btn-success' : 'btn-danger'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={14} />
              <span>{loading ? 'Submitting...' : `Submit ${decision}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
