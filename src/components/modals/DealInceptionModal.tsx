import React, { useState } from 'react';
import {
  X, Calendar, GitPullRequest, FileText, CheckCircle2, Clock, AlertTriangle,
  User, Building, DollarSign, Upload, Plus, ShieldCheck, ArrowRight, Activity as ActivityIcon
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Opportunity } from '../../types/crm';
import { formatCurrency, formatDate, getStageBadgeClass, getDelegationStatusBadge } from '../../utils/formatters';

export const DealInceptionModal: React.FC = () => {
  const { closeModal, activeModal, activities, documents, internalTasks, followups, currency, openModal } = useCRM();
  const opp: Opportunity | undefined = activeModal.data;

  const [activeTab, setActiveTab] = useState<'timeline' | 'activities' | 'delegation' | 'documents'>('timeline');

  if (!opp) return null;

  const stageBadge = getStageBadgeClass(opp.stage);
  const delBadge = getDelegationStatusBadge(opp.delegationStatus);
  const isNew = opp.clientType === 'New Client';

  // Fetch all activities related to this opportunity or client
  const relatedActivities = activities
    .filter((a) => a.opportunityId === opp.id || a.clientId === opp.clientId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Fetch all documents related to this opportunity
  const relatedDocs = documents.filter((d) => d.opportunityId === opp.id || d.clientId === opp.clientId);

  // Fetch internal tasks
  const relatedTasks = internalTasks.filter((t) => t.opportunityId === opp.id || t.clientId === opp.clientId);

  // Fetch followups
  const relatedFollowups = followups.filter((f) => f.opportunityId === opp.id || f.clientId === opp.clientId);

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div
        className="modal-content-box"
        style={{ maxWidth: '860px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="modal-header-section" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                {opp.code || opp.id}
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {opp.title}
              </h3>
              <span
                className="pill-badge"
                style={{
                  background: isNew ? '#e0f2fe' : '#ecfdf5',
                  color: isNew ? '#0369a1' : '#047857',
                  border: `1px solid ${isNew ? '#bae6fd' : '#a7f3d0'}`,
                  fontSize: '10.5px',
                  fontWeight: 700,
                }}
              >
                {isNew ? '★ New Client' : '✓ Existing Client'}
              </span>
              <span
                className="pill-badge"
                style={{
                  background: stageBadge.bg,
                  color: stageBadge.text,
                  border: `1px solid ${stageBadge.border}`,
                  fontSize: '10.5px',
                  fontWeight: 700,
                }}
              >
                Stage: {opp.stage} ({opp.probability}%)
              </span>
            </div>

            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span>Client: <strong style={{ color: '#0f172a' }}>{opp.clientName}</strong></span>
              <span>Owner: <strong style={{ color: '#0f172a' }}>{opp.owner}</strong></span>
              <span>Inception Date: <strong style={{ color: '#0f172a' }}>{formatDate(opp.createdDate)}</strong></span>
              <span>Annual Value: <strong style={{ color: '#16a34a' }}>{formatCurrency(opp.dealValueINR, currency)}</strong></span>
            </div>
          </div>

          <button className="modal-close-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>

        {/* Quick Tabs inside History Modal */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 24px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`filter-btn ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              📅 Inception Timeline ({relatedActivities.length + 1})
            </button>
            <button
              className={`filter-btn ${activeTab === 'delegation' ? 'active' : ''}`}
              onClick={() => setActiveTab('delegation')}
            >
              ⚡ Delegation Matrix ({opp.delegatedDepartment})
            </button>
            <button
              className={`filter-btn ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              📂 Stage Documents ({relatedDocs.length})
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="btn btn-secondary btn-xs"
              onClick={() => {
                closeModal();
                openModal('delegationMatrix', opp);
              }}
            >
              <GitPullRequest size={12} style={{ color: '#d97706' }} />
              <span>Update Delegation</span>
            </button>
            <button
              className="btn btn-primary btn-xs"
              onClick={() => {
                closeModal();
                openModal('addActivity', { clientId: opp.clientId, opportunityId: opp.id, clientType: opp.clientType });
              }}
            >
              <Plus size={12} />
              <span>+ Log Activity &amp; Delegation</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="modal-body-section" style={{ padding: '20px 24px', overflowY: 'auto' }}>
          {/* TAB 1: Complete Inception Lifecycle Timeline */}
          {activeTab === 'timeline' && (
            <div>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>DEAL DELEGATION &amp; GOVERNANCE STATUS</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    Department: <span style={{ color: '#0284c7' }}>{opp.delegatedDepartment}</span> • Owner: <strong>{opp.delegatedOwner}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Milestone: {opp.delegationMilestone}
                  </div>
                  {opp.delegationRemarks && (
                    <div style={{ fontSize: '11.5px', color: '#166534', background: '#f0fdf4', padding: '4px 8px', borderRadius: '4px', marginTop: '4px' }}>
                      <strong>Approval / Handoff Remarks:</strong> {opp.delegationRemarks}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="pill-badge" style={{ background: delBadge.bg, color: delBadge.text, fontWeight: 700 }}>
                    {opp.delegationStatus}
                  </span>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    SLA: <strong>{opp.slaDaysRemaining} Days Left</strong>
                  </div>
                </div>
              </div>

              {/* Timeline Items */}
              <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #e2e8f0', marginLeft: '12px' }}>
                {/* 1. Inception Milestone */}
                <div style={{ position: 'relative', marginBottom: '24px' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '-31px',
                      top: '0',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#3b82f6',
                      border: '3px solid #ffffff',
                      boxShadow: '0 0 0 1px #93c5fd',
                    }}
                  />
                  <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '12px 14px', border: '1px solid #bfdbfe' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: '#1e40af' }}>🚩 Date of Inception — Deal Created</strong>
                      <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>{formatDate(opp.createdDate)}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#1e3a8a', margin: '4px 0 0' }}>
                      Opportunity identified by <strong>{opp.owner}</strong> for <strong>{opp.clientName}</strong> ({opp.segment}). Contract Type: <strong>{opp.contractType}</strong>.
                    </p>
                  </div>
                </div>

                {/* 2. All Activities chronologically */}
                {relatedActivities.map((act, idx) => (
                  <div key={act.id} style={{ position: 'relative', marginBottom: '24px' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: '-31px',
                        top: '0',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: act.type === 'Commercial Negotiation' ? '#d97706' : '#10b981',
                        border: '3px solid #ffffff',
                        boxShadow: '0 0 0 1px #cbd5e1',
                      }}
                    />
                    <div style={{ background: '#ffffff', borderRadius: '8px', padding: '12px 14px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-xs)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="pill-badge" style={{ background: '#f1f5f9', color: '#0f172a', fontWeight: 700, fontSize: '10.5px' }}>
                            {act.type}
                          </span>
                          <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>{act.contactPerson} ({act.location || 'Meeting'})</strong>
                        </div>
                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>{formatDate(act.date)} {act.time || ''}</span>
                      </div>

                      <div style={{ fontSize: '12px', color: '#334155', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', marginTop: '6px' }}>
                        <strong>Discussion:</strong> {act.keyDiscussion}
                      </div>

                      {act.outcome && (
                        <div style={{ fontSize: '11.5px', color: '#166534', marginTop: '6px' }}>
                          ✓ <strong>Outcome:</strong> {act.outcome}
                        </div>
                      )}

                      {act.actionItems && (
                        <div style={{ fontSize: '11.5px', color: '#0284c7', marginTop: '3px' }}>
                          ⏭ <strong>Next Action:</strong> {act.actionItems}
                        </div>
                      )}

                      <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '6px', textAlign: 'right' }}>
                        Conducted by {act.conductedBy}
                      </div>
                    </div>
                  </div>
                ))}

                {/* 3. Latest Status Milestone */}
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '-31px',
                      top: '0',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: opp.status === 'Won' ? '#16a34a' : opp.status === 'Lost' ? '#dc2626' : '#8b5cf6',
                      border: '3px solid #ffffff',
                      boxShadow: '0 0 0 1px #cbd5e1',
                    }}
                  />
                  <div style={{ background: '#faf5ff', borderRadius: '8px', padding: '12px 14px', border: '1px solid #e9d5ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: '#6b21a8' }}>
                        Current Status: {opp.stage} ({opp.status})
                      </strong>
                      <span style={{ fontSize: '11px', color: '#7e22ce', fontWeight: 600 }}>Target: {formatDate(opp.expectedCloseDate)}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#581c87', marginTop: '4px' }}>
                      Expected Value: <strong>{formatCurrency(opp.dealValueINR, currency)}</strong> • Monthly: <strong>{formatCurrency(opp.monthlyValueINR, currency)}/mo</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Delegation Matrix */}
          {activeTab === 'delegation' && (
            <div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                  Cross-Department Delegation Matrix &amp; Hand-Off
                </h4>

                <div className="form-grid-2" style={{ gap: '14px', marginBottom: '14px' }}>
                  <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Assigned Department</span>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>
                      {opp.delegatedDepartment}
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Responsible Owner</span>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                      {opp.delegatedOwner}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Current Milestone Deliverable</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                    {opp.delegationMilestone}
                  </div>
                </div>

                {opp.delegationRemarks && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '6px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '11px', color: '#166534', fontWeight: 700 }}>Approval / Delegation Conditions &amp; Remarks</span>
                    <div style={{ fontSize: '12.5px', color: '#14532d', marginTop: '2px' }}>
                      {opp.delegationRemarks}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="pill-badge" style={{ background: delBadge.bg, color: delBadge.text, fontWeight: 700 }}>
                      {opp.delegationStatus}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      SLA Target: <strong>{opp.slaDaysRemaining} Days Left</strong>
                    </span>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      closeModal();
                      openModal('delegationMatrix', opp);
                    }}
                  >
                    <GitPullRequest size={13} />
                    <span>Change Delegation Matrix</span>
                  </button>
                </div>
              </div>

              {/* Linked Internal Department Tasks */}
              <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
                Linked Internal Department Workflows ({relatedTasks.length})
              </h5>
              {relatedTasks.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', padding: '16px' }}>
                  No internal tasks linked yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {relatedTasks.map((t) => (
                    <div key={t.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '12.5px', color: '#0f172a' }}>{t.title}</span>
                        <span className="pill-badge" style={{ background: t.status === 'Approved' ? '#dcfce7' : '#fef3c7', color: t.status === 'Approved' ? '#16a34a' : '#d97706' }}>
                          {t.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                        Dept: <strong>{t.department}</strong> • Assigned To: <strong>{t.assignedTo}</strong> • Due: {formatDate(t.dueDate)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Stage Documents */}
          {activeTab === 'documents' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Stage Documents &amp; Scope Attachments ({relatedDocs.length})
                </h4>
                <button
                  className="btn btn-primary btn-xs"
                  onClick={() => {
                    closeModal();
                    openModal('uploadDoc', { opportunityId: opp.id });
                  }}
                >
                  <Upload size={12} />
                  <span>+ Upload Stage File</span>
                </button>
              </div>

              {relatedDocs.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '30px', background: '#f8fafc', borderRadius: '8px' }}>
                  No documents uploaded for this deal yet. Click above to attach RFP scope or contract.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {relatedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                          {doc.fileExtension.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{doc.name}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                            Stage: <strong>{doc.stage}</strong> • Type: {doc.documentType} • Size: {doc.fileSize}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => {
                            closeModal();
                            openModal('editDoc', doc);
                          }}
                        >
                          Rename / Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="modal-footer-section">
          <button type="button" className="btn btn-secondary" onClick={closeModal}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
