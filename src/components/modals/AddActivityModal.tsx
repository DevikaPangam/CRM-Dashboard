import React, { useState } from 'react';
import { X, Calendar, GitPullRequest, CheckCircle2, Clock } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useRBAC } from '../../context/RBACContext';
import { Activity, Opportunity } from '../../types/crm';
import { DEPARTMENTS } from '../../utils/seedData';

export const AddActivityModal: React.FC = () => {
  const { closeModal, activeModal, addActivity, updateOpportunityDelegation, clients, opportunities, teamMembers } = useCRM();
  const { canCreate } = useRBAC();

  const initialType = (activeModal.data?.type || 'Physical Meeting') as Activity['type'];
  const defaultClientId = activeModal.data?.clientId || clients[0]?.id || '';
  const defaultClient = clients.find((c) => c.id === defaultClientId) || clients[0];
  const initialOppId = activeModal.data?.opportunityId || '';
  const matchedOpp = opportunities.find((o) => o.id === initialOppId);

  const [formData, setFormData] = useState({
    type: initialType,
    clientId: defaultClient?.id || '',
    clientName: defaultClient?.name || '',
    opportunityId: initialOppId,
    opportunityTitle: matchedOpp?.title || '',
    date: new Date().toISOString().slice(0, 10),
    time: '11:00',
    conductedBy: teamMembers[0]?.name || 'Aditya Patil',
    contactPerson: defaultClient?.contacts[0]?.name || 'Client Representative',
    location: 'Client HQ',
    keyDiscussion: '',
    outcome: '',
    actionItems: '',
    nextFollowupDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    status: 'Completed' as const,

    // Clubbed Delegation Matrix Fields
    enableDelegation: !!initialOppId,
    delegatedDepartment: (matchedOpp?.delegatedDepartment || 'Operations') as Opportunity['delegatedDepartment'],
    delegatedOwner: matchedOpp?.delegatedOwner || 'Manish Rawat (VP - Ops)',
    delegationStatus: (matchedOpp?.delegationStatus || 'Pending Action') as Opportunity['delegationStatus'],
    delegationMilestone: matchedOpp?.delegationMilestone || 'Review route survey & commercial pricing feasibility',
    slaDaysRemaining: matchedOpp?.slaDaysRemaining !== undefined ? matchedOpp.slaDaysRemaining : 2,
    delegationRemarks: matchedOpp?.delegationRemarks || '',
  });

  const handleClientChange = (clientId: string) => {
    const selected = clients.find((c) => c.id === clientId);
    const clientOpps = opportunities.filter((o) => o.clientId === clientId);
    setFormData((prev) => ({
      ...prev,
      clientId,
      clientName: selected ? selected.name : '',
      contactPerson: selected?.contacts[0]?.name || '',
      opportunityId: clientOpps[0]?.id || '',
      opportunityTitle: clientOpps[0]?.title || '',
    }));
  };

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
      owner = formData.conductedBy;
      milestone = 'Commercial proposal walkthrough & presentation with client';
    }

    setFormData((prev) => ({
      ...prev,
      delegatedDepartment: dept as any,
      delegatedOwner: owner,
      delegationMilestone: milestone,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate('activities')) {
      alert('Security Policy Violation: You do not have permission to log activities.');
      return;
    }
    if (!formData.keyDiscussion.trim()) return;

    // 1. Log Activity
    addActivity({
      type: formData.type,
      clientId: formData.clientId,
      clientName: formData.clientName,
      opportunityId: formData.opportunityId || undefined,
      opportunityTitle: formData.opportunityTitle || undefined,
      date: formData.date,
      time: formData.time,
      conductedBy: formData.conductedBy,
      contactPerson: formData.contactPerson,
      location: formData.location,
      keyDiscussion: formData.keyDiscussion,
      outcome: formData.outcome,
      actionItems: formData.actionItems,
      nextFollowupDate: formData.nextFollowupDate,
      status: formData.status,
    });

    // 2. If delegation enabled and opportunity selected, update Delegation Matrix
    if (formData.enableDelegation && formData.opportunityId) {
      updateOpportunityDelegation(formData.opportunityId, {
        delegatedDepartment: formData.delegatedDepartment,
        delegatedOwner: formData.delegatedOwner,
        delegationStatus: formData.delegationStatus,
        delegationMilestone: formData.delegationMilestone,
        slaDaysRemaining: Number(formData.slaDaysRemaining) || 0,
        delegationRemarks: formData.delegationRemarks,
      });
    }

    closeModal();
  };

  const clientOpps = opportunities.filter((o) => o.clientId === formData.clientId);

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content-box" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-section">
          <div className="modal-header-title">
            <Calendar size={18} style={{ color: '#0284c7' }} />
            <span>Log Client Engagement &amp; Delegation Matrix Handoff</span>
          </div>
          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body-section">
            {/* Section 1: Interaction Details */}
            <div className="form-grid-2">
              <div className="form-group">
                <label>Interaction Type *</label>
                <select
                  className="form-control"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="Physical Meeting">Physical Meeting</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="Proposal Discussion">Proposal Discussion</option>
                  <option value="Commercial Negotiation">Commercial Negotiation</option>
                  <option value="Client Review">Client Review</option>
                  <option value="Site Visit">Site Visit</option>
                  <option value="Email Communication">Email Communication</option>
                </select>
              </div>

              <div className="form-group">
                <label>Client *</label>
                <select
                  className="form-control"
                  value={formData.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.clientType})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Related Opportunity / Pipeline Deal</label>
              <select
                className="form-control"
                value={formData.opportunityId}
                onChange={(e) => {
                  const opp = opportunities.find((o) => o.id === e.target.value);
                  setFormData({
                    ...formData,
                    opportunityId: e.target.value,
                    opportunityTitle: opp ? opp.title : '',
                    enableDelegation: !!e.target.value,
                  });
                }}
              >
                <option value="">-- None / General Account Meeting --</option>
                {clientOpps.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.title} ({opp.code || opp.id}) • Stage: {opp.stage}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Date &amp; Time</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                  <input
                    type="time"
                    className="form-control"
                    style={{ width: '105px' }}
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>BD Team Representative</label>
                <select
                  className="form-control"
                  value={formData.conductedBy}
                  onChange={(e) => setFormData({ ...formData, conductedBy: e.target.value })}
                >
                  {teamMembers.map((tm) => (
                    <option key={tm.id} value={tm.name}>
                      {tm.name} ({tm.title})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Client Contact Person</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Location / Mode</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Key Discussion Points *</label>
              <textarea
                required
                className="form-control"
                rows={2}
                placeholder="Details of client discussion, feedback, and technical/commercial requirements..."
                value={formData.keyDiscussion}
                onChange={(e) => setFormData({ ...formData, keyDiscussion: e.target.value })}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Meeting Outcome</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Client agreed to commercial terms"
                  value={formData.outcome}
                  onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Next Action Items</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Send updated pricing annexure"
                  value={formData.actionItems}
                  onChange={(e) => setFormData({ ...formData, actionItems: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Next Follow-up Due Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.nextFollowupDate}
                onChange={(e) => setFormData({ ...formData, nextFollowupDate: e.target.value })}
              />
            </div>

            {/* Section 2: Clubbed Delegation Matrix Handoff */}
            {formData.opportunityId && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  marginTop: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GitPullRequest size={16} style={{ color: '#d97706' }} />
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                      Clubbed Delegation Matrix &amp; Department Handoff
                    </strong>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: '#0284c7', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={formData.enableDelegation}
                      onChange={(e) => setFormData({ ...formData, enableDelegation: e.target.checked })}
                    />
                    Update Delegation Matrix with this Log
                  </label>
                </div>

                {formData.enableDelegation && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="form-grid-2">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '11.5px' }}>Delegated Department</label>
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

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '11.5px' }}>Responsible Delegate Owner</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.delegatedOwner}
                          onChange={(e) => setFormData({ ...formData, delegatedOwner: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '11.5px' }}>Delegation Action Status</label>
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
                          <option value="Rejected">❌ Rejected with Remarks</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '11.5px' }}>Target SLA (Days Remaining)</label>
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

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '11.5px' }}>Milestone Action Deliverable</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.delegationMilestone}
                        onChange={(e) => setFormData({ ...formData, delegationMilestone: e.target.value })}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '11.5px' }}>Approval / Delegation Conditions &amp; Remarks</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Operations feasibility sign-off given for 25 vehicles."
                        value={formData.delegationRemarks}
                        onChange={(e) => setFormData({ ...formData, delegationRemarks: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer-section">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Calendar size={14} />
              <span>Log Activity &amp; Apply Delegation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
