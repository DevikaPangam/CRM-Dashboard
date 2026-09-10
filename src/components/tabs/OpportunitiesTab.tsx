import React, { useState, useMemo } from 'react';
import {
  GitBranch, Plus, FileSpreadsheet, Search, TrendingUp, Calendar, Trash2,
  GitPullRequest, Upload, FileText, CheckCircle2, Clock, AlertTriangle, ArrowRight, ShieldCheck,
  History, Info, Eye
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useRBAC } from '../../context/RBACContext';
import { formatCurrency, formatDate, getStageBadgeClass } from '../../utils/formatters';
import { scopeRecordsByUserRole } from '../../utils/rbacPermissions';
import { PIPELINE_STAGES, DEPARTMENTS } from '../../utils/seedData';
import { Opportunity } from '../../types/crm';

export const OpportunitiesTab: React.FC = () => {
  const {
    currentUser,
    opportunities,
    updateOpportunityStage,
    deleteOpportunity,
    currency,
    openModal,
    exportOpportunities,
    searchQuery,
    teamMembers,
    segments,
    documents,
    activities,
  } = useCRM();

  const { currentRole, canCreate, canEdit, canDelete, canExport, canAssign, canApprove } = useRBAC();

  const handleOpenAddOpp = () => {
    if (!canCreate('opportunities')) {
      alert('Security Policy Violation: You do not have permission to create opportunities.');
      return;
    }
    openModal('addOpportunity');
  };

  const handleExportOpps = () => {
    if (!canExport('opportunities')) {
      alert('Security Policy Violation: You do not have permission to export opportunity data.');
      return;
    }
    exportOpportunities();
  };

  const handleDeleteOpp = (id: string, title: string) => {
    if (!canDelete('opportunities')) {
      alert('Security Policy Violation: You do not have permission to delete opportunities.');
      return;
    }
    if (window.confirm(`Delete opportunity "${title}"?`)) {
      deleteOpportunity(id);
    }
  };

  const [viewMode, setViewMode] = useState<'pipeline' | 'delegation'>('pipeline');
  const [stageFilter, setStageFilter] = useState('All');
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [clientTypeFilter, setClientTypeFilter] = useState('All');
  const [localSearch, setLocalSearch] = useState('');

  // Hover popover state
  const [hoveredOpp, setHoveredOpp] = useState<{ opp: Opportunity; x: number; y: number } | null>(null);

  const effectiveSearch = (searchQuery || localSearch).toLowerCase();

  const scopedOpps = useMemo(() => {
    return scopeRecordsByUserRole(opportunities, currentUser, currentRole, 'owner');
  }, [opportunities, currentUser, currentRole]);

  const filteredOpps = scopedOpps.filter((opp) => {
    if (stageFilter !== 'All' && opp.stage !== stageFilter) return false;
    if (segmentFilter !== 'All' && opp.segment !== segmentFilter) return false;
    if (deptFilter !== 'All' && opp.delegatedDepartment !== deptFilter) return false;
    if (clientTypeFilter !== 'All' && opp.clientType !== clientTypeFilter) return false;
    if (effectiveSearch) {
      const matchTitle = opp.title.toLowerCase().includes(effectiveSearch);
      const matchClient = opp.clientName.toLowerCase().includes(effectiveSearch);
      const matchCode = (opp.code || opp.id).toLowerCase().includes(effectiveSearch);
      const matchOwner = opp.owner.toLowerCase().includes(effectiveSearch);
      const matchDelegate = (opp.delegatedOwner || '').toLowerCase().includes(effectiveSearch);
      return matchTitle || matchClient || matchCode || matchOwner || matchDelegate;
    }
    return true;
  });

  const getDelegationStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved & Handed Off':
      case 'Action Completed':
        return { bg: '#dcfce7', text: '#16a34a', border: '#a7f3d0' };
      case 'In Review':
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
      case 'Escalated':
        return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' };
      case 'Rejected':
        return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
    }
  };

  const getLatestActivity = (oppId: string, clientId: string) => {
    const matched = activities.filter((a) => a.opportunityId === oppId || a.clientId === clientId);
    return matched[0] || null;
  };

  return (
    <section>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
            Leads, Opportunity Pipeline &amp; Delegation Matrix
          </h2>
          <p style={{ fontSize: '12.5px', color: '#64748b' }}>
            Hover on any line item to preview activity details • Click any row to view complete timeline from date of inception
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View Mode Switcher */}
          <div style={{ background: '#e2e8f0', borderRadius: '8px', padding: '3px', display: 'flex', gap: '3px' }}>
            <button
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: viewMode === 'pipeline' ? '#ffffff' : 'transparent',
                color: viewMode === 'pipeline' ? '#0284c7' : '#64748b',
                boxShadow: viewMode === 'pipeline' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              onClick={() => setViewMode('pipeline')}
            >
              Pipeline Table
            </button>
            <button
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: viewMode === 'delegation' ? '#ffffff' : 'transparent',
                color: viewMode === 'delegation' ? '#0284c7' : '#64748b',
                boxShadow: viewMode === 'delegation' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              onClick={() => setViewMode('delegation')}
            >
              Delegation Matrix View
            </button>
          </div>

          {canCreate('opportunities') && (
            <button className="btn btn-primary" onClick={handleOpenAddOpp}>
              <Plus size={15} />
              <span>+ Add Opportunity</span>
            </button>
          )}
          {canExport('opportunities') && (
            <button className="btn btn-secondary" onClick={handleExportOpps}>
              <FileSpreadsheet size={15} />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-group">
          <div className="filter-item">
            <Search size={14} style={{ color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search opportunity title, client, delegate..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ width: '220px' }}
            />
          </div>

          <div className="filter-item">
            <label>Client Type:</label>
            <select value={clientTypeFilter} onChange={(e) => setClientTypeFilter(e.target.value)}>
              <option value="All">All Clients</option>
              <option value="New Client">New Client</option>
              <option value="Existing Client">Existing Client</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Stage:</label>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
              <option value="All">All Stages</option>
              {PIPELINE_STAGES.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Delegated Dept:</label>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="All">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Segment:</label>
            <select value={segmentFilter} onChange={(e) => setSegmentFilter(e.target.value)}>
              <option value="All">All Segments</option>
              {segments.map((seg) => (
                <option key={seg.id} value={seg.name}>
                  {seg.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
          {filteredOpps.length} Opportunities
        </span>
      </div>

      {/* VIEW 1: Standard Opportunity Pipeline Table */}
      {viewMode === 'pipeline' && (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Opportunity Code &amp; Title</th>
                  <th>Client &amp; Type</th>
                  <th>Segment</th>
                  <th>Annual Deal Value</th>
                  <th>Monthly Rev</th>
                  <th>Pipeline Stage</th>
                  <th>Probability</th>
                  <th>Delegation Status</th>
                  <th>Target Close</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOpps.map((opp) => {
                  const badge = getStageBadgeClass(opp.stage);
                  const isNew = opp.clientType === 'New Client';
                  const delBadge = getDelegationStatusBadge(opp.delegationStatus);
                  const oppDocs = documents.filter((d) => d.opportunityId === opp.id);

                  return (
                    <tr
                      key={opp.id}
                      style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                      onClick={() => openModal('dealInception', opp)}
                      onMouseEnter={(e) => setHoveredOpp({ opp, x: e.clientX, y: e.clientY })}
                      onMouseMove={(e) => setHoveredOpp((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null))}
                      onMouseLeave={() => setHoveredOpp(null)}
                    >
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{opp.title}</div>
                        <div style={{ fontSize: '11px', color: '#0284c7', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {opp.code || opp.id}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{opp.clientName}</div>
                        <span
                          className="pill-badge"
                          style={{
                            background: isNew ? '#e0f2fe' : '#ecfdf5',
                            color: isNew ? '#0369a1' : '#047857',
                            border: `1px solid ${isNew ? '#bae6fd' : '#a7f3d0'}`,
                            fontSize: '10px',
                            marginTop: '2px',
                          }}
                        >
                          {isNew ? '★ New' : '✓ Existing'}
                        </span>
                      </td>
                      <td>
                        <span className="pill-badge" style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
                          {opp.segment}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{formatCurrency(opp.dealValueINR, currency)}</strong>
                      </td>
                      <td>
                        <span style={{ color: '#64748b' }}>{formatCurrency(opp.monthlyValueINR, currency)}</span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: `1px solid ${badge.border}`,
                            background: badge.bg,
                            color: badge.text,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                          value={opp.stage}
                          onChange={(e) => updateOpportunityStage(opp.id, e.target.value)}
                        >
                          {PIPELINE_STAGES.map((stg) => (
                            <option key={stg} value={stg}>
                              {stg}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div
                            style={{
                              height: '6px',
                              background: '#e2e8f0',
                              borderRadius: '999px',
                              overflow: 'hidden',
                              width: '40px',
                            }}
                          >
                            <div
                              style={{
                                width: `${opp.probability}%`,
                                height: '100%',
                                background: opp.probability > 70 ? '#10b981' : opp.probability > 40 ? '#3b82f6' : '#f59e0b',
                              }}
                            />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '11.5px' }}>{opp.probability}%</span>
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          style={{
                            background: delBadge.bg,
                            color: delBadge.text,
                            border: `1px solid ${delBadge.border}`,
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          onClick={() => openModal('delegationMatrix', opp)}
                          title="Click to update Delegation Matrix"
                        >
                          <GitPullRequest size={11} />
                          <span>{opp.delegatedDepartment}: {opp.delegationStatus}</span>
                        </button>
                      </td>
                      <td>{formatDate(opp.expectedCloseDate)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <button
                            className="btn btn-secondary btn-xs"
                            title="View Inception & All Activities"
                            onClick={() => openModal('dealInception', opp)}
                          >
                            <History size={12} style={{ color: '#0284c7' }} />
                          </button>
                          {canApprove('opportunities') && (
                            <button
                              className="btn btn-secondary btn-xs"
                              title="Approve / Reject Deal Terms & Remarks"
                              onClick={() => openModal('approvalModal', { type: 'opportunity', item: opp })}
                              style={{
                                color: opp.approvalStatus === 'Approved' ? '#16a34a' : opp.approvalStatus === 'Rejected' ? '#dc2626' : '#d97706',
                                borderColor: opp.approvalStatus === 'Approved' ? '#bbf7d0' : opp.approvalStatus === 'Rejected' ? '#fecaca' : '#e2e8f0',
                              }}
                            >
                              <ShieldCheck size={12} />
                            </button>
                          )}
                          {canCreate('documents') && (
                            <button
                              className="btn btn-secondary btn-xs"
                              title="Upload / View Stage Documents"
                              onClick={() => openModal('uploadDoc', { opportunityId: opp.id })}
                            >
                              <Upload size={12} style={{ color: '#ec4899' }} />
                              {oppDocs.length > 0 && <span style={{ fontSize: '10px' }}>({oppDocs.length})</span>}
                            </button>
                          )}
                          {canCreate('activities') && (
                            <button
                              className="btn btn-secondary btn-xs"
                              title="Log Interaction Activity & Delegation"
                              onClick={() => openModal('addActivity', { clientId: opp.clientId, opportunityId: opp.id, clientType: opp.clientType })}
                            >
                              <Calendar size={12} style={{ color: '#0284c7' }} />
                            </button>
                          )}
                          {canDelete('opportunities') && (
                            <button
                              className="btn btn-secondary btn-xs"
                              style={{ color: '#dc2626' }}
                              title="Delete Opportunity"
                              onClick={() => handleDeleteOpp(opp.id, opp.title)}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Delegation Matrix Governance View */}
      {viewMode === 'delegation' && (
        <div className="table-card">
          <div className="table-header-bar" style={{ background: '#f8fafc' }}>
            <div className="table-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitPullRequest size={16} style={{ color: '#0284c7' }} />
              <span>Cross-Department Delegation Matrix &amp; SLA Status</span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Opportunity &amp; Stage</th>
                  <th>Client &amp; Type</th>
                  <th>Delegated Department</th>
                  <th>Responsible Delegate</th>
                  <th>Current Milestone Action Item</th>
                  <th>Delegation Status</th>
                  <th>SLA Target</th>
                  <th>Update Delegation</th>
                </tr>
              </thead>
              <tbody>
                {filteredOpps.map((opp) => {
                  const delBadge = getDelegationStatusBadge(opp.delegationStatus);
                  const isNew = opp.clientType === 'New Client';

                  return (
                    <tr
                      key={opp.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => openModal('dealInception', opp)}
                      onMouseEnter={(e) => setHoveredOpp({ opp, x: e.clientX, y: e.clientY })}
                      onMouseMove={(e) => setHoveredOpp((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null))}
                      onMouseLeave={() => setHoveredOpp(null)}
                    >
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{opp.title}</div>
                        <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>
                          Stage: <strong>{opp.stage}</strong>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{opp.clientName}</div>
                        <span
                          className="pill-badge"
                          style={{
                            background: isNew ? '#e0f2fe' : '#ecfdf5',
                            color: isNew ? '#0369a1' : '#047857',
                            fontSize: '10px',
                          }}
                        >
                          {isNew ? 'New Client' : 'Existing Client'}
                        </span>
                      </td>
                      <td>
                        <span
                          className="pill-badge"
                          style={{ background: '#f8fafc', color: '#0284c7', border: '1px solid #bae6fd', fontWeight: 700 }}
                        >
                          {opp.delegatedDepartment}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{opp.delegatedOwner}</strong>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#334155', maxWidth: '300px' }}>
                          {opp.delegationMilestone}
                        </div>
                      </td>
                      <td>
                        <span
                          className="pill-badge"
                          style={{ background: delBadge.bg, color: delBadge.text, borderColor: delBadge.border, fontWeight: 700 }}
                        >
                          {opp.delegationStatus}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} style={{ color: opp.slaDaysRemaining <= 1 ? '#dc2626' : '#64748b' }} />
                          <strong style={{ color: opp.slaDaysRemaining <= 1 ? '#dc2626' : '#0f172a' }}>
                            {opp.slaDaysRemaining} Days Left
                          </strong>
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => openModal('delegationMatrix', opp)}
                          >
                            <GitPullRequest size={12} />
                            <span>Delegate</span>
                          </button>
                          <button
                            className="btn btn-secondary btn-xs"
                            title="View Inception & All Activities"
                            onClick={() => openModal('dealInception', opp)}
                          >
                            <History size={12} style={{ color: '#0284c7' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Hover Activity Details Card */}
      {hoveredOpp && (
        <div
          style={{
            position: 'fixed',
            top: Math.min(hoveredOpp.y + 14, window.innerHeight - 310),
            left: Math.min(hoveredOpp.x + 14, window.innerWidth - 370),
            width: '350px',
            background: '#0f172a',
            color: '#f8fafc',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            pointerEvents: 'none',
            border: '1px solid #334155',
            fontSize: '12px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#38bdf8' }}>
                {hoveredOpp.opp.title}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {hoveredOpp.opp.clientName} ({hoveredOpp.opp.clientType || 'Client'})
              </div>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                background: '#1e293b',
                color: '#38bdf8',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #0284c7',
              }}
            >
              {hoveredOpp.opp.stage}
            </span>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <div>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Annual Value:</span>
              <div style={{ fontWeight: 700, color: '#4ade80' }}>
                {formatCurrency(hoveredOpp.opp.dealValueINR, currency)}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Delegated Dept:</span>
              <div style={{ fontWeight: 700, color: '#facc15' }}>
                {hoveredOpp.opp.delegatedDepartment}
              </div>
            </div>
          </div>

          {/* Latest Activity Snippet */}
          {(() => {
            const latestAct = getLatestActivity(hoveredOpp.opp.id, hoveredOpp.opp.clientId);
            return latestAct ? (
              <div style={{ background: '#1e293b', borderRadius: '6px', padding: '8px 10px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#38bdf8', fontWeight: 700, marginBottom: '2px' }}>
                  <span>Last Activity ({latestAct.type})</span>
                  <span style={{ color: '#94a3b8' }}>{formatDate(latestAct.date)}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>
                  {latestAct.keyDiscussion.slice(0, 110)}...
                </div>
                {latestAct.outcome && (
                  <div style={{ fontSize: '10.5px', color: '#4ade80', marginTop: '3px' }}>
                    ✓ Outcome: {latestAct.outcome}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: '#1e293b', borderRadius: '6px', padding: '8px 10px', marginBottom: '8px', fontSize: '11px', color: '#94a3b8' }}>
                Inception Date: {formatDate(hoveredOpp.opp.createdDate)} (No subsequent activities logged)
              </div>
            );
          })()}

          {/* Hint */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: '#94a3b8', borderTop: '1px solid #334155', paddingTop: '6px' }}>
            <Eye size={11} style={{ color: '#38bdf8' }} />
            <span>Click row to open all activities &amp; inception timeline</span>
          </div>
        </div>
      )}
    </section>
  );
};
