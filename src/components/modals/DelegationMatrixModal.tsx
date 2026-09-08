import React, { useState, useEffect } from 'react';
import { X, GitPullRequest, Save, ArrowRight } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Opportunity } from '../../types/crm';
import { DEPARTMENTS } from '../../utils/seedData';

export const DelegationMatrixModal: React.FC = () => {
  const { closeModal, activeModal, updateOpportunityDelegation, teamMembers } = useCRM();
  const oppToDelegate: Opportunity | undefined = activeModal.data;

  const [formData, setFormData] = useState({
    delegatedDepartment: (oppToDelegate?.delegatedDepartment || 'Operations') as Opportunity['delegatedDepartment'],
    delegatedOwner: oppToDelegate?.delegatedOwner || 'Manish Rawat (VP - Ops)',
    delegationStatus: (oppToDelegate?.delegationStatus || 'Pending Action') as Opportunity['delegationStatus'],
    delegationMilestone: oppToDelegate?.delegationMilestone || 'Technical Feasibility & Cost Modeling',
    slaDaysRemaining: oppToDelegate?.slaDaysRemaining !== undefined ? oppToDelegate.slaDaysRemaining : 2,
    delegationRemarks: oppToDelegate?.delegationRemarks || '',
  });

  useEffect(() => {
    if (oppToDelegate) {
      setFormData({
        delegatedDepartment: oppToDelegate.delegatedDepartment || 'Operations',
        delegatedOwner: oppToDelegate.delegatedOwner || 'Manish Rawat (VP - Ops)',
        delegationStatus: oppToDelegate.delegationStatus || 'Pending Action',
        delegationMilestone: oppToDelegate.delegationMilestone || 'Technical Feasibility & Cost Modeling',
        slaDaysRemaining: oppToDelegate.slaDaysRemaining !== undefined ? oppToDelegate.slaDaysRemaining : 2,
        delegationRemarks: oppToDelegate.delegationRemarks || '',
      });
    }
  }, [oppToDelegate]);

  if (!oppToDelegate) return null;

  const handleDeptChange = (dept: string) => {
    let owner = 'Department Lead';
    let milestone = 'Review and execute delegated action';
    if (dept === 'Operations') {
      owner = 'Manish Rawat (VP - Ops)';
      milestone = 'Route survey & vehicle turnaround feasibility analysis';
    } else if (dept === 'Pricing & Commercials') {
      owner = 'Sunil Mehta (CFO)';
      milestone = 'Discount margin calculation & gross profit threshold approval';
    } else if (dept === 'Legal & Compliance') {
      owner = 'Adv. Preeti Chawla (Legal)';
      milestone = 'SLA terms, liability caps & indemnity clause clearance';
    } else if (dept === 'Fleet / Asset Management') {
      owner = 'Kishore Jha (Fleet Head)';
      milestone = 'Chassis allocation & OEM delivery schedule sign-off';
    } else if (dept === 'Management') {
      owner = 'Devika Pangam (COO/Admin)';
      milestone = 'Executive Board approval on strategic enterprise terms';
    } else if (dept === 'BD') {
      owner = oppToDelegate.owner;
      milestone = 'Commercial proposal walkthrough & presentation with client';
    }

    setFormData({
      ...formData,
      delegatedDepartment: dept as any,
      delegatedOwner: owner,
      delegationMilestone: milestone,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.delegationMilestone.trim()) return;

    updateOpportunityDelegation(oppToDelegate.id, {
      delegatedDepartment: formData.delegatedDepartment,
      delegatedOwner: formData.delegatedOwner,
      delegationStatus: formData.delegationStatus,
      delegationMilestone: formData.delegationMilestone,
      slaDaysRemaining: Number(formData.slaDaysRemaining) || 0,
      delegationRemarks: formData.delegationRemarks,
    });

    closeModal();
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <GitPullRequest size={18} style={{ color: '#d97706' }} />
            <span>Update Delegation Matrix ({oppToDelegate.code || oppToDelegate.id})</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-section">
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{oppToDelegate.title}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Client: <strong>{oppToDelegate.clientName}</strong> ({oppToDelegate.clientType || 'Enterprise'}) • Stage: <strong>{oppToDelegate.stage}</strong>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Delegated Department</label>
                <select
                  className="form-control"
                  value={formData.delegatedDepartment}
                  onChange={(e) => handleDeptChange(e.target.value)}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Responsible Delegate Owner</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={formData.delegatedOwner}
                  onChange={(e) => setFormData({ ...formData, delegatedOwner: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Delegation Action Status</label>
                <select
                  className="form-control"
                  value={formData.delegationStatus}
                  onChange={(e) => setFormData({ ...formData, delegationStatus: e.target.value as any })}
                  style={{
                    fontWeight: 700,
                    color: formData.delegationStatus === 'Approved & Handed Off' || formData.delegationStatus === 'Action Completed'
                      ? '#16a34a'
                      : formData.delegationStatus === 'Rejected'
                      ? '#dc2626'
                      : '#d97706',
                  }}
                >
                  <option value="Pending Action">⏳ Pending Action</option>
                  <option value="In Review">🔍 In Review</option>
                  <option value="Approved & Handed Off">✅ Approved &amp; Handed Off</option>
                  <option value="Action Completed">🎉 Action Completed</option>
                  <option value="Escalated">🚨 Escalated (Urgent)</option>
                  <option value="Rejected">❌ Rejected / Returned with Remarks</option>
                </select>
              </div>

              <div className="form-group">
                <label>Target SLA (Days Remaining)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  className="form-control"
                  value={formData.slaDaysRemaining}
                  onChange={(e) => setFormData({ ...formData, slaDaysRemaining: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Milestone Action Deliverable *</label>
              <textarea
                required
                className="form-control"
                rows={2}
                value={formData.delegationMilestone}
                onChange={(e) => setFormData({ ...formData, delegationMilestone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Approval / Rejection Remarks &amp; Conditions</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Enter specific approval conditions or reasons for rejection / remarks..."
                value={formData.delegationRemarks}
                onChange={(e) => setFormData({ ...formData, delegationRemarks: e.target.value })}
              />
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px', fontSize: '11.5px', color: '#166534' }}>
              ✓ Note: Saving will synchronize this status to the Opportunity Pipeline, create/update linked departmental tasks in <strong>Internal BD Activities</strong>, and update executive tracking.
            </div>
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={14} />
              <span>Apply Delegation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
